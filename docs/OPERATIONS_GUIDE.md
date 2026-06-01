# 运营指南

本文档覆盖本地开发、环境配置、数据库操作、脚本工具使用和日常运维的全部流程。

---

## 1. 本地开发流程

```bash
git clone <repo-url>
cd aerospace-alumni-site
cp .env.example .env          # 从模板创建环境变量文件
npm ci                         # 严格按 lockfile 安装依赖
npx prisma generate            # 生成 Prisma Client
npx prisma db push             # 同步数据库 schema（创建表结构）
npm run dev                    # 启动开发服务器 → http://localhost:3000
```

**日常开发**：
```bash
npm run dev                    # 开发模式（热更新）
npm run lint                   # ESLint 代码检查
npm run build                  # 生产构建
```

Windows 本地开发使用 SQLite `prisma/dev.db`，所有数据变更可通过 Prisma schema + `db push` 或后台 UI 操作完成。

---

## 2. 环境变量

| 变量名 | 用途 | 必填 |
|--------|------|------|
| `DATABASE_URL` | SQLite 数据库连接字符串（如 `file:./dev.db`） | 是 |
| `ACCESS_PASSWORD` | 普通访问口令（明文，启动时自动计算 SHA256） | 是 |
| `ACCESS_PASSWORD_HASH` | 普通访问口令的预计算 SHA256 哈希（与 ACCESS_PASSWORD 二选一，推荐） | 推荐 |
| `ADMIN_USERNAME` | 管理员登录账号 | 是 |
| `ADMIN_PASSWORD_HASH` | 管理员密码的 SHA256 哈希值 | 是 |
| `SESSION_SECRET` | HMAC-SHA256 token 签名密钥（随机字符串） | 是 |
| `SITE_URL` | 站点根 URL（用于 Open Graph 等 SEO 标签） | 否 |
| `SITE_NAME` | 站点名称（SEO） | 否 |

**.env 文件管理原则**：
- `.env` 不提交到 git（已在 `.gitignore` 中）
- `.env.example` 只写变量名和占位值，不写真实凭据
- 生产环境的 `.env` 独立维护在服务器 `/var/www/alumni-site/.env`

---

## 3. 凭证管理

### 3.1 两套独立凭据体系

| 凭据类型 | 用途 | 保护范围 |
|----------|------|----------|
| 普通访问口令 | 校友/访客进入站点 | 整个站点（`/admin/*` 和 `/api/admin/*` 除外） |
| 管理员账号密码 | 管理员登录后台 | `/admin/*`、`/api/admin/*`、上传 API |

两种凭据互不干扰，普通口令用户无法访问后台。

### 3.2 一键修改凭据

项目提供了 `scripts/set-credentials.js` 脚本，可一次性更新访问口令、管理员账号和密码：

```bash
# 1. 首次使用：复制模板
cp credentials.example.json credentials.local.json

# 2. 编辑 credentials.local.json，填写新值
#    - accessPassword: 新的访问口令
#    - adminUsername: 新的管理员账号
#    - adminPassword: 新的管理员密码（明文，脚本自动 SHA256）

# 3. 执行更新
node scripts/set-credentials.js
```

**脚本特性**：
- 原子写入 `.env`，防止配置文件半写损坏
- 自动备份旧 `.env` 文件（带时间戳），支持回滚
- `credentials.local.json` 已在 `.gitignore` 中，不会意外提交
- 修改后需重启服务才能生效

**回滚方法**：脚本输出中会给出恢复命令，直接复制执行即可。

---

## 4. 数据库操作

### 4.1 数据库类型与位置

| 环境 | 路径 | 说明 |
|------|------|------|
| 本地开发 | `prisma/dev.db` | SQLite 单文件，可随意修改 |
| 生产环境 | `/var/www/alumni-site/data/prod.db` | SQLite 单文件，禁止直接覆盖 |

### 4.2 如何修改数据

有多种方式可以修改数据库中的数据：

**方式一：通过后台 UI（推荐）**

这是最安全的方式。登录 `/admin` 后通过图形界面管理新闻、活动、校友名单等。所有修改即时生效，无需重启服务。

**方式二：通过 Prisma Studio（本地开发）**

```bash
npx prisma studio
```

打开浏览器中的数据库浏览器 (`http://localhost:5555`)，可直观地浏览和编辑所有表和记录。适合本地开发和调试。

**方式三：通过 API（程序化）**

后台管理 API 支持对新闻、活动、校友名单等资源的 CRUD 操作。需要管理员 cookie 认证。详见 [ROUTES.md](ROUTES.md) 中的 API 路由清单。

**方式四：直接操作 SQLite 数据库（仅限紧急情况）**

```bash
# 连接数据库
sqlite3 prisma/dev.db

# 查看所有表
.tables

# 查看表结构
.schema WhitelistRoster

# 查询数据
SELECT * FROM WhitelistRoster WHERE name LIKE '%张三%';

# 修改数据（务必先备份！）
UPDATE WhitelistRoster SET tags = '清华大学 | 计算机 | 北京' WHERE id = 'xxx';

# 退出
.quit
```

> **警告**：直接操作生产数据库前必须先备份！参考 [BACKUP_GUIDE.md](BACKUP_GUIDE.md)。

**方式五：通过 CSV 导入/导出**

校友名单支持批量 CSV 导入。适用于初次填充数据或批量更新：
1. 先从后台导出当前数据为 CSV
2. 在 Excel / Google Sheets 中编辑
3. 通过后台导入功能上传修改后的 CSV

### 4.3 数据库 Schema 变更

如果修改了 `prisma/schema.prisma`：

```bash
# 本地开发：直接同步
npx prisma db push

# 生产环境：部署后在服务器执行
cd /var/www/alumni-site/app
npx prisma db push
```

**不要执行 `prisma migrate reset`**，这会清空所有数据。

### 4.4 数据库备份

```bash
# 本地备份
cp prisma/dev.db "prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)"

# 生产备份（在服务器上）
cp /var/www/alumni-site/data/prod.db "/var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S)"
```

详细备份策略见 [BACKUP_GUIDE.md](BACKUP_GUIDE.md)。

---

## 5. 脚本工具

| 脚本 | 用途 | 使用场景 |
|------|------|----------|
| `scripts/smoke-test.js` | 关键路径回归测试 | 部署前验证认证、后台流程是否正常 |
| `scripts/set-credentials.js` | 一键更新凭证 | 轮换访问口令或管理员密码 |
| `scripts/seed_content.js` | 种子内容数据 | 首次初始化或重置测试数据 |
| `scripts/seed_whitelist.js` | 种子校友名单 | 填充初始校友数据 |
| `scripts/rebuild_roster.js` | 重建校友名单 | 数据修复或迁移 |
| `scripts/sync_roster.js` | 同步校友名单 | 数据同步 |
| `scripts/build_list.js` | 构建列表文件 | 生成静态数据文件 |
| `scripts/clean.sh` | 清理构建产物 | 清除 `.next`、缓存等 |
| `scripts/gen_cert_numbers.js` | 批量生成证书编号 | 新增校友后统一编号 |
| `scripts/backup.sh` | 自动备份数据库与上传文件 | 配合 cron 定时执行 |

### 烟雾测试（smoke-test.js）

```bash
# 使用环境变量配置测试参数
SMOKE_BASE_URL=http://localhost:3000 \
SMOKE_ACCESS_PASSWORD=yourpassword \
SMOKE_ADMIN_USERNAME=admin \
SMOKE_ADMIN_PASSWORD=yourpassword \
node scripts/smoke-test.js
```

测试覆盖：普通口令验证 → 管理员登录 → 后台 API 访问 → 校友数据 API 访问。

### 证书编号管理（gen_cert_numbers.js）

电子校友证上的编号来自数据库 `WhitelistRoster.certificateNo` 字段。留空则回退显示 UUID。

```bash
node scripts/gen_cert_numbers.js
```

脚本逻辑：

- 8 位核心成员（黄湘林、左佳维等）→ 编号置空，由管理员手动填写
- 其余成员 → 按姓名排序生成 `YC-2022-0001` ~ `YC-2022-0096`

两种方式修改编号：

- 后台 → 校友名单 → 编辑 → 证书编号输入框
- 数据库 → `npx prisma studio` → WhitelistRoster → certificateNo 列

---

## 6. CSV 导入/导出规范

### 6.1 编码要求

- 文件编码必须是 **UTF-8**（不是 GBK、不是 UTF-8 BOM）
- 导出的文件使用 UTF-8 BOM（确保 Excel 正确识别中文）

### 6.2 表头格式

支持中文和英文两种表头：

| 中文表头 | 英文表头 | 说明 |
|----------|----------|------|
| 姓名 | name | 必填 |
| 届别 | graduationClass | 如"2022级3班" |
| 标签 | tags | 格式：`大学名 \| 专业 \| 城市` |

### 6.3 标签格式

标签中的三个部分用 `|`（竖线）分隔，顺序固定：

```
大学名称 | 专业名称 | 城市名称
```

示例：
```
清华大学 | 计算机科学与技术 | 北京
中山大学 | 临床医学 | 广州
```

城市名称用于校友地图的城市聚合。如果只填大学和专业，城市在导入后不会在地图上显示。

### 6.4 导入去重

按 `姓名 + 届别` 去重。同名且同届别的记录视为同一人，后导入的数据覆盖先前的数据。

### 6.5 导出安全

导出的 CSV 做了**公式注入防护**：以 `=`、`+`、`-`、`@` 开头的字段前自动加单引号前缀。

---

## 7. 图片上传

### 7.1 支持的上传类型

| 上传入口 | API 路由 | 用途 |
|----------|----------|------|
| 后台新闻/活动编辑页 | `/api/upload` | 新闻封面图、活动封面图 |
| 校友证页面（管理端） | `/api/alumni/certificate/upload-bg` | 校友证个人背景图 |
| 系统设置 | `/api/settings/card-bg/upload` | 校友纪念卡默认背景（16:9，Sharp 裁切） |

### 7.2 上传要求

- 格式：PNG / JPG / WebP
- 新闻/活动封面建议尺寸：1200×630
- 校友卡默认背景：16:9 比例（2752×1548），服务端自动裁切
- 文件大小限制由 `next.config.mjs` 中的 `serverActions.bodySizeLimit` 控制

### 7.3 上传目录

| 环境 | 路径 |
|------|------|
| 本地开发 | `public/uploads/` |
| 生产环境 | `/var/www/alumni-site/uploads/`（通过 Nginx `/uploads/` 路径对外服务） |

---

## 8. 生产运维

### 8.1 服务管理

```bash
# 查看服务状态
sudo systemctl status alumni-site

# 重启服务
sudo systemctl restart alumni-site

# 查看实时日志
sudo journalctl -u alumni-site -f

# 停止/启动
sudo systemctl stop alumni-site
sudo systemctl start alumni-site
```

### 8.2 日常检查清单

- [ ] 站点首页正常访问
- [ ] 管理员能正常登录
- [ ] 数据库文件大小正常（未异常增长）
- [ ] 磁盘空间充足（`df -h`）
- [ ] 备份文件在有效期内

---

## 9. 注意事项

- **不要用本地 dev.db 覆盖线上 prod.db**
- **不要提交** `.env`、`.env.local`、`.env.production`、`credentials.local.json`、`.claude/`、`dev.db` 到 git
- **不要在服务器上直接编辑业务代码**
- **构建和部署必须**在 WSL 或 Linux 中执行（Windows 下 `next build` 不完全兼容）
- **不要使用** `output: "export"` 静态部署（项目依赖 API 路由、数据库、上传等动态功能）
- **所有** `/api/admin/*` 接口必须经过 `requireAdmin()` 保护
- 修改凭据后**必须重启服务**才能生效
- 直接操作生产数据库前**必须先备份**
