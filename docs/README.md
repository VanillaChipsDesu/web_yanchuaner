# 文档索引

燕川中学校友数字母港项目的文档入口。建议先看这份索引，再按需要进入具体主题文档。

## 推荐阅读顺序

按照角色不同选择阅读路径：

### 新加入的开发者

1. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — 项目定位、功能边界、技术栈、目录结构
2. [ROUTES.md](ROUTES.md) — 全部页面路由、API 路由、权限机制
3. [UI_GUIDE.md](UI_GUIDE.md) — 设计令牌、UI 组件库、后台 CRUD 架构（前端开发必读）
4. [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) — 本地开发、环境变量、数据库操作
5. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — 遇到问题先看这里

### 后台管理员

1. [ADMIN_GUIDE.md](ADMIN_GUIDE.md) — 后台功能操作手册
2. [BACKUP_GUIDE.md](BACKUP_GUIDE.md) — 备份与恢复
3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — 常见问题

### 运维负责人

1. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — 完整部署流程
2. [BACKUP_GUIDE.md](BACKUP_GUIDE.md) — 数据备份策略
3. [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) — 服务器运维

### 贡献者

1. [../CONTRIBUTING.md](../CONTRIBUTING.md) — 贡献指南
2. [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — 行为准则
3. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — 架构理解
4. [UI_GUIDE.md](UI_GUIDE.md) — 前端开发：设计令牌、UI 组件、安全改样式指南
5. [ROUTES.md](ROUTES.md) — 路由设计

### 安全相关

1. [../SECURITY.md](../SECURITY.md) — 安全策略与漏洞报告
2. [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) — 凭据管理与轮换
3. [BACKUP_GUIDE.md](BACKUP_GUIDE.md) — 数据备份与恢复

## 文档分工

| 文档 | 用途 | 适合谁看 | 更新频率 |
| --- | --- | --- | --- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | 项目结构与功能概览 | 新成员、接手维护者 | 项目结构变更时 |
| [ROUTES.md](ROUTES.md) | 页面与 API 路由清单 | 前后端开发、测试、运维 | 路由变更时 |
| [UI_GUIDE.md](UI_GUIDE.md) | 设计令牌、UI 组件库、后台 CRUD 架构、安全改样式 | 前端开发、贡献者 | UI 组件/令牌变更时 |
| [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) | 本地开发、脚本、数据库 | 开发者、运维 | 环境/脚本变更时 |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | 后台功能操作手册 | 管理员、运营 | 后台功能变更时 |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 构建、部署、Nginx、HTTPS | 运维、发布负责人 | 部署流程变更时 |
| [BACKUP_GUIDE.md](BACKUP_GUIDE.md) | 备份策略与恢复流程 | 运维、管理员 | 备份策略调整时 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 问题排查与修复方案 | 全员 | 遇到新问题时 |

## 项目要点速览

### 技术栈

- **前端**：Next.js 14.2 (App Router) + TypeScript 5 + Tailwind CSS 3.4
- **数据**：Prisma 7.x + SQLite (better-sqlite3)
- **认证**：HMAC-SHA256 + httpOnly cookie（双层：访问口令 + 管理员）
- **部署**：systemd + Nginx + Let's Encrypt（`output: "standalone"`）
- **图像**：Sharp 服务端处理
- **地图**：Leaflet 1.9.4 + react-leaflet

### 模块清单

**前台**：

- 首页（动态、共建者展示）
- 新闻列表/详情
- 活动列表/详情/在线报名
- 电子校友纪念卡（自定义背景）
- 校友大学城市分布地图
- 校园记忆、燕中故事
- 在校生资源站（5 个子页）
- 教师频道、学校介绍、联系我们

**后台**：

- 新闻管理（CRUD）
- 活动管理（CRUD + 报名名单 + CSV 导出）
- 校友名单管理（CRUD + CSV 导入/导出 + 证书编号）
- 修改申请审核（通过/驳回）
- 投稿管理、用户管理

### 安全模型

| 凭据 | 保护范围 | 实现 |
| --- | --- | --- |
| 普通访问口令 | 全站访问 | `ACCESS_PASSWORD_HASH` → httpOnly cookie |
| 管理员账号 | `/admin/*`、`/api/admin/*`、上传 API | `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` → httpOnly cookie (role=admin) |

详见 [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md#安全边界) 中的「安全边界」章节。

## 维护约定

变更代码时同步更新文档：

| 代码变更 | 需要更新的文档 |
| --- | --- |
| 新增页面 | [ROUTES.md](ROUTES.md) |
| 新增 API | [ROUTES.md](ROUTES.md) |
| 新增 UI 组件 / 修改设计令牌 | [UI_GUIDE.md](UI_GUIDE.md) |
| 新增环境变量 | [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) + `.env.example` |
| 新增脚本 | [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md#脚本工具) |
| 后台功能变更 | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) |
| 部署流程变更 | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) |
| 备份策略变更 | [BACKUP_GUIDE.md](BACKUP_GUIDE.md) |
| 遇到新问题 | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| 任何重要变更 | [../CHANGELOG.md](../CHANGELOG.md) |

## 文档之外的资源

- 项目根目录 [README.md](../README.md) — 项目快速开始
- [CONTRIBUTING.md](../CONTRIBUTING.md) — 贡献流程
- [SECURITY.md](../SECURITY.md) — 安全策略
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — 行为准则
- [CHANGELOG.md](../CHANGELOG.md) — 版本变更
- [LICENSE](../LICENSE) — MIT 许可证
