# 技术文档

## 技术选型

- 框架：Next.js App Router。
- 语言：TypeScript。
- UI：React Server Components + 少量 Client Components。
- 数据库：SQLite。
- ORM：Prisma。
- 认证：自实现邮箱密码认证和 httpOnly cookie session。
- 校验：Zod。
- 图标：lucide-react。

## 架构说明

应用采用单体全栈结构：

- 页面由 `src/app/` 提供。
- 表单提交通过 Server Actions 处理。
- 数据访问集中在 `src/lib/prisma.ts` 和 `src/lib/data.ts`。
- 业务写操作由 `src/app/actions.ts` 接收表单，核心规则集中在 `src/lib/business.ts`。
- 会话逻辑集中在 `src/lib/session.ts`。
- 积分流水集中在 `src/lib/score.ts`。

## 数据模型

### User

保存用户邮箱、昵称、密码哈希、角色、启用状态和总积分。

### Session

保存登录 token 的哈希值、用户 ID 和过期时间。浏览器只保存原始 token 的 httpOnly cookie。

### Question

保存问题标题、正文、补充信息、浏览数、隐藏状态、作者、采纳答案和时间戳。

### Answer

保存回答摘要、正文、隐藏状态、作者、所属问题和时间戳。

### Tag / QuestionTag

保存标签和问题标签关联。

### Vote

保存用户对问题或回答的点赞记录。

### ScoreEvent

保存积分流水，记录积分变化来源、操作者、关联问题和关联回答。

## 认证设计

- 密码使用 Node.js 内置 `scrypt` 哈希。
- session token 使用随机字节生成。
- 数据库只保存 token 的 SHA-256 哈希。
- cookie 设置 `httpOnly`、`sameSite=lax`，生产环境启用 `secure`。

## 业务一致性

涉及积分变化的操作使用 Prisma transaction：

- 创建问题和加分。
- 创建回答和加分。
- 点赞、取消点赞和积分变化。
- 采纳、改采纳和积分变化。

## 页面设计

- `/`：问题列表和筛选。
- `/questions/[id]`：问题详情和回答区。
- `/ask`：发布问题。
- `/tags`：标签列表。
- `/profile`：积分和贡献动态。
- `/auth`：登录注册。
- `/admin`：管理员后台概览。
- `/admin/users`：用户管理列表，支持搜索、状态筛选和分页。
- `/admin/users/[id]`：用户详情，支持编辑资料、角色、状态和重置密码。
- `/admin/questions`：问题管理列表，支持搜索、标签筛选、状态筛选、分页和隐藏/恢复。
- `/admin/answers`：回答管理列表，支持搜索、状态筛选、分页和隐藏/恢复。
- `/admin/tags`：标签管理列表，展示标签使用和解决情况。

## 管理权限

- 用户角色使用 `UserRole` 枚举，默认 `USER`，管理员为 `ADMIN`。
- `getCurrentUser()` 返回当前用户角色。
- `/admin` 页面在服务端检查当前用户，未登录跳转 `/auth`，非管理员跳转 `/`。
- 停用用户会清理该用户会话，停用用户不能继续登录或写入内容。
- 管理员可以编辑用户昵称、邮箱、角色和状态；邮箱必须唯一。
- 管理员不能停用自己，也不能移除自己的管理员身份。
- 管理员重置用户密码后会清理该用户全部会话。
- 隐藏问题和回答使用软隐藏字段，不做硬删除。
- 普通页面默认过滤被停用用户、隐藏问题和隐藏回答。

## 本地运行

```bash
npm install
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

## 验证

```bash
npm run lint
npm run build
```
