# 变更记录

本文档记录项目所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号采用 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added
- 燕中记忆文化长廊数据库驱动改造：新增 `MemoryItem` 模型，后台 CRUD/排序/上传管理，前台 API 动态渲染
- 燕中记忆后台管理页 `/admin/memories`（新增/编辑/删除/上下排序/图片上传）
- 公开 API `GET /api/memories` + 管理员 CRUD API（`/api/admin/memories`、`/api/admin/memories/[id]`）
- 上传文件按板块规范自动重命名：`{category}{sortOrder}.jpg`（campus/building/library/playground/garden/album）
- Tags 解析统一工具 `src/lib/tags.ts`：`parseTags()` 容错竖线和逗号两种分隔符，`normalizeTags()` 在写入时标准化
- `src/lib/memories.ts`：icon→板块英文名映射 + 文件重命名工具
- 种子数据脚本 `scripts/seed_memories.js`（从 `memoriesGallery.json` 导入初始数据）

### Changed
- `prisma.config.ts` 移除 `dotenv/config` 导入，提升 standalone 兼容性
- 上传 API 文件命名改为 `时间戳-原文件名.ext`（保留原始文件名，可读性提升）
- 燕中记忆前台页面改为 `force-dynamic` 实时渲染，不再依赖 JSON 静态文件和缓存

### Fixed
- 部署打包补全 `prisma.config.ts` 和 `scripts/` 目录
- PUT `/api/admin/memories/[id]` 支持部分更新（sortOrder-only 排序请求不再被 title 校验拒绝）
- 文件上传后 input 正确重置，允许同名文件重复上传
- Tags 全链路统一解析：4 处读取（地图/城市统计/搜索/首页）+ 3 处写入（create/update/CSV 导入）
- 移除种子数据中 `/memories/` 旧路径引用

## [1.0.0] — 2026-06-01

### Added
- 校友证书自定义编号字段 `certificateNo`
- 后台编辑表单证书编号输入框
- 批量生成证书编号脚本 `scripts/gen_cert_numbers.js`
- 自动备份脚本 `scripts/backup.sh` + cron 配置说明
- Leaflet 地图图标本地化（去除 cdnjs 依赖）
- 完整文档体系（PROJECT_OVERVIEW / ROUTES / ADMIN_GUIDE / OPERATIONS_GUIDE / DEPLOYMENT_GUIDE / BACKUP_GUIDE / TROUBLESHOOTING）

### Changed
- 升级 Node.js 至 22 LTS
- 升级 Prisma 至 7.x（数据源配置移至 `prisma.config.ts`）
- 部署指南完整重写为 4 阶段流程（WSL 构建 → 上传 → 服务器部署 → 验证）
- 共建者角色描述对齐实际职能（仅黄湘林为技术支持，其他为内容贡献/通讯支持/运维协调）

### Fixed
- PII 泄露：移除证书页面 `console.log` 中的姓名 + 身份证号
- 中间件：移除不存在的 `/access` 路由检查
- 4 个 admin 页面 `<img>` → Next.js `<Image />`
- 可访问性：表单元素 `aria-label`、`aria-expanded`
- CSS Safari 兼容：`-webkit-backdrop-filter` 前缀
- 移除 12 个未使用的 CSS 类
- Lint 警告全部清零

### Security
- 移除仓库中真实校友数据 `alumni_roster.csv`（108 条记录）
- 移除 `scripts/source_alumni.json`
- 部署文档中替换真实凭据为占位符（密码、密钥、IP）
- 上传 API 加固：5MB/10MB 大小限制、MIME 白名单、速率限制、honeypot

### Infrastructure
- SQLite WAL 模式 + busy_timeout 5000ms
- API 限流支持 Redis 与内存双模式回退
- Docker 多阶段构建（Node 22 + Prisma 7）
- 备份保留策略：hourly 24h、daily 30d、weekly 90d

## [0.9.0] — 2026-05

### Added
- 校友大学城市分布地图（Leaflet + 城市聚合）
- 校友信息修改申请系统
- 电子校友纪念卡（自定义背景图）
- 在校生资源站（5 个子页面）
- 教师频道
- 8 位平台共建者展示

### Changed
- 移植到 Next.js 14 App Router
- 数据库从内存切换到 SQLite 持久化

## [0.1.0] — 2026-03

### Added
- 项目初始化
- 新闻、活动管理
- 校友名单管理
- 管理员后台
- HMAC-SHA256 双层认证
