# 燕川中学校友数字母港

公益、非官方的深圳市燕川中学校友会数字平台。本仓库包含 Next.js 14 前端、Prisma + SQLite 数据层、HMAC 鉴权、Sharp 图像处理与后台管理能力。

## 项目概览

- 前台：新闻、活动、校友故事、校友证、校园记忆、联系我们
- 后台：新闻、活动、校友名单、修改申请、投稿、用户管理
- 数据：Prisma + SQLite，支持本地开发与生产持久化
- 认证：普通访问口令 + 管理员登录，均通过 httpOnly cookie 保护
- 图片：支持管理员替换默认底图、校友个人背景上传与服务端裁切

## 快速开始

```bash
npm install
cp .env.example .env
npm run dev
```

本地开发默认访问：

- <http://localhost:3000>
- 后台登录：/admin/login
- 电子校友证：/alumni/certificate

## 30 秒修改凭证

当需要修改访问口令、管理员账号、管理员密码时，使用仓库内脚本一键更新：

```bash
# 1. 首次使用时复制模板
cp credentials.example.json credentials.local.json

# 2. 编辑 credentials.local.json，填写新值
#    也可以直接使用命令行参数

# 3. 执行更新
node scripts/set-credentials.js

# 4. 重启服务
# 开发环境：重新运行 npm run dev
# 生产环境：重启 .next/standalone/server.js
```

脚本特性：

- 原子写入，避免配置文件半写损坏
- 自动备份，支持回滚
- 敏感文件已加入 `.gitignore`
- 修改后新凭证立即生效，旧凭证失效

## 推荐脚本

- `npm run dev`：开发模式
- `npm run build`：生产构建
- `npm run start`：启动生产服务
- `npm run lint`：静态检查
- `node scripts/smoke-test.js`：关键路径回归测试
- `node scripts/set-credentials.js`：更新访问口令与管理员账号密码

## 主要页面与路由

### 前台

- `/`：首页
- `/news`：新闻列表
- `/events`：活动列表
- `/alumni/certificate`：电子校友证
- `/alumni/memories`：校园记忆
- `/alumni/stories`：燕中故事
- `/students`：在校生资源站
- `/contact`：联系我们

### 后台

- `/admin/login`：管理员登录
- `/admin`：后台总览
- `/admin/news`：新闻管理
- `/admin/events`：活动管理
- `/admin/posts`：投稿管理
- `/admin/users`：用户管理
- `/admin/events/[id]/registrations`：活动报名名单

更多完整路由与权限说明见 [docs/ROUTES.md](docs/ROUTES.md)。

## 本地预览

```bash
npm install
npm run build
node .next/standalone/server.js
```

如需修改监听端口，可设置 `PORT=3000` 后启动。

## 部署要点

- 生产环境建议使用 `output: "standalone"`
- SQLite 数据库与上传目录应挂载到持久化卷
- 生产环境应通过反向代理暴露站点，并单独服务 `/uploads/`
- Windows 适合开发，构建建议在 WSL / Linux 中执行

详细部署步骤见 [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)。

## 文档索引

- [docs/README.md](docs/README.md) - 文档总览与阅读顺序
- [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) - 项目结构与功能概览
- [docs/ROUTES.md](docs/ROUTES.md) - 页面与 API 路由清单
- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) - 后台使用说明
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - 构建与部署
- [docs/BACKUP_GUIDE.md](docs/BACKUP_GUIDE.md) - 备份与恢复
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - 常见问题排查

## 许可证与说明

本项目为校友会公益展示平台，非官方发布，不用于商业用途。
