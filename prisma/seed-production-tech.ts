import { PrismaClient, ScoreEventType } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000);

const users = [
  { name: "许知远", email: "xuzhiyuan.tech@example.com" },
  { name: "沈南星", email: "shennanxing.tech@example.com" },
  { name: "陆清河", email: "luqinghe.tech@example.com" },
  { name: "秦牧", email: "qinmu.tech@example.com" },
  { name: "韩舟", email: "hanzhou.tech@example.com" }
];

const tags = [
  { name: "Next.js", slug: "nextjs" },
  { name: "React", slug: "react" },
  { name: "TypeScript", slug: "typescript" },
  { name: "Prisma", slug: "prisma" },
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "性能优化", slug: "performance" },
  { name: "Vercel", slug: "vercel" },
  { name: "数据库", slug: "database" },
  { name: "前端工程", slug: "frontend" },
  { name: "Node.js", slug: "nodejs" }
];

const questions = [
  {
    title: "Next.js App Router 里页面首屏慢，怎么判断是数据库慢还是组件渲染慢？",
    body: "生产环境部署在 Vercel，数据库是 Neon。列表页偶尔首屏等待很久，想知道应该从哪些指标和日志开始排查。",
    details:
      "目前能看到的问题：本地很快，生产环境慢；页面使用 Server Components 查询数据库；没有接入 APM。希望先用低成本方式定位瓶颈。",
    author: 0,
    tags: ["nextjs", "vercel", "performance"],
    views: 2480,
    createdAt: hoursAgo(2),
    answers: [
      {
        author: 1,
        summary: "先把链路拆成构建、函数冷启动、SQL 和渲染",
        body:
          "建议先在 Server Component 的数据入口加耗时日志，把数据库查询、业务组装和页面渲染前的数据准备分开记录。Vercel 里再对比函数区域和数据库区域，如果跨区域访问，单次查询延迟会被放大。列表页优先检查 N+1 查询、未命中索引和过大的 include。",
        accepted: true,
        createdAt: hoursAgo(1.5)
      },
      {
        author: 2,
        summary: "用 explain analyze 看真实 SQL 成本",
        body:
          "Prisma 查询慢时不要只看代码结构，打开 query log 或复制 SQL 到数据库里跑 explain analyze。常见问题是 order by createdAt 配合过滤条件没有合适索引，或者分页用了 skip 导致深分页越来越慢。",
        createdAt: hoursAgo(1.2)
      }
    ]
  },
  {
    title: "Prisma 在 Vercel Serverless 上需要连接池吗？Neon 的 pooled URL 应该怎么用？",
    body: "项目用 Prisma + Neon，看到 Neon 有 pooled 和 unpooled 两种连接串。应用运行和迁移是不是应该使用不同连接？",
    details:
      "担心 serverless 并发时连接数打满，也担心 migrate deploy 用 pooled URL 出问题。",
    author: 2,
    tags: ["prisma", "postgresql", "database", "vercel"],
    views: 1930,
    createdAt: hoursAgo(5),
    answers: [
      {
        author: 3,
        summary: "运行用 pooled，迁移和备份优先用 direct",
        body:
          "Serverless 运行时通常用 pooled URL，能降低连接数压力。迁移、pg_dump、pg_restore 这类长连接或需要会话语义的操作，建议用 direct/unpooled URL。Prisma schema 里可以只保留 DATABASE_URL，但部署流程要明确这个 URL 当前服务于应用还是迁移。",
        accepted: true,
        createdAt: hoursAgo(4.5)
      }
    ]
  },
  {
    title: "TypeScript 里表单校验用 zod 后，Server Action 返回错误状态怎么设计更清晰？",
    body: "现在 Server Action 里有很多 try/catch 和字段校验，页面组件需要显示 toast 和字段级错误。想让类型更稳定一点。",
    details:
      "希望避免 action 返回 any，也不想每个表单都复制一套错误处理逻辑。",
    author: 1,
    tags: ["typescript", "react", "nextjs"],
    views: 860,
    createdAt: hoursAgo(9),
    answers: [
      {
        author: 0,
        summary: "把 action 结果收敛成判别联合类型",
        body:
          "可以定义 ActionResult<T>，例如 success true 时带 data，success false 时带 message 和 fieldErrors。zod 的 flatten 结果适合转成 Record<string, string[]>。组件只依赖这个稳定结构，不需要理解每个 action 内部抛了什么。",
        createdAt: hoursAgo(8.5)
      }
    ]
  },
  {
    title: "PostgreSQL 里问题列表按热度排序，views、点赞、回答数应该实时算还是冗余存字段？",
    body: "问答社区首页想支持热门排序。现在问题表有 views，点赞和回答数都来自关联表 count。数据量小的时候没事，后面担心查询越来越重。",
    details:
      "热门公式可能是 views + votes * 3 + answers * 5，并且要按时间衰减。",
    author: 3,
    tags: ["postgresql", "database", "performance"],
    views: 1470,
    createdAt: hoursAgo(14),
    answers: [
      {
        author: 4,
        summary: "MVP 先实时 count，出现慢查询再冗余",
        body:
          "如果数据量还小，先保持实时计算，配好 questionId、answerId、createdAt 等索引。等热门页成为高频入口，再考虑冗余 answerCount、voteCount 或定时计算 hotScore。过早冗余会带来一致性成本，尤其是取消点赞和隐藏内容时容易漏更新。",
        accepted: true,
        createdAt: hoursAgo(13.5)
      }
    ]
  },
  {
    title: "React 富文本编辑器提交 HTML，服务端需要做哪些安全处理？",
    body: "前端用了富文本编辑器，提交后直接渲染回答内容。现在内容主要是用户自己输入的 HTML，担心 XSS。",
    details:
      "想知道是在客户端过滤、服务端过滤，还是渲染时过滤。项目是 Next.js。",
    author: 4,
    tags: ["react", "nextjs", "frontend"],
    views: 2320,
    createdAt: hoursAgo(20),
    answers: [
      {
        author: 0,
        summary: "服务端入库前过滤，渲染前仍保持保守白名单",
        body:
          "不要信任客户端过滤。建议服务端保存前用白名单 sanitizer 清理标签和属性，只允许 p、strong、em、ul、ol、li、pre、code、a 等必要内容，并限制 a 标签协议。渲染时避免直接放开所有 dangerouslySetInnerHTML，至少保证内容来源已经经过服务端清洗。",
        accepted: true,
        createdAt: hoursAgo(19)
      }
    ]
  },
  {
    title: "Node.js 里密码哈希用 scrypt 合适吗？参数应该怎么选？",
    body: "项目现在用 node:crypto 的 scrypt 存 passwordHash。想确认这对 MVP 是否够用，以及后续升级需要注意什么。",
    details:
      "目前格式是 salt:hash，没有保存参数版本。",
    author: 0,
    tags: ["nodejs", "typescript"],
    views: 720,
    createdAt: hoursAgo(28),
    answers: [
      {
        author: 2,
        summary: "scrypt 可以用，但要为参数版本留出口",
        body:
          "scrypt 本身适合密码哈希，关键是参数、盐和升级策略。建议 hash 字符串里带上算法和参数版本，例如 scrypt$v1$salt$hash。以后提高成本参数时，可以在用户登录成功后透明重算并更新。",
        createdAt: hoursAgo(27)
      }
    ]
  },
  {
    title: "Next.js 里搜索页用 searchParams 做筛选，什么时候需要防抖或缓存？",
    body: "问题列表支持关键词和标签筛选，每次输入都改 URL 会触发请求。想兼顾体验和服务端压力。",
    details:
      "当前没有接入搜索引擎，只是 PostgreSQL 模糊查询。",
    author: 1,
    tags: ["nextjs", "react", "performance"],
    views: 1190,
    createdAt: hoursAgo(34),
    answers: [
      {
        author: 3,
        summary: "输入态和提交态分离",
        body:
          "不要每个字符都提交到 searchParams。可以让输入框保持本地状态，用户按回车、点击搜索或停止输入一小段时间后再 replace URL。服务端侧再限制关键词长度，并给常用筛选加索引或缓存。",
        accepted: true,
        createdAt: hoursAgo(33)
      }
    ]
  },
  {
    title: "Prisma migrate deploy 放在 Vercel buildCommand 里有什么风险？",
    body: "现在 vercel.json 里 buildCommand 是 npm run build && npm run db:deploy。每次生产部署都会跑迁移，这样是否合理？",
    details:
      "担心构建失败、并发部署和回滚时数据库状态不一致。",
    author: 2,
    tags: ["prisma", "vercel", "database"],
    views: 1560,
    createdAt: hoursAgo(42),
    answers: [
      {
        author: 4,
        summary: "小项目能用，但要知道失败边界",
        body:
          "MVP 可以这么做，但迁移一旦执行成功，后续应用构建失败也不会自动回滚数据库。更稳的做法是把迁移作为发布前独立步骤，确认 migrate deploy 成功后再部署应用。至少要避免多个生产部署同时触发迁移。",
        createdAt: hoursAgo(41)
      }
    ]
  }
];

async function score(data: {
  userId: string;
  actorId?: string;
  type: ScoreEventType;
  points: number;
  message: string;
  questionId?: string;
  answerId?: string;
}) {
  await prisma.scoreEvent.create({ data });
  await prisma.user.update({
    where: { id: data.userId },
    data: { score: { increment: data.points } }
  });
}

async function main() {
  const passwordHash = await hashPassword("password123");

  const createdUsers = await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: { ...user, passwordHash }
      })
    )
  );

  await Promise.all(
    tags.map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: { name: tag.name },
        create: tag
      })
    )
  );

  let insertedQuestions = 0;
  let insertedAnswers = 0;

  for (const item of questions) {
    const existing = await prisma.question.findFirst({
      where: { title: item.title },
      select: { id: true }
    });

    if (existing) continue;

    const question = await prisma.question.create({
      data: {
        title: item.title,
        body: item.body,
        details: item.details,
        views: item.views,
        authorId: createdUsers[item.author].id,
        createdAt: item.createdAt,
        tags: {
          create: item.tags.map((slug) => ({
            tag: { connect: { slug } }
          }))
        }
      }
    });
    insertedQuestions += 1;

    await score({
      userId: createdUsers[item.author].id,
      actorId: createdUsers[item.author].id,
      type: ScoreEventType.QUESTION_CREATED,
      points: 10,
      message: "发布问题",
      questionId: question.id
    });

    for (const answerItem of item.answers) {
      const answer = await prisma.answer.create({
        data: {
          questionId: question.id,
          authorId: createdUsers[answerItem.author].id,
          summary: answerItem.summary,
          body: answerItem.body,
          createdAt: answerItem.createdAt
        }
      });
      insertedAnswers += 1;

      await score({
        userId: createdUsers[answerItem.author].id,
        actorId: createdUsers[answerItem.author].id,
        type: ScoreEventType.ANSWER_CREATED,
        points: 15,
        message: "提交回答",
        questionId: question.id,
        answerId: answer.id
      });

      if (answerItem.accepted) {
        await prisma.question.update({
          where: { id: question.id },
          data: { acceptedAnswerId: answer.id }
        });
        await score({
          userId: createdUsers[answerItem.author].id,
          actorId: createdUsers[item.author].id,
          type: ScoreEventType.ANSWER_ACCEPTED,
          points: 25,
          message: "回答被采纳",
          questionId: question.id,
          answerId: answer.id
        });
      }
    }
  }

  console.log(`Inserted ${insertedQuestions} questions and ${insertedAnswers} answers.`);
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
