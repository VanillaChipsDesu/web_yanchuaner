# 项目总览

## 快速了解顺序

如果你是第一次接手这个项目，建议按下面顺序阅读：

1. [docs/README.md](README.md) — 文档入口和阅读顺序
2. **本文件** — 了解项目定位、功能边界、技术栈、目录结构
3. [ROUTES.md](ROUTES.md) — 搞清楚前台、后台和 API 的路由与权限
4. [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) — 本地开发、环境变量、脚本工具、数据库操作
5. [ADMIN_GUIDE.md](ADMIN_GUIDE.md) — 管理员实际操作手册（含增删改查步骤）
6. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — 构建与发布流程

> 想参与前端开发？先读 [UI_GUIDE.md](UI_GUIDE.md) — 设计令牌、UI 组件与安全改样式指南。

## 项目基本信息

| 项目 | 内容 |
|------|------|
| 正式校名 | 深圳市燕川中学（新安中学集团成员校） |
| 简称 | 燕中 |
| 域名 | yanchuaner.cn |
| 服务器 | 华为云 ECS (Ubuntu) |
| 定位 | 校友会数字展示平台，非官方、公益性质、无盈利 |

## 面向用户

| 角色 | 说明 |
|------|------|
| 普通访客 / 校友 | 浏览新闻、活动、校园记忆，查看校友地图，申请信息修改 |
| 在校生和家长 | 使用在校生资源站：志愿填报参考、大学专业观察、学长问答、学习方法、校友寄语 |
| 管理员 | 登录后台管理新闻、活动、校友名单、审核修改申请、管理投稿和用户 |

## 核心功能清单

| 功能 | 说明 |
|------|------|
| 普通口令入口 | 访问者输入内测口令后进入站点（httpOnly cookie 鉴权） |
| 管理员登录 | 管理员账号 + HMAC-SHA256 token 登录后台 |
| 新闻管理 | 后台编辑、发布/下架、删除新闻；前台公开可访问 |
| 活动管理 | 后台编辑、发布/下架、删除活动；支持在线报名 |
| 活动报名名单导出 | 管理员导出 CSV（UTF-8 BOM，防 Excel 公式注入） |
| 校友名单管理 | 后台 CRUD + CSV 批量导入/导出（支持中英文字段头，按 name+class 去重） |
| 校友信息修改申请 | 校友在前台搜索自己姓名提交修改申请，管理员后台审核（通过/驳回） |
| 校友大学城市分布 | Leaflet 地图 + 城市聚合统计 + 点击展开校友明细（姓名、大学、专业、班级） |
| 电子校友纪念卡 | 输入姓名和班级验证身份，生成专属电子纪念卡（支持自定义背景上传） |
| 校园记忆 | 校园风景、毕业合影等文化记忆展览（数据库驱动，管理员后台可视化维护，图片 16:9 自动裁切） |
| 燕中故事 | 校友故事浏览与投稿（数据库驱动 + 邮箱投稿，管理员后台 CRUD） |
| 在校生资源站 | 5 个子页面：志愿填报参考、大学与专业观察、学长问答、学习方法、校友寄语（数据库驱动） |
| 教师频道 | 教师名录、名师风采、教研成果、校友联络（数据库驱动，管理员可编辑版块） |
| 学校介绍 | 燕川中学航天科技特色、办学理念、校园规模等介绍（数据库驱动，含发展历程时间线） |
| 联系我们 | 公开联系表单（邮箱引导）、投稿说明、免责声明（数据库驱动） |
| 图片上传 | 管理员上传活动/新闻封面图片、校友纪念卡背景图（Sharp 裁切与格式转换） |
| 地图展示 | Leaflet + react-leaflet 实现城市级别分布聚合 |
| 安全机制 | API 限流（内存/Redis）、CSV 导出防公式注入、httpOnly cookie、凭据一键轮换 |

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 14.2 |
| 语言 | TypeScript | 5.x |
| ORM | Prisma | 7.x |
| 数据库 | SQLite | — |
| 样式 | Tailwind CSS | 3.4 |
| 地图 | Leaflet + react-leaflet | 1.9.4 |
| 图像处理 | Sharp | 0.34 |
| 认证 | HMAC-SHA256 + httpOnly cookie | — |
| 部署 | systemd + Nginx + `output: "standalone"` | — |

## 前端架构与组件化设计

项目前端遵循「**UI 渲染**与**数据流**彻底分离」的原则，降低认知负荷，方便开源贡献者参与。新手改样式时碰不到数据与鉴权逻辑。

> 📘 完整的令牌字典、组件 API 速查与「安全改样式」避坑指南见 [UI_GUIDE.md](UI_GUIDE.md)。

### 1. 统一设计令牌（单一来源）

颜色定义在 `src/app/globals.css` 的 `:root`，通过 `tailwind.config.ts` 暴露为语义化 Tailwind 类名（`brand` / `brand-fg` / `accent` / `surface` / `line` 等）。

- 改主题色只需动 `globals.css` 一个文件，无需全局搜索十六进制色值。
- 令牌底层用 `rgb(var(--brand-rgb) / <alpha-value>)` 格式，支持透明度修饰符（`bg-brand/10`）。
- 圆角（`rounded-btn/card/modal`）与阴影（`shadow-sm/md/lg` 三级）同样令牌化。

### 2. UI 基础组件库（`src/components/ui/`）

把重复的「面条式类名」收敛为有名字的声明式组件：

| 组件 | 作用 |
|------|------|
| `PageShell` | 页面外层容器（统一宽度与留白） |
| `GlassCard` / `SectionHeader` | 毛玻璃卡片 / 区块标题 |
| `PageHeader` | 页头（胶囊标签 + 标题 + 描述） |
| `Button` / `ButtonLink` | 统一按钮（含 focus 无障碍环） |
| `Badge` / `EmptyState` / `DisclaimerBanner` | 标签 / 空状态 / 免责声明 |
| `cn()` | 零依赖类名合并工具 |

统一从 `@/components/ui` 导入。所有组件只负责渲染，不含数据拉取逻辑。

### 3. 后台数据层抽象（`useResource` + `CrudManager`）

后台管理页采用统一架构，数据层与 UI 层解耦：

- **`src/hooks/useResource.ts`** — 通用 CRUD Hook，封装「列表加载 + 增/改/删 + loading/saving/error」，对接 `/api/admin/*`，**不改变任何请求契约**。
- **`src/components/admin/CrudManager.tsx`** — 字段配置驱动的通用管理组件（表单 + 列表 + 编辑态），适合纯表单型页面（如 stories、achievements）。
- **`src/components/admin/AdminPageShell.tsx` / `AdminBreadcrumb.tsx`** — 后台页统一骨架与自动面包屑。

含特殊交互的页面（memories 的 16:9 图片上传、content 的 Tab 切换、teachers/memories 的拖动排序）**只接入 `useResource` 数据层**，UI 自定义，架构仍保持一致。

## 数据模型

### 数据库模型（Prisma Schema）

```
model User                      # 用户（name, contact, role, status）
model WhitelistRoster           # 校友名单（name, graduationClass, tags, certificateNo）
model AlumniCorrectionRequest   # 校友信息修改申请（当前值/申请值对比, status, adminNote）
model Post                      # 投稿（title, content, type, status, authorId）
model News                      # 新闻（title, summary, content, imageUrl, status）
model Event                     # 活动（title, summary, location, eventDate, maxAttendees, status）
model EventRegistration         # 活动报名（eventId, name, contact, message）
model MemoryItem                # 燕中记忆展品（title, subtitle, description, imagePath, imageAlt, icon, sortOrder）
model ContentSection            # 页面内容块（page, title, description, note, icon, href, actionLabel, yearLabel, sortOrder）
model Story                     # 燕中故事（title, author, tags, body, date）
```

### 静态数据文件

| 文件 | 用途 |
|------|------|
| `src/data/cityCoordinates.ts` | 城市名称 → 经纬度坐标映射 |
| `src/data/studentResources.ts` | 在校生资源站内容（志愿参考、专业观察等） |
| `src/data/stories.json` | 燕中故事数据 |
| `src/data/memoriesGallery.json` | 燕中记忆种子数据（仅用于 `scripts/seed_memories.js` 初始化） |
| `src/data/starMessages.ts` | 首页校友寄语数据 |
| `src/data/alumni_encrypted.ts` | 加密的校友数据 |

## 数据持久化路径

| 路径 | 内容 | 环境 |
|------|------|------|
| `prisma/dev.db` | SQLite 开发数据库 | 本地开发 |
| `/var/www/alumni-site/data/prod.db` | SQLite 生产数据库 | 线上 |
| `/var/www/alumni-site/uploads/` | 用户上传文件目录 | 线上 |
| `public/uploads/` | 本地上传目录 | 本地开发 |

> **严禁用本地 dev.db 覆盖线上 prod.db。** 线上数据变更通过后台 UI 操作。

## 安全边界

| 层级 | 保护范围 | 验证方式 |
|------|----------|----------|
| 普通入口 | 整个站点访问 | `ACCESS_PASSWORD` / `ACCESS_PASSWORD_HASH` → httpOnly cookie (`yc_access_token`) |
| 管理员后台 | `/admin/*`、`/api/admin/*` | `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` → httpOnly cookie (`yc_access_token`, role=admin) |
| 校友数据 API | `/api/alumni/*` | `requireAccessOrAdmin()` — 普通口令或管理员均可 |
| 图片上传 | `/api/upload`、`/api/alumni/certificate/upload-bg`、`/api/settings/card-bg/upload` | 仅管理员 |
| 公开 API | `/api/news`、`/api/events`、`/api/health`、`/api/join` | 无需鉴权 |
| API 限流 | `/api/join`、`/api/alumni/correction-requests`、`/admin/login` | 内存/Redis 限流 |

> 环境变量只写变量名和用途说明，不写真实值。参考 `docs/OPERATIONS_GUIDE.md`。

## 项目目录结构

```
aerospace-alumni-site/
├── src/
│   ├── app/                          # Next.js App Router 页面与 API
│   │   ├── page.tsx                  # 首页
│   │   ├── about/                    # 学校介绍
│   │   ├── news/                     # 新闻（列表 + 详情）
│   │   ├── events/                   # 活动（列表 + 详情 + 报名）
│   │   ├── contact/                  # 联系我们
│   │   ├── teachers/                 # 教师频道
│   │   ├── students/                 # 在校生资源站（首页 + 5 子页）
│   │   ├── alumni/
│   │   │   ├── certificate/          # 电子校友纪念卡
│   │   │   ├── university-map/       # 校友大学城市分布地图
│   │   │   ├── radar/                # 重定向 → university-map
│   │   │   ├── memories/             # 校园记忆
│   │   │   ├── stories/              # 燕中故事
│   │   │   └── correction/           # 校友信息修改申请
│   │   ├── admin/
│   │   │   ├── page.tsx              # 后台控制面板
│   │   │   ├── login/                # 管理员登录
│   │   │   ├── news/                 # 新闻管理（列表 + 新建 + 编辑）
│   │   │   ├── events/               # 活动管理（列表 + 新建 + 编辑 + 报名名单）
│   │   │   ├── alumni/               # 校友名单管理
│   │   │   ├── alumni-corrections/   # 修改申请审核
│   │   │   ├── memories/             # 燕中记忆管理
│   │   │   ├── stories/              # 燕中故事管理
│   │   │   ├── teachers/             # 教师频道管理
│   │   │   ├── content/              # 页面内容统一管理
│   │   │   ├── posts/                # 投稿管理
│   │   │   └── users/                # 用户管理
│   │   └── api/                      # 40+ 个 API 端点
│   ├── components/                   # 通用组件
│   │   ├── ui/                        # UI 基础组件库（PageShell/GlassCard/PageHeader/Button/Badge/EmptyState/DisclaimerBanner/cn）
│   │   ├── admin/                     # 后台通用组件（CrudManager/AdminPageShell/AdminBreadcrumb）
│   │   ├── AlumniSearch.tsx          # 校友搜索
│   │   ├── AlumniMap.tsx             # 校友地图（Leaflet）
│   │   ├── CityMapRenderer.tsx       # 城市地图渲染
│   │   ├── Gatekeeper.tsx            # 口令门卫
│   │   ├── JoinRequestModal.tsx      # 加入申请弹窗
│   │   ├── EventRegistrationForm.tsx # 活动报名表单
│   │   ├── LatestUpdatesSection.tsx  # 最新动态
│   │   ├── CosmicBackground.tsx      # 首页氛围背景装饰
│   │   ├── StarMarquee.tsx           # 星辰滚动
│   │   ├── MessageOrbit.tsx          # 留言轨道
│   │   ├── MobileNav.tsx             # 主导航（Mega Menu + 移动抽屉）
│   │   └── UUIDCompat.tsx            # UUID 兼容
│   ├── hooks/                        # 自定义 Hook
│   │   └── useResource.ts            # 后台 CRUD 数据层 Hook
│   ├── data/                         # 静态数据
│   │   ├── cityCoordinates.ts        # 城市经纬度坐标
│   │   ├── studentResources.ts       # 在校生资源内容
│   │   ├── stories.json              # 燕中故事
│   │   ├── memoriesGallery.json      # 校园记忆图片
│   │   ├── starMessages.ts           # 校友寄语
│   │   └── alumni_encrypted.ts       # 加密校友数据
│   ├── lib/                          # 工具库
│   │   ├── db.ts                     # 数据库客户端
│   │   ├── verify-token.ts           # Token 验证（普通口令 + 管理员）
│   │   ├── admin-auth.ts             # 管理员鉴权中间件
│   │   ├── cache.ts                  # 缓存工具
│   │   ├── redis.ts                  # Redis 客户端
│   │   ├── rate-limit.ts             # API 限流
│   │   ├── image-pipeline.ts         # 图片处理管道（Sharp）
│   │   ├── tags.ts                   # Tags 解析与标准化
│   │   └── memories.ts               # 记忆板块工具（icon→板块名 + 文件重命名）
│   └── globals.css                   # 全局样式
├── prisma/
│   └── schema.prisma                 # 数据模型定义
├── prisma.config.ts                  # Prisma 7.x 数据源配置
├── scripts/                          # 运维脚本
│   ├── smoke-test.js                 # 关键路径回归测试
│   ├── set-credentials.js            # 一键更新凭证
│   ├── seed_content_sections.js      # 种子页面内容数据
│   ├── seed_whitelist.js             # 种子校友名单
│   ├── seed_memories.js              # 种子燕中记忆数据
│   ├── seed_stories.js               # 种子燕中故事数据
│   ├── gen_cert_numbers.js           # 批量生成证书编号
│   ├── backup.sh                     # 自动备份脚本
│   ├── rebuild_roster.js             # 重建名单
│   ├── fix_timeline.js               # 修复时间线数据
│   ├── sync_roster.js                # 同步名单
│   ├── build_list.js                 # 构建列表
│   └── clean.sh                      # 清理脚本
├── docs/                             # 项目文档（9 个文件）
├── public/                           # 静态资源（图片、上传文件）
├── next.config.mjs                   # Next.js 配置
├── tailwind.config.ts                # Tailwind 配置
├── tsconfig.json                     # TypeScript 配置
├── .env.example                      # 环境变量模板
├── credentials.example.json          # 凭证模板
├── Dockerfile                        # Docker 多阶段构建
├── docker-compose.yml                # Docker Compose 编排
├── .dockerignore                     # Docker 忽略规则
├── prisma.config.ts                  # Prisma 7.x 数据源配置
└── package.json                      # 项目依赖与脚本
```

## 优化切入点

如果后续要继续优化项目，优先从下面这些地方入手：

- **路由与导航**：统一首页、新闻、活动、校友证、后台的入口与高亮状态
- **认证与权限**：普通口令、管理员 cookie、API 权限分层是否清晰
- **证书与图片链路**：背景上传、裁切、证书导出、上传目录持久化
- **后台体验**：列表筛选、编辑表单、删除确认、导出和审核流程
- **数据操作**：批量导入/导出的健壮性、数据校验与去重
- **文档同步**：新增页面、API、环境变量或运维流程后，及时更新 docs 目录

## 相关文档

- [文档索引](README.md) — 全部文档入口与阅读顺序
- [路由清单](ROUTES.md) — 所有页面与 API 路由及权限
- [UI 开发指南](UI_GUIDE.md) — 设计令牌、UI 组件库、后台 CRUD 架构与安全改样式指南
- [运营指南](OPERATIONS_GUIDE.md) — 本地开发、环境变量、数据库操作、脚本说明
- [管理员手册](ADMIN_GUIDE.md) — 后台功能详细操作说明（含增删改查）
- [部署指南](DEPLOYMENT_GUIDE.md) — 构建、部署、Nginx、HTTPS、systemd
- [备份指南](BACKUP_GUIDE.md) — 备份策略与恢复操作
- [故障排除](TROUBLESHOOTING.md) — 常见问题与修复方案
