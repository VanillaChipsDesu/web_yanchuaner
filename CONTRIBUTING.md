# 贡献指南

感谢你考虑为燕中校友数字母港做出贡献！

## 行为准则

- 友善、尊重，对他人的工作和观点保持开放态度
- 接受建设性批评，专注于对项目最有利的事情
- 注意：本项目涉及真实校友数据，所有改动需考虑数据安全与隐私

## 开始之前

阅读以下文档：

- [README.md](README.md) — 项目概览和快速开始
- [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) — 架构与技术栈
- [docs/UI_GUIDE.md](docs/UI_GUIDE.md) — 前端开发：设计令牌、UI 组件库、安全改样式指南
- [docs/OPERATIONS_GUIDE.md](docs/OPERATIONS_GUIDE.md) — 本地开发流程

## 开发流程

### 1. Fork 与克隆

```bash
git clone https://github.com/<your-username>/web_yanchuaner.git
cd web_yanchuaner
git remote add upstream https://github.com/yanchuaner/web_yanchuaner.git
```

### 2. 创建分支

分支命名规范：

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `feat/` | 新功能 | `feat/alumni-search-filter` |
| `fix/` | Bug 修复 | `fix/login-cookie-expiry` |
| `docs/` | 文档变更 | `docs/update-deployment` |
| `refactor/` | 重构 | `refactor/auth-middleware` |
| `chore/` | 杂项 | `chore/update-deps` |

```bash
git checkout -b feat/your-feature-name
```

### 3. 本地开发

```bash
npm ci
cp .env.example .env  # 配置环境变量
npx prisma generate
npx prisma db push
npm run dev
```

### 4. 代码规范

- **TypeScript**：严格模式，避免 `any`
- **Prettier**：保存自动格式化（继承 Next.js 默认配置）
- **ESLint**：提交前运行 `npm run lint`，必须 0 警告 0 错误
- **命名**：组件 `PascalCase`，函数 `camelCase`，常量 `UPPER_SNAKE_CASE`
- **注释**：解释「为什么」而不是「做什么」
- **UI 与样式**：优先复用 `components/ui` 组件，颜色使用语义令牌（`text-brand`、`bg-surface/10` 等），**不要裸写十六进制色值**；新增后台 CRUD 页用 `useResource` + `CrudManager`，不要在页面里手写 `fetch`。详见 [docs/UI_GUIDE.md](docs/UI_GUIDE.md)。

### 5. 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
<type>(<scope>): <subject>

<body>
```

| Type | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码样式（不影响功能） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试 |
| `chore` | 构建/工具变更 |
| `security` | 安全修复 |

示例：

```
feat(admin): add bulk delete for alumni roster

- Add checkbox selection in admin/alumni page
- New API endpoint /api/admin/alumni/bulk-delete
- Confirmation modal with count

Closes #42
```

### 6. 测试

提交前必须通过：

```bash
npm run lint           # ESLint
npx tsc --noEmit       # TypeScript 类型检查
npm run build          # 生产构建
```

### 7. 提交 Pull Request

1. Push 到你的 fork：`git push origin feat/your-feature-name`
2. 在 GitHub 上创建 PR，目标分支 `main`
3. PR 标题遵循 commit 规范
4. 描述中说明：**做了什么**、**为什么**、**怎么测试的**
5. 关联相关 Issue（如 `Closes #123`）

### 8. Code Review

- 维护者会在 1-3 天内 review
- 根据反馈修改后 `git push` 即可（无需重新创建 PR）
- 通过后会被 squash merge

## 安全相关

发现安全漏洞？**不要**直接提 Issue。请通过邮件私信项目维护者。

## 数据隐私

- **不要**提交真实校友数据（`alumni_roster.csv` 等已在 `.gitignore`）
- **不要**提交 `.env` 或任何凭据
- 测试用数据请使用脚本生成的假数据

## 文档贡献

文档变更也很欢迎！

- 修改 `README.md` 或 `docs/*.md`
- 提交时使用 `docs:` 前缀
- 不需要本地构建验证

## 问题反馈

- Bug：使用 [GitHub Issues](https://github.com/yanchuaner/web_yanchuaner/issues)
- 功能建议：先创建 Issue 讨论，再提 PR
- 提问：使用 [GitHub Discussions](https://github.com/yanchuaner/web_yanchuaner/discussions)

## 许可证

通过提交 PR，即表示你同意你的贡献以 [MIT License](LICENSE) 授权。

## 致谢

每一份贡献都让这个公益项目更好。无论代码、文档、Bug 报告还是建议，都同样重要。
