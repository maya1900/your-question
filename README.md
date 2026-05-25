# 栈问社区

一个基于 Next.js 的中文问答社区 MVP。用户可以提问、回答、点赞、采纳最佳答案，并通过积分记录贡献。

## 当前进度

- 已确认技术栈：Next.js + TypeScript + Prisma + SQLite。
- 已初始化 CodeGraph。
- 已建立 `AGENTS.md`、需求文档、技术文档、设计说明和开发计划。
- 正在按开发计划实现应用。

## 文档

- [AGENTS.md](AGENTS.md)
- [需求文档](docs/requirements.md)
- [技术文档](docs/technical.md)
- [设计说明](docs/design.md)
- [开发计划](docs/development-plan.md)

## 本地开发

```bash
npm install
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

默认开发地址是 `http://localhost:3000`。

## 测试账号

种子数据会创建以下账号，密码均为 `password123`：

- `linyue@example.com`
- `zhouran@example.com`
- `guche@example.com`
- `mengzhou@example.com`
- `admin@example.com`（管理员，可访问 `/admin`）
