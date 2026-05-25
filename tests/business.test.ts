import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ScoreEventType } from "@prisma/client";
import { scoreValues } from "../src/lib/constants";
import { hashPassword } from "../src/lib/password";

const testDir = mkdtempSync(join(tmpdir(), "zhanwen-tests-"));
const databaseUrl = `file:${join(testDir, "test.db")}`;
process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = "test";

execFileSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: "ignore"
});

const [{ prisma }, business] = await Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/business")
]);

async function resetDb() {
  await prisma.scoreEvent.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.questionTag.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function createFixture() {
  const passwordHash = await hashPassword("password123");
  const [questionAuthor, answerAuthor, voter, outsider, admin] = await Promise.all(
    [
      { email: "questioner@example.com", name: "提问者" },
      { email: "answerer@example.com", name: "回答者" },
      { email: "voter@example.com", name: "点赞者" },
      { email: "outsider@example.com", name: "旁观者" },
      { email: "admin@example.com", name: "管理员", role: "ADMIN" as const }
    ].map((user) =>
      prisma.user.create({
        data: {
          ...user,
          passwordHash
        }
      })
    )
  );

  const question = await prisma.question.create({
    data: {
      title: "如何验证积分和采纳逻辑在事务中保持一致？",
      body: "这个问题用于测试业务逻辑，确保点赞、取消点赞、采纳和改采纳都会正确写入积分流水。",
      authorId: questionAuthor.id
    }
  });

  const answer = await prisma.answer.create({
    data: {
      questionId: question.id,
      authorId: answerAuthor.id,
      body: "这是一个用于测试的回答内容，长度足够满足业务校验以外的持久化场景。"
    }
  });

  const alternateAnswer = await prisma.answer.create({
    data: {
      questionId: question.id,
      authorId: outsider.id,
      body: "这是另一个用于测试改采纳的回答内容，保证旧答案积分会被扣回。"
    }
  });

  return { questionAuthor, answerAuthor, voter, outsider, admin, question, answer, alternateAnswer };
}

beforeEach(resetDb);

after(async () => {
  await prisma.$disconnect();
  rmSync(testDir, { recursive: true, force: true });
});

test("回答问题会创建回答并给回答者加分", async () => {
  const { question, answerAuthor } = await createFixture();

  const result = await business.createAnswerForUser({
    userId: answerAuthor.id,
    questionId: question.id,
    summary: "事务一致",
    body: "新增回答时应该同时写入回答记录、积分流水，并更新回答者总积分。"
  });

  assert.equal(result.status, "created");

  const [answers, user, event] = await Promise.all([
    prisma.answer.count({ where: { questionId: question.id, authorId: answerAuthor.id } }),
    prisma.user.findUniqueOrThrow({ where: { id: answerAuthor.id } }),
    prisma.scoreEvent.findFirstOrThrow({
      where: {
        userId: answerAuthor.id,
        type: ScoreEventType.ANSWER_CREATED
      }
    })
  ]);

  assert.equal(answers, 2);
  assert.equal(user.score, scoreValues.answerCreated);
  assert.equal(event.points, scoreValues.answerCreated);
});

test("问题点赞可以取消，并同步加减作者积分", async () => {
  const { questionAuthor, voter, question } = await createFixture();

  const voted = await business.toggleQuestionVoteForUser(voter.id, question.id);
  assert.equal(voted.status, "voted");

  let author = await prisma.user.findUniqueOrThrow({ where: { id: questionAuthor.id } });
  let votes = await prisma.vote.count({ where: { questionId: question.id } });
  assert.equal(author.score, scoreValues.upvote);
  assert.equal(votes, 1);

  const unvoted = await business.toggleQuestionVoteForUser(voter.id, question.id);
  assert.equal(unvoted.status, "unvoted");

  author = await prisma.user.findUniqueOrThrow({ where: { id: questionAuthor.id } });
  votes = await prisma.vote.count({ where: { questionId: question.id } });
  const events = await prisma.scoreEvent.findMany({
    where: { userId: questionAuthor.id },
    orderBy: { createdAt: "asc" }
  });

  assert.equal(author.score, 0);
  assert.equal(votes, 0);
  assert.deepEqual(
    events.map((event) => event.type),
    [ScoreEventType.QUESTION_UPVOTED, ScoreEventType.QUESTION_UNVOTED]
  );
});

test("不能给自己的问题或回答点赞", async () => {
  const { questionAuthor, answerAuthor, question, answer } = await createFixture();

  const questionVote = await business.toggleQuestionVoteForUser(questionAuthor.id, question.id);
  const answerVote = await business.toggleAnswerVoteForUser(answerAuthor.id, answer.id);

  assert.equal(questionVote.status, "self-vote");
  assert.equal(answerVote.status, "self-vote");
  assert.equal(await prisma.vote.count(), 0);
  assert.equal(await prisma.scoreEvent.count(), 0);
});

test("采纳和改采纳会给新答案加分并扣回旧答案积分", async () => {
  const { questionAuthor, answerAuthor, outsider, question, answer, alternateAnswer } = await createFixture();

  const accepted = await business.acceptAnswerForUser(questionAuthor.id, answer.id);
  assert.equal(accepted.status, "accepted");

  let firstAuthor = await prisma.user.findUniqueOrThrow({ where: { id: answerAuthor.id } });
  let secondAuthor = await prisma.user.findUniqueOrThrow({ where: { id: outsider.id } });
  let savedQuestion = await prisma.question.findUniqueOrThrow({ where: { id: question.id } });
  assert.equal(firstAuthor.score, scoreValues.acceptedAnswer);
  assert.equal(secondAuthor.score, 0);
  assert.equal(savedQuestion.acceptedAnswerId, answer.id);

  const switched = await business.acceptAnswerForUser(questionAuthor.id, alternateAnswer.id);
  assert.equal(switched.status, "accepted");

  firstAuthor = await prisma.user.findUniqueOrThrow({ where: { id: answerAuthor.id } });
  secondAuthor = await prisma.user.findUniqueOrThrow({ where: { id: outsider.id } });
  savedQuestion = await prisma.question.findUniqueOrThrow({ where: { id: question.id } });
  const events = await prisma.scoreEvent.findMany({
    where: { questionId: question.id },
    orderBy: { createdAt: "asc" }
  });

  assert.equal(firstAuthor.score, 0);
  assert.equal(secondAuthor.score, scoreValues.acceptedAnswer);
  assert.equal(savedQuestion.acceptedAnswerId, alternateAnswer.id);
  assert.deepEqual(
    events.map((event) => event.type),
    [
      ScoreEventType.ANSWER_ACCEPTED,
      ScoreEventType.ANSWER_UNACCEPTED,
      ScoreEventType.ANSWER_ACCEPTED
    ]
  );
});

test("非提问者不能采纳答案", async () => {
  const { outsider, answer } = await createFixture();

  const result = await business.acceptAnswerForUser(outsider.id, answer.id);

  assert.equal(result.status, "no-permission");
  assert.equal(await prisma.scoreEvent.count(), 0);
});

test("管理员可以停用用户并清理会话", async () => {
  const { admin, voter } = await createFixture();
  await prisma.session.create({
    data: {
      tokenHash: "test-token",
      userId: voter.id,
      expiresAt: new Date(Date.now() + 60_000)
    }
  });

  const result = await business.setUserActiveForAdmin(admin.id, voter.id, false);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: voter.id } });
  assert.equal(result.status, "updated");
  assert.equal(user.isActive, false);
  assert.equal(await prisma.session.count({ where: { userId: voter.id } }), 0);
});

test("管理员不能停用自己", async () => {
  const { admin } = await createFixture();

  const result = await business.setUserActiveForAdmin(admin.id, admin.id, false);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
  assert.equal(result.status, "no-permission");
  assert.equal(user.isActive, true);
});

test("管理员可以修改用户资料和角色", async () => {
  const { admin, voter } = await createFixture();

  const result = await business.updateUserForAdmin({
    adminId: admin.id,
    userId: voter.id,
    name: "新版昵称",
    email: "new-voter@example.com",
    role: "ADMIN",
    active: true
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: voter.id } });
  assert.equal(result.status, "updated");
  assert.equal(user.name, "新版昵称");
  assert.equal(user.email, "new-voter@example.com");
  assert.equal(user.role, "ADMIN");
});

test("管理员修改用户邮箱时不能占用其他用户邮箱", async () => {
  const { admin, voter, answerAuthor } = await createFixture();

  const result = await business.updateUserForAdmin({
    adminId: admin.id,
    userId: voter.id,
    name: voter.name,
    email: answerAuthor.email,
    role: "USER",
    active: true
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: voter.id } });
  assert.equal(result.status, "conflict");
  assert.equal(user.email, voter.email);
});

test("管理员不能移除自己的管理员身份或停用自己", async () => {
  const { admin } = await createFixture();

  const demote = await business.updateUserForAdmin({
    adminId: admin.id,
    userId: admin.id,
    name: admin.name,
    email: admin.email,
    role: "USER",
    active: true
  });
  const deactivate = await business.updateUserForAdmin({
    adminId: admin.id,
    userId: admin.id,
    name: admin.name,
    email: admin.email,
    role: "ADMIN",
    active: false
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
  assert.equal(demote.status, "no-permission");
  assert.equal(deactivate.status, "no-permission");
  assert.equal(user.role, "ADMIN");
  assert.equal(user.isActive, true);
});

test("管理员重置密码会更新哈希并清理会话", async () => {
  const { admin, voter } = await createFixture();
  await prisma.session.create({
    data: {
      tokenHash: "password-reset-token",
      userId: voter.id,
      expiresAt: new Date(Date.now() + 60_000)
    }
  });

  const before = await prisma.user.findUniqueOrThrow({ where: { id: voter.id } });
  const result = await business.resetUserPasswordForAdmin({
    adminId: admin.id,
    userId: voter.id,
    password: "new-password"
  });

  const after = await prisma.user.findUniqueOrThrow({ where: { id: voter.id } });
  assert.equal(result.status, "updated");
  assert.notEqual(after.passwordHash, before.passwordHash);
  assert.equal(await prisma.session.count({ where: { userId: voter.id } }), 0);
});

test("非管理员不能管理用户或内容", async () => {
  const { voter, answerAuthor, question, answer } = await createFixture();

  const userResult = await business.setUserActiveForAdmin(voter.id, answerAuthor.id, false);
  const questionResult = await business.setQuestionHiddenForAdmin(voter.id, question.id, true);
  const answerResult = await business.setAnswerHiddenForAdmin(voter.id, answer.id, true);
  const profileResult = await business.updateUserForAdmin({
    adminId: voter.id,
    userId: answerAuthor.id,
    name: "非法修改",
    email: "illegal@example.com",
    role: "ADMIN",
    active: false
  });
  const passwordResult = await business.resetUserPasswordForAdmin({
    adminId: voter.id,
    userId: answerAuthor.id,
    password: "new-password"
  });

  const savedQuestion = await prisma.question.findUniqueOrThrow({ where: { id: question.id } });
  const savedAnswer = await prisma.answer.findUniqueOrThrow({ where: { id: answer.id } });
  const savedUser = await prisma.user.findUniqueOrThrow({ where: { id: answerAuthor.id } });
  assert.equal(userResult.status, "no-permission");
  assert.equal(questionResult.status, "no-permission");
  assert.equal(answerResult.status, "no-permission");
  assert.equal(profileResult.status, "no-permission");
  assert.equal(passwordResult.status, "no-permission");
  assert.equal(savedQuestion.hiddenAt, null);
  assert.equal(savedAnswer.hiddenAt, null);
  assert.equal(savedUser.isActive, true);
  assert.equal(savedUser.email, answerAuthor.email);
});

test("隐藏问题后不能继续点赞或回答", async () => {
  const { admin, voter, question, questionAuthor } = await createFixture();

  const hidden = await business.setQuestionHiddenForAdmin(admin.id, question.id, true);
  const vote = await business.toggleQuestionVoteForUser(voter.id, question.id);
  const answer = await business.createAnswerForUser({
    userId: voter.id,
    questionId: question.id,
    body: "隐藏后不能回答"
  });

  const savedQuestion = await prisma.question.findUniqueOrThrow({ where: { id: question.id } });
  const author = await prisma.user.findUniqueOrThrow({ where: { id: questionAuthor.id } });
  assert.equal(hidden.status, "updated");
  assert.ok(savedQuestion.hiddenAt);
  assert.equal(vote.status, "missing");
  assert.equal(answer.status, "missing");
  assert.equal(author.score, 0);
  assert.equal(await prisma.vote.count({ where: { questionId: question.id } }), 0);
});

test("隐藏回答会取消采纳并阻止点赞和采纳", async () => {
  const { admin, voter, questionAuthor, answerAuthor, question, answer } = await createFixture();
  await business.acceptAnswerForUser(questionAuthor.id, answer.id);

  const hidden = await business.setAnswerHiddenForAdmin(admin.id, answer.id, true);
  const vote = await business.toggleAnswerVoteForUser(voter.id, answer.id);
  const accepted = await business.acceptAnswerForUser(questionAuthor.id, answer.id);

  const savedAnswer = await prisma.answer.findUniqueOrThrow({ where: { id: answer.id } });
  const savedQuestion = await prisma.question.findUniqueOrThrow({ where: { id: question.id } });
  const author = await prisma.user.findUniqueOrThrow({ where: { id: answerAuthor.id } });
  assert.equal(hidden.status, "updated");
  assert.ok(savedAnswer.hiddenAt);
  assert.equal(savedQuestion.acceptedAnswerId, null);
  assert.equal(vote.status, "missing");
  assert.equal(accepted.status, "missing");
  assert.equal(author.score, 0);
});
