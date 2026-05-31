# 文档总览

这里是本项目的文档入口。建议先看这份索引，再按需要进入具体主题文档。

## 推荐阅读顺序

1. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - 先了解项目定位、功能边界、技术栈
2. [ROUTES.md](ROUTES.md) - 再看页面与 API 路由、权限划分
3. [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) - 本地开发、环境变量、后台日常操作
4. [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - 管理员具体功能说明
5. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 构建、部署、Nginx、HTTPS
6. [BACKUP_GUIDE.md](BACKUP_GUIDE.md) - 备份与恢复
7. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 故障排查

## 文档分工

| 文档 | 用途 | 适合谁看 |
|------|------|----------|
| PROJECT_OVERVIEW.md | 项目概览 | 新成员、接手维护者 |
| ROUTES.md | 路由与权限清单 | 前后端开发、测试、运维 |
| OPERATIONS_GUIDE.md | 本地开发与日常运维 | 开发者、部署人员 |
| ADMIN_GUIDE.md | 后台功能操作手册 | 管理员、测试人员 |
| DEPLOYMENT_GUIDE.md | 生产部署说明 | 运维、发布负责人 |
| BACKUP_GUIDE.md | 备份与恢复 | 运维、管理员 |
| TROUBLESHOOTING.md | 常见问题排查 | 所有人 |

## 当前项目要点

- 前台包含新闻、活动、校友证、校园记忆、燕中故事、在校生资源站和联系页面
- 后台包含新闻、活动、校友名单、修改申请、投稿、用户管理等管理功能
- 站点采用 Next.js + Prisma + SQLite，支持本地开发和 standalone 生产部署
- 访问口令与管理员账号密码支持脚本方式快速更新

## 维护建议

- 如果新增页面或 API，请同步更新 [ROUTES.md](ROUTES.md)
- 如果新增环境变量或操作流程，请同步更新 [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md)
- 如果修改后台功能，请同步更新 [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- 如果修改部署或备份流程，请同步更新 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 与 [BACKUP_GUIDE.md](BACKUP_GUIDE.md)