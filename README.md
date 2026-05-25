# 栈问 - 生活经验问答社区

<div align="center">

**一个现代化的生活经验问答社区，让知识流动起来**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tiptap](https://img.shields.io/badge/Tiptap-2-000000?style=flat-square&logo=tiptap)](https://tiptap.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

[功能特性](#功能特性) · [快速开始](#快速开始) · [开发计划](./ROADMAP.md)

</div>

---

## 📖 项目简介

栈问是一个专注于生活经验分享的问答社区，用户可以提出生活中遇到的问题，获得来自社区的实用建议和经验分享。通过积分系统激励优质内容产出，打造一个互帮互助的知识社区。

### 为什么选择栈问？

- 🎯 **专注生活经验** - 不同于技术问答，专注于生活、学习、工作等实用场景
- 💎 **激励优质内容** - 完善的积分系统，鼓励用户分享有价值的经验
- 🎨 **现代化设计** - 简洁美观的界面，流畅的用户体验
- 🚀 **功能完善** - 富文本编辑、通知系统、关注系统等核心功能齐全
- 🔒 **隐私保护** - 合理的隐私设置，保护用户个人信息

---

## ✨ 功能特性

### 核心功能

#### 📝 问答系统

- 发布问题，支持富文本编辑
- 提交回答，分享你的经验
- 点赞优质内容
- 采纳最佳答案
- 标签分类，快速找到相关问题
- 问题浏览（热度、最新、未解决排序）
- 智能搜索（标题、正文、作者）

#### 🏆 积分系统

- 发布问题、回答、点赞、采纳获得积分
- 积分等级系统，展示你的贡献
- 积分榜，看看谁是社区之星
- 积分详情和拆分（私密）

#### ✅ 签到系统

- 每日签到获得积分
- 连续签到额外奖励
- 签到日历，记录你的坚持

#### 🔔 通知系统

- 问题被回答时通知
- 回答被采纳时通知
- 内容获得点赞时通知
- 未读通知数量提示
- 一键标记全部已读

#### 👥 关注系统

- 关注感兴趣的用户
- 查看关注数和粉丝数
- 关注按钮快速操作

#### ✍️ 富文本编辑器

- 基于 Tiptap 的现代化编辑器
- 支持粗体、斜体、标题
- 支持列表、代码块、引用
- 代码语法高亮
- 链接插入

#### 👤 用户系统

- 用户注册、登录、登出
- 个人资料页（支持查看他人资料）
- 个人设置（修改用户名、邮箱、密码）
- 隐私保护（积分详情、签到记录等私密信息）

#### 🛡️ 管理后台

- 用户管理（查看、编辑、停用、删除）
- 问题管理（查看、隐藏、删除）
- 回答管理（查看、隐藏、删除）
- 标签管理（删除）
- 重置用户密码

---

## 🖼️ 界面预览

### 首页 - 问题列表

展示所有问题，支持按热度、最新、未解决排序，标签筛选和搜索。

![首页 - 问题列表](preview/img/home.jpg)

### 问题详情

查看问题详情、回答列表，支持点赞、采纳答案、提交回答。

![问题详情](preview/img/question-detail.jpg)

### 发布问题

使用富文本编辑器发布问题，支持格式化文本、代码块、链接等。

![发布问题](preview/img/ask.jpg)

### 个人资料

查看用户资料、问题、回答、积分详情、签到记录，支持关注用户。

![个人资料](preview/img/profile.jpg)

### 通知中心

查看所有通知，支持标记已读和全部已读。

![通知中心](preview/img/notifications.jpg)

---

## 🛠️ 技术栈

### 前端

- **[Next.js 15](https://nextjs.org/)** - React 框架，使用 App Router
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript
- **[Tiptap](https://tiptap.dev/)** - 富文本编辑器
- **[Lucide React](https://lucide.dev/)** - 图标库
- **CSS** - 自定义样式

### 后端

- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - API 接口
- **[Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)** - 服务端操作
- **[Prisma](https://www.prisma.io/)** - ORM 数据库工具
- **PostgreSQL** - 开发和生产环境数据库
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - 密码加密

### 部署

- **[Vercel](https://vercel.com/)** - 推荐部署平台
- **PostgreSQL** - 生产环境数据库（推荐）

---

## 🚀 快速开始

### 环境要求

- Node.js 18.17 或更高版本
- npm 或 yarn 或 pnpm
- PostgreSQL 数据库（本地可用 Docker 启动）

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/yourusername/your-question.git
cd your-question
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

创建 `.env` 文件：

```env
# 数据库
DATABASE_URL="postgresql://your_question:your_question@localhost:5432/your_question_dev?schema=public"

# Session 密钥（请修改为随机字符串）
SESSION_SECRET="your-random-secret-key-here"

# 环境
NODE_ENV="development"
```

4. **初始化数据库**

```bash
npm run db:deploy
npm run db:seed
```

5. **（可选）填充测试数据**

```bash
npm run db:seed
```

测试账号（密码均为 `password123`）：

- `linyue@example.com`
- `zhouran@example.com`
- `guche@example.com`
- `mengzhou@example.com`
- `admin@example.com`（管理员，可访问 `/admin`）

6. **启动开发服务器**

```bash
npm run dev
```

7. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 创建管理员账号

如果没有使用测试数据，首次使用需要创建管理员账号：

1. 注册一个普通账号
2. 使用 Prisma Studio 修改用户角色：

```bash
npx prisma studio
```

3. 在 User 表中找到你的账号，将 `role` 字段改为 `ADMIN`

---

## 📦 生产部署

### Vercel 部署（推荐）

1. **Fork 项目到你的 GitHub**

2. **在 Vercel 中导入项目**
   - 访问 [Vercel](https://vercel.com/)
   - 点击 "New Project"
   - 导入你的 GitHub 仓库

3. **配置环境变量**

   ```env
   DATABASE_URL="postgresql://..."  # 使用 Vercel Postgres 或其他 PostgreSQL 数据库
   SESSION_SECRET="your-random-secret-key"
   NODE_ENV="production"
   ```

4. **部署**
   - Vercel 会自动构建和部署
   - 每次推送到 main 分支都会自动部署

### 自托管部署

```bash
# 构建
npm run build

# 启动生产服务器
npm start
```

---

## 📚 项目结构

```
your-question/
├── prisma/                 # Prisma 数据库配置
│   ├── schema.prisma      # 数据库模型定义
│   └── migrations/        # 数据库迁移文件
├── src/
│   ├── app/               # Next.js App Router 页面
│   │   ├── actions.ts     # Server Actions
│   │   ├── admin/         # 管理后台
│   │   ├── ask/           # 发布问题页面
│   │   ├── auth/          # 认证页面
│   │   ├── notifications/ # 通知页面
│   │   ├── profile/       # 个人资料页面
│   │   └── questions/     # 问题详情页面
│   ├── components/        # React 组件
│   ├── lib/               # 工具函数和业务逻辑
│   │   ├── business.ts    # 业务逻辑
│   │   ├── data.ts        # 数据查询
│   │   ├── session.ts     # 会话管理
│   │   └── prisma.ts      # Prisma 客户端
│   └── styles/            # 样式文件
├── public/                # 静态资源
├── docs/                  # 文档
├── ROADMAP.md            # 开发计划
├── README.md             # 项目说明
└── package.json          # 项目配置
```

---

## 🗺️ 开发计划

查看 [ROADMAP.md](./ROADMAP.md) 了解详细的开发计划和待实现功能。

### 近期计划

- [ ] 私信系统
- [ ] 搜索优化
- [ ] 图片上传
- [ ] 标签管理
- [ ] 关注列表页面

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

---

## 📧 联系方式

如有问题或建议，欢迎通过以下方式联系：

- **GitHub Issues**: [提交 Issue](https://github.com/yourusername/your-question/issues)
- **Email**: markyal@linux.do

---

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 框架
- [Prisma](https://www.prisma.io/) - 数据库 ORM
- [Tiptap](https://tiptap.dev/) - 富文本编辑器
- [Lucide](https://lucide.dev/) - 图标库

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [markyal](https://github.com/yourusername)

</div>
