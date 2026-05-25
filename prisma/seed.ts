import { PrismaClient, ScoreEventType } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60 * 1000);

async function reset() {
  await prisma.scoreEvent.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.questionTag.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function score({
  userId,
  actorId,
  type,
  points,
  message,
  questionId,
  answerId
}: {
  userId: string;
  actorId?: string;
  type: ScoreEventType;
  points: number;
  message: string;
  questionId?: string;
  answerId?: string;
}) {
  await prisma.scoreEvent.create({
    data: {
      userId,
      actorId,
      type,
      points,
      message,
      questionId,
      answerId
    }
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      score: {
        increment: points
      }
    }
  });
}

async function main() {
  await reset();

  const passwordHash = await hashPassword("password123");
  const [admin, lin, zhou, gu, meng] = await Promise.all(
    [
      { name: "管理员", email: "admin@example.com", role: "ADMIN" as const },
      { name: "林越", email: "linyue@example.com" },
      { name: "周然", email: "zhouran@example.com" },
      { name: "顾澈", email: "guche@example.com" },
      { name: "孟舟", email: "mengzhou@example.com" }
    ].map((user) =>
      prisma.user.create({
        data: {
          ...user,
          passwordHash
        }
      })
    )
  );

  void admin;

  await prisma.tag.createMany({
    data: [
      { name: "生活", slug: "life" },
      { name: "居家", slug: "home" },
      { name: "学习", slug: "study" },
      { name: "职场", slug: "work" },
      { name: "沟通", slug: "communication" },
      { name: "消费", slug: "buying" },
      { name: "城市", slug: "city" },
      { name: "健康", slug: "health" }
    ]
  });

  const dampQuestion = await prisma.question.create({
    data: {
      title: "出租屋太潮，衣服总有味道，大家平时怎么快速除湿和防霉？",
      body: "房间不大，南方回南天明显。想找不占地方、成本不高、长期有效的方法，不只是临时开空调除湿。",
      details: "当前尝试：除湿袋、空调除湿、开窗通风\n问题：效果短，衣柜内部和床底依旧返潮\n目标：低成本、持续性、对租房友好",
      views: 1200,
      authorId: lin.id,
      createdAt: minutesAgo(12),
      tags: {
        create: [
          { tag: { connect: { slug: "life" } } },
          { tag: { connect: { slug: "home" } } }
        ]
      }
    }
  });
  await score({
    userId: lin.id,
    actorId: lin.id,
    type: ScoreEventType.QUESTION_CREATED,
    points: 10,
    message: "发布问题",
    questionId: dampQuestion.id
  });

  const dampAnswer = await prisma.answer.create({
    data: {
      questionId: dampQuestion.id,
      authorId: zhou.id,
      summary: "先控湿，再收纳，再通风",
      body: "先把潮气来源拆开看，地面返潮、空气湿度高、衣柜内部不通风，处理方式不一样。租房场景里最有效的是组合拳，除湿机放在衣柜外侧和房间中间，衣柜里加隔板或留通风缝。",
      createdAt: minutesAgo(8)
    }
  });
  await score({
    userId: zhou.id,
    actorId: zhou.id,
    type: ScoreEventType.ANSWER_CREATED,
    points: 15,
    message: "提交回答",
    questionId: dampQuestion.id,
    answerId: dampAnswer.id
  });
  await prisma.question.update({
    where: { id: dampQuestion.id },
    data: { acceptedAnswerId: dampAnswer.id }
  });
  await score({
    userId: zhou.id,
    actorId: lin.id,
    type: ScoreEventType.ANSWER_ACCEPTED,
    points: 25,
    message: "回答被采纳",
    questionId: dampQuestion.id,
    answerId: dampAnswer.id
  });

  const guAnswer = await prisma.answer.create({
    data: {
      questionId: dampQuestion.id,
      authorId: gu.id,
      summary: "先买湿度计，别凭感觉判断",
      body: "如果预算有限，可以先从湿度计入手。室内长期维持在 45% 到 60% 左右会舒服很多，超过这个范围霉味就容易回来。小预算方案可以从湿度计、简易除湿机、防潮垫开始。",
      createdAt: minutesAgo(5)
    }
  });
  await score({
    userId: gu.id,
    actorId: gu.id,
    type: ScoreEventType.ANSWER_CREATED,
    points: 15,
    message: "提交回答",
    questionId: dampQuestion.id,
    answerId: guAnswer.id
  });

  const focusQuestion = await prisma.question.create({
    data: {
      title: "备考时总是中途走神，怎么安排复习节奏更容易坚持到最后？",
      body: "每天能完整专注的时间不长，想要一个不靠意志硬撑的节奏表。最好是能兼顾复盘和间隔记忆。",
      views: 3800,
      authorId: meng.id,
      createdAt: minutesAgo(38),
      tags: {
        create: [{ tag: { connect: { slug: "study" } } }]
      }
    }
  });
  await score({
    userId: meng.id,
    actorId: meng.id,
    type: ScoreEventType.QUESTION_CREATED,
    points: 10,
    message: "发布问题",
    questionId: focusQuestion.id
  });

  const workQuestion = await prisma.question.create({
    data: {
      title: "和同事协作时总是信息对不上，怎么把沟通变得更清楚一点？",
      body: "需求经常口头变动，邮件和聊天记录分散，最后总要反复确认。想建立一套更稳定的沟通习惯。",
      views: 812,
      authorId: gu.id,
      createdAt: minutesAgo(60),
      tags: {
        create: [
          { tag: { connect: { slug: "work" } } },
          { tag: { connect: { slug: "communication" } } }
        ]
      }
    }
  });
  await score({
    userId: gu.id,
    actorId: gu.id,
    type: ScoreEventType.QUESTION_CREATED,
    points: 10,
    message: "发布问题",
    questionId: workQuestion.id
  });

  const purifierQuestion = await prisma.question.create({
    data: {
      title: "家里要换净水器，前置、RO、超滤到底怎么选更省心？",
      body: "家里两位老人一台洗碗机，预算不是最紧，但想少踩坑。售前说法很多，想听真实使用经验。",
      views: 354,
      authorId: lin.id,
      createdAt: minutesAgo(120),
      tags: {
        create: [{ tag: { connect: { slug: "buying" } } }]
      }
    }
  });
  await score({
    userId: lin.id,
    actorId: lin.id,
    type: ScoreEventType.QUESTION_CREATED,
    points: 10,
    message: "发布问题",
    questionId: purifierQuestion.id
  });

  const cityQuestion = await prisma.question.create({
    data: {
      title: "第一次在新城市租房，怎么判断通勤、噪音和周边配套值不值得？",
      body: "网上地图看着都差不多，真住进去才会发现问题。希望有一套更系统的看房和踩点方法。",
      views: 1100,
      authorId: zhou.id,
      createdAt: minutesAgo(1500),
      tags: {
        create: [
          { tag: { connect: { slug: "city" } } },
          { tag: { connect: { slug: "life" } } }
        ]
      }
    }
  });
  await score({
    userId: zhou.id,
    actorId: zhou.id,
    type: ScoreEventType.QUESTION_CREATED,
    points: 10,
    message: "发布问题",
    questionId: cityQuestion.id
  });

  const cityAnswer = await prisma.answer.create({
    data: {
      questionId: cityQuestion.id,
      authorId: gu.id,
      summary: "先看通勤峰值，再看夜间噪音",
      body: "不要只看地图距离。最好在工作日早晚高峰各走一次路线，晚上再去楼下停留十分钟听噪音。周边配套看三类：日常买菜、临时就医和夜间安全感。",
      createdAt: minutesAgo(1300)
    }
  });
  await score({
    userId: gu.id,
    actorId: gu.id,
    type: ScoreEventType.ANSWER_CREATED,
    points: 15,
    message: "提交回答",
    questionId: cityQuestion.id,
    answerId: cityAnswer.id
  });
  await prisma.question.update({
    where: { id: cityQuestion.id },
    data: { acceptedAnswerId: cityAnswer.id }
  });
  await score({
    userId: gu.id,
    actorId: zhou.id,
    type: ScoreEventType.ANSWER_ACCEPTED,
    points: 25,
    message: "回答被采纳",
    questionId: cityQuestion.id,
    answerId: cityAnswer.id
  });

  const transitionQuestion = await prisma.question.create({
    data: {
      title: "转岗前该怎么判断自己适不适合新方向？",
      body: "不是单纯看工资，也不想跟风。更想知道怎么结合兴趣、能力和现实条件做判断。",
      views: 128,
      authorId: meng.id,
      createdAt: minutesAgo(2),
      tags: {
        create: [
          { tag: { connect: { slug: "study" } } },
          { tag: { connect: { slug: "work" } } }
        ]
      }
    }
  });
  await score({
    userId: meng.id,
    actorId: meng.id,
    type: ScoreEventType.QUESTION_CREATED,
    points: 10,
    message: "发布问题",
    questionId: transitionQuestion.id
  });

  const seededVotes = [
    { actor: zhou, question: dampQuestion, owner: lin },
    { actor: gu, question: dampQuestion, owner: lin },
    { actor: meng, question: dampQuestion, owner: lin },
    { actor: lin, answer: dampAnswer, owner: zhou, question: dampQuestion },
    { actor: gu, answer: dampAnswer, owner: zhou, question: dampQuestion },
    { actor: meng, answer: dampAnswer, owner: zhou, question: dampQuestion },
    { actor: lin, answer: guAnswer, owner: gu, question: dampQuestion },
    { actor: lin, question: workQuestion, owner: gu },
    { actor: zhou, question: workQuestion, owner: gu },
    { actor: lin, question: cityQuestion, owner: zhou }
  ];

  for (const item of seededVotes) {
    if (item.answer) {
      await prisma.vote.create({
        data: {
          userId: item.actor.id,
          answerId: item.answer.id
        }
      });
      await score({
        userId: item.owner.id,
        actorId: item.actor.id,
        type: ScoreEventType.ANSWER_UPVOTED,
        points: 2,
        message: "回答获得点赞",
        questionId: item.question.id,
        answerId: item.answer.id
      });
    } else {
      await prisma.vote.create({
        data: {
          userId: item.actor.id,
          questionId: item.question.id
        }
      });
      await score({
        userId: item.owner.id,
        actorId: item.actor.id,
        type: ScoreEventType.QUESTION_UPVOTED,
        points: 2,
        message: "问题获得点赞",
        questionId: item.question.id
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
