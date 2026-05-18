# 运营指南

## 本地开发流程

```bash
git clone <repo>
cd aerospace-alumni-site
cp .env.example .env
npm ci
npx prisma generate
npx prisma db push
npm run dev       # 开发服务器 → localhost:3000
npm run lint      # 代码检查
npm run build     # 生产构建
```

Windows 本地开发使用 SQLite dev.db，所有数据变更通过 Prisma schema / 后台 UI 操作。

## 部署流程

架构：Windows 写代码 → WSL 构建 → 上传服务器

```bash
# 在 WSL 或 Linux 中
npm ci
npx prisma generate
npm run build
# 将 .next/standalone 上传到服务器
# 将 public/ 上传到服务器
```

服务器端：Nginx 反向代理 + systemd 管理 Node 进程，不直接改业务代码。

## 环境变量

| 变量 | 用途 |
|------|------|
| `DATABASE_URL` | SQLite 数据库连接 |
| `ACCESS_PASSWORD` | 普通访问口令（明文，启动时自动 SHA256） |
| `ACCESS_PASSWORD_HASH` | 普通访问口令（预计算 SHA256，推荐） |
| `ADMIN_USERNAME` | 管理员登录账号 |
| `ADMIN_PASSWORD_HASH` | 管理员密码 SHA256 |
| `SESSION_SECRET` | HMAC-SHA256 token 签名密钥 |
| `SITE_URL` | 站点根 URL（Open Graph 等使用） |
| `SITE_NAME` | 站点名称（SEO） |

> `.env` 不要提交到 git。`.env.example` 只写占位值。

## 后台登录

1. 访问 `/admin/login`。
2. 输入管理员账号 + 密码。
3. 成功后跳转控制面板。
4. 退出后清除 cookie，需要重新登录。
5. 普通口令用户不能访问 `/admin/*` 和 `/api/admin/*`。

## 新闻管理

- 路径：`/admin/news`
- 支持新增、编辑、删除、发布/下架。
- 发布后公开可见于 `/news`。

## 活动管理

- 路径：`/admin/events`
- 支持新增、编辑、删除、发布/下架、查看报名名单。
- 报名名单支持 CSV 导出（UTF-8 BOM，防 Excel 公式注入）。
- 发布后公开可见于 `/events`。

## 校友名单管理

- 路径：`/admin/alumni`
- 支持搜索、新增、编辑、删除。
- 支持 CSV 导入（UTF-8，中文/英文字段头）。
- 支持 CSV 导出（UTF-8 BOM，防公式注入）。
- 删除前二次确认。
- 新增/编辑后自动同步到公开搜索 API 和地图 API。

## 校友信息修改申请

- 路径：`/admin/alumni-corrections`
- 用户在前台 `/alumni/correction` 搜索自己姓名，提交修改申请。
- 修改申请不会直接修改数据库，需管理员审核。
- 状态：**待审核** → **已通过**（应用到校友名单）或 **已驳回**（拒绝申请）。
- 操作流程：
  1. 展开申请查看当前值 vs 申请值的对比。
  2. 点击"通过并应用"：自动更新 WhitelistRoster 中对应校友的信息。
  3. 点击"驳回申请"：拒绝修改，WhitelistRoster 不受影响。
  4. 审核后不可撤销。
- 支持按状态筛选（全部/待审核/已通过/已驳回），支持搜索姓名和联系方式。
- 管理员备注可选，供记录审核原因。

## CSV 导入/导出要求

- 编码：UTF-8
- 表头支持：中文（姓名、届别、标签）或英文（name、graduationClass、tags）
- 导入去重：按 name + graduationClass 合并
- 导出文件名：`alumni-roster-YYYYMMDD.csv`
- 导出防注入：以 =、+、-、@ 开头的字段前加单引号

## 线上数据备份

需要定期备份以下内容：

```
/var/www/alumni-site/data/prod.db      # 数据库
/var/www/alumni-site/public/uploads/    # 用户上传文件
```

备份建议：`cp prod.db prod.db.$(date +%Y%m%d)` 每日保留。

## 注意事项

- 不要用本地 dev.db 覆盖线上 prod.db。
- 不要提交 `.env`、`.env.local`、`.env.production`、`.claude/`、`dev.db` 到 git。
- 不要在服务器上直接编辑业务代码。
- 不要使用 `output: "export"` 静态部署（项目使用 `output: "standalone"`）。
- 所有 `/api/admin/*` 接口必须经过 `requireAdmin()` 保护。
- 构建和部署必须在 WSL/Linux 中执行，Windows 下 `next build` 不完全兼容。
