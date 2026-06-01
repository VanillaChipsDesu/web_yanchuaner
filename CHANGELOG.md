# 变更记录

本文档记录项目所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号采用 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added
- 标准开源项目文档：LICENSE、CONTRIBUTING、CHANGELOG

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
