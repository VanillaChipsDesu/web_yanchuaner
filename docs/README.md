# 文档索引

这里是燕川中学校友数字母港项目的文档入口。建议先看这份索引，再按需要进入具体主题文档。

## 推荐阅读顺序

1. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — 项目定位、功能边界、技术栈、目录结构
2. [ROUTES.md](ROUTES.md) — 全部页面路由、API 路由、权限机制
3. [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) — 本地开发、环境变量、数据库操作、脚本说明
4. [ADMIN_GUIDE.md](ADMIN_GUIDE.md) — 后台功能操作手册（新闻、活动、校友、审核等）
5. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — 构建、部署、Nginx、HTTPS、systemd
6. [BACKUP_GUIDE.md](BACKUP_GUIDE.md) — 备份策略、恢复流程、离线备份
7. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — 常见问题排查与修复

## 文档分工

| 文档 | 用途 | 适合谁看 |
|------|------|----------|
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | 项目结构与功能概览 | 新成员、接手维护者 |
| [ROUTES.md](ROUTES.md) | 页面与 API 路由及权限清单 | 前后端开发、测试、运维 |
| [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) | 本地开发、环境变量、脚本、数据库操作 | 开发者、运维人员 |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | 后台功能操作手册（含增删改查步骤） | 管理员、运营人员、测试 |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 构建流程、生产部署、Nginx/HTTPS 配置 | 运维、发布负责人 |
| [BACKUP_GUIDE.md](BACKUP_GUIDE.md) | 数据库与上传文件的备份和恢复流程 | 运维、管理员 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 项目遇到过的问题排查与修复方案 | 开发者、运维 |

## 当前项目要点

- **前台模块**：首页、新闻、活动、校友证、校园记忆、燕中故事、在校生资源站、教师频道、学校介绍、联系我们
- **后台模块**：新闻管理、活动管理、校友名单管理、修改申请审核、投稿管理、用户管理
- **技术栈**：Next.js 14.2 (App Router) + TypeScript + Prisma (SQLite) + Tailwind CSS 3.4
- **认证体系**：普通访问口令（httpOnly cookie）、管理员登录（HMAC-SHA256 token）
- **部署方式**：`output: "standalone"` + systemd + Nginx，SQLite 持久化存储

## 维护约定

- 新增页面或 API → 同步更新 [ROUTES.md](ROUTES.md)
- 新增环境变量或修改开发流程 → 同步更新 [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md)
- 修改后台功能或操作流程 → 同步更新 [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- 修改构建、部署或备份流程 → 同步更新 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 和 [BACKUP_GUIDE.md](BACKUP_GUIDE.md)
- 遇到新问题并修复 → 同步更新 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
