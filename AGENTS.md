# AGENTS.md

## 项目身份

栈问是一个中文问答社区 MVP。用户可以提问、回答、点赞内容、采纳最佳答案，并通过积分系统沉淀可信贡献。

## 工作原则

- 默认使用简体中文沟通。
- 代码改动必须先理解现有结构，再动手。
- 不做无关重构，不引入当前需求用不到的复杂抽象。
- `preview/` 是 UI 参考，不直接删除或覆盖。
- 文档和实现保持同步，业务规则变更要同步更新 `docs/`。

## 技术栈

- Next.js App Router
- React + TypeScript
- Prisma + SQLite
- Server Actions
- 原生 CSS，视觉继承 `preview/`

## 项目命令

```bash
npm install
npm run db:migrate -- --name init
npm run db:seed
npm run dev
npm run lint
npm run build
```

## 目录约定

- `src/app/`：Next.js 路由和 Server Actions。
- `src/components/`：页面复用组件。
- `src/lib/`：数据库、会话、积分、查询和校验逻辑。
- `prisma/`：数据模型、迁移和种子数据。
- `docs/`：需求、技术和开发计划文档。
- `preview/`：静态 UI 设计参考。

## 业务默认规则

- 未登录用户只能浏览。
- 登录用户可以提问、回答、点赞。
- 用户不能给自己的内容点赞。
- 每个用户对同一问题或回答只能点赞一次，可以取消。
- 只有提问者可以采纳答案。
- 每个问题只能有一个最佳答案，允许改采纳对象。
- 积分：提问 +10，回答 +15，被采纳 +25，被点赞 +2，取消点赞 -2。

## 验证要求

完成开发后至少运行：

```bash
npm run lint
npm run build
```

涉及数据库模型变更时还要运行：

```bash
npm run db:migrate -- --name <name>
npm run db:seed
```
