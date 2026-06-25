# 部署与运维指南

## 前置条件

| 环境 | 用途 | 要求 |
| --- | --- | --- |
| Windows + WSL | 构建 `deploy.tar.gz` | Ubuntu 22+/24, Node.js 22, npm 10+ |
| 华为云 ECS | 生产运行 | Ubuntu, Node.js 22, systemd, Nginx |
| 浏览器 | 上传/验证 | 华为云控制台 → CloudShell |

> 构建**必须**在 WSL 原生目录（`~/alumni-site`）进行。从 Windows `cp -r` 代码到 WSL 后，**必须重新 `npm install`**，不能直接用 Windows 的 `node_modules`（跨平台原生模块不兼容）。

---

## 第一阶段：获取代码 & 安装依赖

在 WSL 终端逐条执行：

```bash
# ========== 1. 从 Windows 复制项目 ==========
rm -rf ~/alumni-site
cp -r "/mnt/c/Users/<你的用户名>/Desktop/web_projects/aerospace-alumni-site" ~/alumni-site
cd ~/alumni-site

# ========== 2. 修复权限（Windows cp 过来是只读） ==========
chmod -R u+w prisma/

# ========== 3. 删掉 Windows 的 node_modules，Linux 下重装 ==========
rm -rf node_modules
npm install --registry=https://registry.npmmirror.com
```

> ⚠️ **绝对不能跳过步骤 3**。Windows 的 `better-sqlite3`、`sharp`、`@next/swc` 是 Windows 原生二进制（.dll），在 Linux 下会报 `invalid ELF header`。必须删掉 `node_modules` 重装。

---

## 第二阶段：配置 & 构建

```bash
# ========== 4. 生成 Prisma Client ==========
npx prisma generate

# ========== 5. 创建 .env ==========
cat > .env << 'ENDOFFILE'
NODE_ENV="production"
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
APP_URL="https://yanchuaner.cn"
SITE_URL="https://yanchuaner.cn"
SITE_NAME="燕中校友数字母港"
SESSION_SECRET="<随机32字节hex密钥>"
# RESEND_API_KEY 和 RESEND_FROM_EMAIL 上线前配置（参考 OPERATIONS_GUIDE.md）
# REDIS_URL 可选，未配置时降级为内存限流
ENDOFFILE

# ========== 6. 初始化本地数据库 ==========
npx prisma db push
npm run create-admin

# ========== 7. 构建（WSL 首次会下载 SWC，约 5-10 分钟） ==========
npm run build
```

---

## 第三阶段：打包

```bash
# ========== 8. 确认产物 ==========
ls .next/standalone/server.js || echo "构建失败"

# ========== 9. 删旧打包，准备新目录 ==========
rm -rf deploy deploy.tar.gz    # ⚠️ 必须先删旧包！tar 不会自动覆盖
mkdir -p deploy

# ========== 10. 拷贝部署文件 ==========
cp -a .next/standalone/. deploy/
cp -a .next/static deploy/.next/static
cp -a public deploy/public
cp -a prisma deploy/prisma
cp prisma.config.ts deploy/
cp -a scripts deploy/scripts
cp -a src/data deploy/src/data

# ========== 11. 打包 ==========
tar -czf deploy.tar.gz deploy/
ls -lh deploy.tar.gz
```

---

## 第四阶段：上传到服务器

华为云 SSH 被 HSS 拦截，需走 **CloudShell 中转**：

```bash
# 11. WSL 打开文件管理器
explorer.exe .
# 把新的 deploy.tar.gz 拖到 Windows 桌面

# 12. 浏览器 → 华为云控制台 → ECS → 远程登录 → CloudShell
# CloudShell 点"上传文件"，选桌面的 deploy.tar.gz

# 13. CloudShell 传文件到 ECS
scp /home/user/deploy.tar.gz root@<服务器IP>:/tmp/

# 14. SSH 进服务器
ssh root@<服务器IP>
```

---

## 第五阶段：服务器部署（完整命令，逐条粘贴）

```bash
# === 备份数据库 ===
cp /var/www/alumni-site/data/prod.db /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S).pre-deploy

# === 停止服务 ===
systemctl stop alumni-site

# === 解压新包 ===
cd /tmp
rm -rf /tmp/deploy
tar -xzf deploy.tar.gz

# === 替换旧版本 ===
rm -rf /var/www/alumni-site/app
mv /tmp/deploy /var/www/alumni-site/app

# === 软链接（注意：不要用 ln -sf，用 rm -rf + ln -s） ===
ln -sf /var/www/alumni-site/.env /var/www/alumni-site/app/.env
rm -rf /var/www/alumni-site/app/public/uploads
ln -s /var/www/alumni-site/uploads /var/www/alumni-site/app/public/uploads

# === 修复上传目录循环链接 ===
rm -f /var/www/alumni-site/uploads/uploads

# === 安装 Prisma（服务器 standalone 不含此模块） ===
cd /var/www/alumni-site/app
npm install prisma@7.8.0

# === 同步数据库 ===
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma db push

# === 启动 ===
systemctl start alumni-site

# === 验证 ===
curl -s http://localhost:3000/api/health
```

### 种子数据（首次部署或数据丢失时执行）

```bash
cd /var/www/alumni-site/app

# 初始化页面内容（学校介绍、联系我们、在校生资源站、教师频道）
node scripts/seed_content_sections.js

# 初始化燕中记忆展品
node scripts/seed_memories.js

# 初始化燕中故事
node scripts/seed_stories.js
```

### 首次部署额外步骤

```bash
# 创建目录结构
mkdir -p /var/www/alumni-site/{data,backups,uploads}

# 创建生产 .env（替换尖括号内容为真实值）
cat > /var/www/alumni-site/.env << 'ENDOFFILE'
NODE_ENV="production"
DATABASE_URL="file:/var/www/alumni-site/data/prod.db"
PORT=3000
APP_URL="https://yanchuaner.cn"
SITE_URL="https://yanchuaner.cn"
SITE_NAME="燕中校友数字母港"
SESSION_SECRET="<随机32字节hex密钥>"
# 生产邮件发信服务配置 (Resend API)
RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM_EMAIL="燕中数字母港 <noreply@yanchuaner.cn>"
# REDIS_URL="redis://localhost:6379"
ENDOFFILE
```

---

## 第六阶段：验证

```bash
# 接口检查
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000          # 200
curl -s http://localhost:3000/api/health                               # healthy

# 新页面产物检查（确认构建包含所有页面）
ls /var/www/alumni-site/app/.next/server/app/\(admin\)/admin/content.html && echo "✅ content"
ls /var/www/alumni-site/app/.next/server/app/\(admin\)/admin/stories.html && echo "✅ stories"
ls /var/www/alumni-site/app/.next/server/app/\(admin\)/admin/teachers.html && echo "✅ teachers"

# 日志
journalctl -u alumni-site -n 20 --no-pager
```

浏览器访问 `https://yanchuaner.cn` 验证各功能。

---

## 回滚

```bash
systemctl stop alumni-site
mv /var/www/alumni-site/app /var/www/alumni-site/app.broken
mv /var/www/alumni-site/app.old /var/www/alumni-site/app
systemctl start alumni-site
```

---

## 服务器配置速查

### 目录结构

```text
/var/www/alumni-site/
├── app/                        # 部署代码
│   ├── server.js               # Next.js standalone 入口
│   ├── .env → ../.env          # 软链接到生产环境变量
│   ├── public/uploads → ../../uploads  # 软链接到上传目录
│   ├── .next/                  # 构建产物
│   ├── prisma/                 # schema + 迁移
│   ├── prisma.config.ts        # Prisma 7.x 配置
│   ├── scripts/                # 运维脚本
│   └── node_modules/           # 服务器运行时依赖
├── data/
│   └── prod.db                 # 生产 SQLite 数据库
├── uploads/                    # 用户上传文件（持久化）
├── backups/                    # 数据库备份
└── .env                        # 生产环境变量（不打包）
```

### systemd 服务

`/etc/systemd/system/alumni-site.service`：

```ini
[Unit]
Description=Yanzhong Alumni Site
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/alumni-site/app
EnvironmentFile=/var/www/alumni-site/.env
ExecStart=/usr/bin/node /var/www/alumni-site/app/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Nginx 配置

`/etc/nginx/sites-enabled/alumni-site`：

```nginx
server {
    listen 80;
    server_name yanchuaner.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yanchuaner.cn;

    ssl_certificate /etc/letsencrypt/live/yanchuaner.cn-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yanchuaner.cn-0001/privkey.pem;

    client_max_body_size 8M;

    location /uploads/ {
        alias /var/www/alumni-site/uploads/;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 常用运维命令

```bash
# 服务管理
systemctl status alumni-site
systemctl restart alumni-site
systemctl stop alumni-site

# 日志
journalctl -u alumni-site -n 50 --no-pager
journalctl -u alumni-site -f

# 数据库备份
cp /var/www/alumni-site/data/prod.db /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S)

# Nginx
nginx -t && systemctl reload nginx

# 证书续期
certbot renew
```

---

## 踩坑记录

| 问题 | 原因 | 解决 |
| --- | --- | --- |
| `better-sqlite3` / `sharp` 报 `invalid ELF header` | Windows 的 `node_modules` cp 到了 WSL，原生二进制不兼容 | `rm -rf node_modules && npm install` 重装 |
| WSL 构建卡在"Downloading swc" | SWC 从 GitHub 下载慢 | 等，或设 `export NEXT_SWC_BINARY_URL="https://registry.npmmirror.com/-/binary/next-swc"` |
| `prisma db push` 报 `Cannot find module 'prisma/config'` | 服务器 standalone 不含 prisma 模块 | `npm install prisma@7.8.0` |
| `npm run build` 卡在 "Collecting page data" 超过 20 分钟 | Windows 构建偶尔卡死 | 杀掉进程，`rm -rf .next` 重试。多次失败则换 WSL 构建 |
| 部署后新页面 404 | `deploy.tar.gz` 是旧的，`tar -czf` 不会覆盖已有文件 | 打包前 `rm -rf deploy deploy.tar.gz` |
| `ELOOP: too many symbolic links` 服务启动失败 | uploads 软链接循环（`ln -sf` 在目标已是目录时把链接建进去了） | `rm -rf` 再 `ln -s`，不要用 `ln -sf`。同时 `rm -f /var/www/alumni-site/uploads/uploads` |
| CloudShell 里 `sudo` 不存在 | CloudShell 是独立容器 | 只用于上传 + scp，部署在 ECS 上执行 |
| SSH 提示 HSS 验证码 | 华为云主机安全服务 | 输入显示的 4 位数字后输密码 |
| `WSL npm install` 只有 38 个包 | `npm ci` 与 lockfile 不匹配 | 用 `npm install` + `--registry=https://registry.npmmirror.com` |
| 地图 tags 不显示 | 逗号 vs 竖线分隔符 | 已修复：`parseTags()` 容错 |
| 数据库表不存在 | schema 未同步 | `prisma db push` |
| 生产构建内存不足 SIGBUS | 服务器内存不够构建 | **不要在服务器上构建**，WSL 构建后上传 |
| 证书编号丢失 | 未运行脚本 | 确保打包包含 `scripts/` 目录 |

---

## 相关文档

- [数据备份与恢复指南](BACKUP_GUIDE.md)
- [管理员使用手册](ADMIN_GUIDE.md)
- [故障排除](TROUBLESHOOTING.md)
- [运营指南](OPERATIONS_GUIDE.md)
