# 变更记录

本文档记录项目所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号采用 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added
- 生产环境对接真实 Resend 邮件发送 API，实现验证邮件与重置密码的完整业务闭环
- 新增后台用户认领/认证旧校友资料模块（`user-claims`）与校友成就墙（`achievements`）管理与展示
- 引入超级管理员 (Root Admin) 唯一邮箱识别（`yanchuaner@yanchuaner.cn`），构建同级越权防护与自停用防御机制

### Changed
- 管理后台路由结构重构：全部页面和 API 按 Next.js Route Groups 划归为前台 `(front)` 与后台 `(admin)` 进行分租隔离
- 全局 UI 响应式断点优化：降低 Navbar 桌面端折叠断点阈值，避免 125% 缩放过早触发汉堡菜单
- 邮箱验证结果页面 (`/verify-email`) UI 改版：移除违和的白色背景框与实线边框，融入高空星空紫美学深邃感，引入柔和磨砂玻璃卡片与微交互动画
- 后台用户操作列（UserTable）重构：分离普通管理员与 Root 超管控制，支持管理员降级与撤销操作，屏蔽对同级/自账号的破坏性操作以防横向越权
- 升级 `docs` 体系文档以匹配最新的路由组架构与超管权限控制逻辑

### Fixed
- 修复移动端导航抽屉的浅色 Overlay 遮罩“白雾”问题，改为与暗黑星空主题深度咬合的深色透明微遮罩
- 通用页面内容管理模型 `ContentSection`：一个模型驱动 about(特色卡片+时间线)、contact、students、teachers 所有页面内容
- 燕中故事数据库驱动改造：新增 `Story` 模型，后台 CRUD 管理页 `/admin/stories`，公开 API `GET /api/stories`
- 管理员统一内容管理页 `/admin/content`（Tab 切换 about/contact/students/teachers 页面内容）
- 教师频道管理页 `/admin/teachers`（版块 CRUD + 排序）
- 活动列表卡片封面图展示（16:9 aspect-video）
- 上传 API 接入 Sharp 16:9 自动裁切（`processToCard16x9`，2752×1548）
- 种子数据脚本 `scripts/seed_content_sections.js`（25 条页面内容）
- 种子数据脚本 `scripts/seed_stories.js`（3 条故事）

### Changed
- 学校介绍页 `/about`：特色卡片 + 发展历程时间线改为数据库驱动
- 联系我们页 `/contact`：所有联系信息区块改为数据库驱动
- 在校生资源站 `/students`：资源卡片改为数据库驱动
- 教师频道 `/teachers`：版块内容改为数据库驱动
- 燕中故事 `/alumni/stories`：从静态 JSON 改为 API 动态获取
- 活动管理封面图预览限制为固定尺寸（256×160px），修复撑满页面问题
- 活动列表按钮右下对齐 + flex column 布局优化
- 燕中记忆卡片比例 4:3 → 16:9（aspect-video）
- 管理员侧边栏重新排序：匹配前端导航顺序
- 图片上传 MIME 白名单移除 GIF（与 16:9 裁切不兼容）

### Fixed
- 燕中记忆删除功能失败：better-sqlite3 原生绑定在 turbopack 模式下丢失，rebuild 后恢复
- 燕中记忆图片下方白框"已加载实际图片"移除，无图时显示"暂无图片"
- 种子脚本 `datetime('now')` 兼容性问题，改为 JS Date 传值
- 首页编译卡死（首次加载慢），属正常 Windows 环境首次编译行为

### Security
- 移除 `.env` 中残留真实凭据，全部替换为占位符

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
