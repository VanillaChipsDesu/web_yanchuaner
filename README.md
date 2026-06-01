# 燕川中学校友数字母港

<p align="left">
	<img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
	<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
	<img src="https://img.shields.io/badge/Prisma-SQLite-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma SQLite" />
	<img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

公益、非官方的深圳市燕川中学校友会数字平台。仓库包含 Next.js 14 前端、Prisma + SQLite 数据层、HMAC 鉴权、Sharp 图像处理与后台管理能力。

> 面向校友、在校生和管理员的公益站点，提供新闻、活动、电子校友证、校园记忆、故事投稿、校友名单、审核与后台管理等功能。

## 核心能力

| 模块 | 能力 |
|------|------|
| 前台 | 首页、新闻、活动、电子校友纪念卡、校园记忆、燕中故事、在校生资源站、教师频道、学校介绍、联系我们 |
| 后台 | 新闻管理、活动管理、校友名单（CRUD/导入/导出）、修改申请审核、投稿管理、用户管理 |
| 数据 | Prisma + SQLite，本地开发和线上生产均使用 SQLite 文件持久化 |
| 认证 | 普通访问口令（httpOnly cookie）+ 管理员登录（HMAC-SHA256 token），各自独立鉴权 |
| 图片 | 管理员上传新闻/活动封面、校友纪念卡背景图上传、服务端 Sharp 裁切与格式转换 |
| 地图 | 校友大学城市分布（Leaflet 地图 + 城市聚合统计 + 校友明细） |
| 安全 | API 限流、CSV 导出防公式注入、httpOnly cookie、凭据脚本一键轮换 |

## 项目结构

```
src/
├── app/
│   ├── page.tsx                    # 首页
│   ├── about/                      # 学校介绍
│   ├── news/                       # 新闻列表与详情
│   ├── events/                     # 活动列表与详情
│   ├── contact/                    # 联系我们
│   ├── teachers/                   # 教师频道
│   ├── students/                   # 在校生资源站（5 个子页面）
│   ├── alumni/
│   │   ├── certificate/            # 电子校友纪念卡
│   │   ├── university-map/         # 校友大学城市分布地图
│   │   ├── radar/                  # 重定向至 university-map
│   │   ├── memories/               # 校园记忆展览
│   │   ├── stories/                # 燕中故事浏览与投稿
│   │   └── correction/             # 校友信息修改申请
│   ├── admin/                      # 后台管理（12 个页面）
│   └── api/                        # API 路由（31 个端点）
├── components/                     # 通用组件（12 个）
├── data/                           # 静态数据（城市坐标、故事、记忆等 6 个文件）
├── lib/                            # 工具库（缓存、限流、认证、图片处理等 7 个模块）
└── styles/                         # 全局样式
prisma/                             # Prisma schema 与迁移
scripts/                            # 运维脚本（构建、种子数据、烟雾测试、凭据管理等 12 个）
docs/                               # 项目文档（8 个文件）
```

## 快速开始

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

本地默认访问：

- 首页：<http://localhost:3000>
- 管理员登录：<http://localhost:3000/admin/login>
- 电子校友纪念卡：<http://localhost:3000/alumni/certificate>
- 校友地图：<http://localhost:3000/alumni/university-map>

## 常用命令

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器（localhost:3000） |
| `npm run build` | 生产构建（standalone 模式） |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint 静态检查 |
| `node scripts/smoke-test.js` | 关键路径回归测试（认证、后台流程） |
| `node scripts/set-credentials.js` | 一键更新访问口令和管理员账号密码 |
| `npx prisma db push` | 同步数据库 schema |
| `npx prisma studio` | 打开 Prisma 数据库浏览器 |

## 30 秒修改凭证

```bash
cp credentials.example.json credentials.local.json
# 编辑 credentials.local.json 填写新值
node scripts/set-credentials.js
```

脚本特性：原子写入防半写损坏、自动备份支持回滚、敏感文件已加入 `.gitignore`。修改后需重启服务。

## 数据模型

| 模型 | 说明 | 主要字段 |
|------|------|----------|
| `User` | 用户 | name, contact, role(GUEST/ADMIN), status(PENDING/APPROVED) |
| `WhitelistRoster` | 校友名单 | name, graduationClass, tags（大学\|专业\|城市） |
| `News` | 新闻 | title, summary, content, imageUrl, status(DRAFT/PUBLISHED) |
| `Event` | 活动 | title, summary, content, location, eventDate, maxAttendees, status |
| `EventRegistration` | 活动报名 | eventId, name, contact, message |
| `AlumniCorrectionRequest` | 校友信息修改申请 | rosterId, 当前值与申请值对比, status(PENDING/APPROVED/REJECTED) |
| `Post` | 投稿 | title, content, type, status(DRAFT/PUBLISHED), authorId |

## 主要路由

| 路由 | 权限 | 说明 |
|------|------|------|
| `/` | 普通口令 | 首页 |
| `/about` | 公开 | 学校介绍 |
| `/news` | 公开 | 新闻列表 |
| `/events` | 公开 | 活动列表 |
| `/alumni/certificate` | 普通口令 | 电子校友纪念卡 |
| `/alumni/university-map` | 普通口令 | 校友大学城市分布地图 |
| `/alumni/memories` | 普通口令 | 校园记忆 |
| `/alumni/stories` | 普通口令 | 燕中故事 |
| `/alumni/correction` | 普通口令 | 校友信息修改申请 |
| `/students` | 公开 | 在校生资源站 |
| `/teachers` | 公开 | 教师频道 |
| `/contact` | 公开 | 联系我们 |
| `/admin/login` | 公开 | 管理员登录 |
| `/admin` | 管理员 | 后台控制面板 |

完整路由与 API 权限说明见 [docs/ROUTES.md](docs/ROUTES.md)。

## 预览与上线

### 本地预览

```bash
npm run build
node .next/standalone/server.js
```

默认监听 `PORT=3000`，可通过环境变量修改端口。

### 正式上线

详细流程见 [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)。上线前检查清单：

1. `npm run lint` — 代码检查
2. `npm run build` — 生产构建
3. 备份生产数据库（参考 [docs/BACKUP_GUIDE.md](docs/BACKUP_GUIDE.md)）
4. 发布 standalone 产物
5. 重启 systemd 服务并通过 Nginx 对外访问

### 环境要求

- 本地开发：Windows / macOS / Linux
- 生产构建：**必须在 WSL 或 Linux 中执行**（Windows 下 `next build` 不完全兼容）
- 生产运行：Node.js + systemd + Nginx（`output: "standalone"`）
- 数据库：SQLite（文件存储，生产数据库路径 `/var/www/alumni-site/data/prod.db`）

## 文档入口

| 文档 | 说明 |
|------|------|
| [docs/README.md](docs/README.md) | 文档总览与阅读顺序 |
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | 项目结构、功能清单、技术栈、安全边界 |
| [docs/ROUTES.md](docs/ROUTES.md) | 页面与 API 路由清单（含权限标记） |
| [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) | 后台使用手册（新闻、活动、校友、审核等操作步骤） |
| [docs/OPERATIONS_GUIDE.md](docs/OPERATIONS_GUIDE.md) | 本地开发、环境变量、脚本、数据库操作 |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | 构建流程、WSL 构建、systemd、Nginx、HTTPS |
| [docs/BACKUP_GUIDE.md](docs/BACKUP_GUIDE.md) | 备份策略、恢复流程、离线备份 |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | 常见问题排查与修复方案 |

## 许可证与说明

本项目为校友会公益展示平台，非官方发布，不用于商业用途。
