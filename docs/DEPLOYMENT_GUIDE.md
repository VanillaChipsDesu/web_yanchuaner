# 部署与运维指南

## 前置条件

| 环境 | 用途 | 要求 |
| --- | --- | --- |
| Windows + WSL | 构建 `deploy.tar.gz` | Ubuntu 22+/24, Node.js 22, npm 10+ |
| 华为云 ECS | 生产运行 | Ubuntu, Node.js 22, systemd, Nginx |
| 浏览器 | 上传/验证 | 华为云控制台 → CloudShell |

> 构建**必须**在 WSL 原生目录（`~/alumni-site`）进行，**不能**使用 `/mnt/c/...` Windows 挂载路径（网络请求会超时）。

---

## 第一阶段：获取代码 & 安装依赖

在 WSL 终端逐条执行：

```bash
# ========== 1. 获取项目（二选一） ==========

# 方式 A：从 Windows 复制（推荐，不走网络）
cp -r "/mnt/c/Users/<你的用户名>/Desktop/web_projects/aerospace-alumni-site" ~/alumni-site

# 方式 B：从 GitHub clone（需要 WSL 能访问 GitHub）
# git clone https://github.com/yanchuaner/web_yanchuaner.git ~/alumni-site

# ========== 2. 进目录 ==========
cd ~/alumni-site

# ========== 3. 清洁安装依赖（必须完整跑完，约 3 分钟） ==========
rm -rf node_modules
npm install --registry=https://registry.npmmirror.com
# 看到 "added 523 packages" 才算完成
```

---

## 第二阶段：配置 & 构建

```bash
# ========== 4. 生成 Prisma Client ==========
npx prisma generate

# ========== 5. 创建 .env 并填入真实凭据 ==========
cat > .env << 'ENDOFFILE'
NODE_ENV="production"
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
SITE_URL="https://yanchuaner.cn"
SITE_NAME="燕中校友数字母港"
ACCESS_PASSWORD_HASH="<口令SHA256哈希>"
ACCESS_PASSWORD="<你的访问口令>"
ADMIN_USERNAME="<管理员用户名>"
ADMIN_PASSWORD_HASH="<管理员密码SHA256哈希>"
SESSION_SECRET="<随机32字节hex密钥>"
ENDOFFILE

# ========== 6. 初始化本地数据库（用于 pre-rendering） ==========
DATABASE_URL="file:./prisma/dev.db" npx prisma db push

# ========== 7. 生产构建 ==========
npm run build
# 看到 "✓ Generating static pages (53/53)" 才算成功
# 如有 "FetchError: ...fonts.googleapis.com..." 可忽略（Google Fonts 网络超时但不影响构建）
```

---

## 第三阶段：打包

```bash
# ========== 8. 确认 standalone 产物 ==========
ls .next/standalone/server.js || echo "❌ standalone 缺失，构建失败"

# ========== 9. 准备部署目录 ==========
rm -rf deploy && mkdir -p deploy
cp -a .next/standalone/. deploy/
cp -a .next/static deploy/.next/static
cp -a public deploy/public
cp -a prisma deploy/prisma
cp prisma.config.ts deploy/
cp -a scripts deploy/scripts

# ========== 10. 打包 ==========
tar -czf deploy.tar.gz deploy/
ls -lh deploy.tar.gz   # 约 29MB
```

---

## 第四阶段：上传到服务器

华为云 SSH 被 HSS 拦截，需走 **CloudShell 中转**：

```bash
# ========== 11. WSL 打开文件管理器 ==========
explorer.exe .
# 把 deploy.tar.gz 拖到 Windows 桌面

# ========== 12. 浏览器 → 华为云控制台 → ECS → 远程登录 → CloudShell ==========
# CloudShell 中点"上传文件"，选桌面的 deploy.tar.gz
# 等待上传完成

# ========== 13. CloudShell 传文件到 ECS ==========
scp /home/user/deploy.tar.gz root@<服务器IP>:/tmp/
# 密码：<你的SSH密码>
# 提示 "Input 'XXXX'.Problem contact HSS:XXXX" → 输入显示的 4 位数字

# ========== 14. SSH 进服务器 ==========
ssh root@<服务器IP>
# 密码：<你的SSH密码>
```

---

## 第五阶段：服务器部署

进入服务器后逐条执行：

```bash
# ========== 15. 备份生产数据库 ==========
# 首次部署跳过此步（/var/www/alumni-site/data/prod.db 不存在）
cp /var/www/alumni-site/data/prod.db /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S).pre-deploy 2>/dev/null || echo "跳过备份（数据库不存在）"

# ========== 16. 停止服务 ==========
systemctl stop alumni-site 2>/dev/null || echo "服务未运行（首次部署正常）"

# ========== 17. 解压 & 部署 ==========
cd /tmp
rm -rf /tmp/deploy
tar -xzf deploy.tar.gz

# 备份旧版本（首次部署跳过）
mv /var/www/alumni-site/app /var/www/alumni-site/app.old 2>/dev/null || echo "无旧版本（首次部署正常）"

# 部署新版本
mv /tmp/deploy /var/www/alumni-site/app

# ========== 18. 软链接 ==========
ln -sf /var/www/alumni-site/.env /var/www/alumni-site/app/.env
ln -sf /var/www/alumni-site/uploads /var/www/alumni-site/app/public/uploads

# ========== 19. 同步数据库 schema ==========
cd /var/www/alumni-site/app
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma db push

# ========== 20. 启动 & 验证 ==========
systemctl start alumni-site
systemctl status alumni-site
```

### 仅首次部署需要

```bash
# 创建生产目录结构
mkdir -p /var/www/alumni-site/{data,backups,uploads}

# 创建生产 .env
cat > /var/www/alumni-site/.env << 'ENDOFFILE'
NODE_ENV="production"
DATABASE_URL="file:/var/www/alumni-site/data/prod.db"
PORT=3000
SITE_URL="https://yanchuaner.cn"
SITE_NAME="燕中校友数字母港"
ACCESS_PASSWORD_HASH="<口令SHA256哈希>"
ACCESS_PASSWORD="<你的访问口令>"
ADMIN_USERNAME="<管理员用户名>"
ADMIN_PASSWORD_HASH="<管理员密码SHA256哈希>"
SESSION_SECRET="<随机32字节hex密钥>"
ENDOFFILE

# 设置备份 cron
cp /var/www/alumni-site/app/scripts/backup.sh /var/www/alumni-site/backups/
chmod +x /var/www/alumni-site/backups/backup.sh
(crontab -l 2>/dev/null; echo "30 2 * * * /var/www/alumni-site/backups/backup.sh daily") | crontab -
```

---

## 第六阶段：验证

```bash
# ========== 21. 接口检查 ==========
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000        # 期望 200
curl -s http://localhost:3000/api/health                             # 期望 "healthy"
curl -s -o /dev/null -w "%{http_code}" https://yanchuaner.cn        # 期望 200

# ========== 22. 日志检查 ==========
journalctl -u alumni-site -n 20 --no-pager
```

浏览器访问 `https://yanchuaner.cn`，验证首页、登录、地图、新闻、燕中记忆等功能。

---

## 回滚（部署出问题时）

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
├── app/                   # 部署代码（server.js + .next + public + prisma + scripts）
│   └── .env → /var/www/alumni-site/.env
├── data/
│   └── prod.db            # 生产 SQLite 数据库
├── uploads/               # 用户上传文件
├── backups/               # 数据库备份
└── .env                   # 生产环境变量
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
systemctl status alumni-site    # 状态
systemctl restart alumni-site   # 重启
systemctl stop alumni-site      # 停止

# 日志
journalctl -u alumni-site -n 50 --no-pager  # 最近 50 行
journalctl -u alumni-site -f                 # 实时跟踪

# 数据库备份
cp /var/www/alumni-site/data/prod.db /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S)

# Nginx
nginx -t && systemctl reload nginx

# 证书续期
certbot renew --dry-run
certbot renew
```

---

## 踩坑记录

| 问题 | 原因 | 解决 |
| --- | --- | --- |
| GitHub clone 失败 / TLS 错误 | WSL 不走 Windows VPN | 方式 A：从 Windows 目录 `cp -r` 到 WSL |
| `npm install` 只有 38 个包 | `npm ci` 与 lockfile 不匹配，依赖被提前打断 | 用 `npm install` + 镜像源，保证跑完 500+ 包 |
| `prisma generate` 报 `Cannot find module 'prisma/config'` | node_modules 不完整 | 确认 `npm install` 完整跑完 |
| `.env` 不存在导致 `sed -i` 失败 | 新 clone 仓库只有 `.env.example` | 构建前 `cat > .env` 写入生产凭据 |
| Google Fonts 超时（非致命） | WSL 无代理访问 Google APIs | 忽略，构建照常完成，浏览器端正常加载 |
| CloudShell 里 `sudo` 不存在 | CloudShell 是独立容器，不是 ECS | CloudShell 只用于上传 + scp，部署在 ECS 上执行 |
| SSH 循环提示 HSS 验证码 | 华为云主机安全服务拦截 | 输入显示的 4 位数字后输密码，或用 VNC |
| `prisma db push` 报 `datasource.url is required` | Prisma 7.x 需 `prisma.config.ts` | 打包时已包含 `prisma.config.ts`，或用 `DATABASE_URL=` 前缀 |
| `NODE_OPTIONS="--max-old-space-size=512"` + SIGBUS | 服务器内存不足，构建进程被杀 | **不要在生产服务器上构建**，WSL 构建后上传 deploy |
| 部署后地图空白 | tags 用逗号而非竖线分隔 | 已修复：`parseTags()` 容错两种分隔符 |
| 部署后 `MemoryItem` 表不存在 | schema 未同步 | `prisma db push` |
| 部署后编号丢失 | 证书编号脚本未运行 | `DATABASE_URL=... node scripts/gen_cert_numbers.js` |

---

## 相关文档

- [数据备份与恢复指南](BACKUP_GUIDE.md)
- [管理员使用手册](ADMIN_GUIDE.md)
- [故障排除](TROUBLESHOOTING.md)
- [运营指南](OPERATIONS_GUIDE.md)
