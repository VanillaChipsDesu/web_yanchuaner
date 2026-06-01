# 部署与运维指南

## 部署原则

- **Windows → 本地开发**：在 Windows 上写代码、调试
- **WSL → 构建**：`npm run build` 必须在 WSL 或 Linux 中执行，Windows 不完全兼容
- **服务器 → 只运行**：云服务器运行构建产物，不直接编辑业务代码

> 项目使用 `output: "standalone"`，**不能**使用 `output: "export"`。因为项目包含 API 路由、SQLite 数据库、文件上传、登录认证等服务端功能，静态导出不支持。

---

## 一键部署（每次更新执行）

以下所有步骤均可**复制粘贴**，无脑执行。

### 第一阶段：WSL 构建

在 WSL 终端中逐条执行：

```bash
# ========== 1. 拉取最新代码 ==========
cd ~/alumni-site
git pull origin main

# ========== 2. 安装依赖 ==========
npm ci

# ========== 3. 生成 Prisma Client ==========
npx prisma generate

# ========== 4. 【关键】临时改 DATABASE_URL 为本地库，否则 pre-rendering 会失败 ==========
sed -i 's|file:/var/www/alumni-site/data/prod.db|file:./prisma/dev.db|' .env

# ========== 5. 构建 ==========
npm run build

# ========== 6. 确认 standalone 产物存在 ==========
ls .next/standalone/server.js   # 必须看到这个文件

# ========== 7. 准备部署目录 ==========
rm -rf deploy && mkdir -p deploy
cp -a .next/standalone/. deploy/
cp -a .next/static deploy/.next/static
cp -a public deploy/public
cp -a prisma deploy/prisma

# ========== 8. 恢复 DATABASE_URL 为生产路径 ==========
sed -i 's|file:./prisma/dev.db|file:/var/www/alumni-site/data/prod.db|' .env

# ========== 9. 打包 ==========
tar -czf deploy.tar.gz deploy/
ls -lh deploy.tar.gz   # 约 29MB
```

### 第二阶段：上传到服务器

SSH 被华为云 HSS 拦截，用 **CloudShell** 上传：

```bash
# 1. WSL 中打开文件管理器
explorer.exe .

# 2. 把 deploy.tar.gz 拖到桌面（路径：C:\Users\lucky dog\Desktop\deploy.tar.gz）

# 3. 浏览器打开华为云控制台 → ECS → 远程登录 → CloudShell

# 4. CloudShell 中点「上传文件」，选桌面的 deploy.tar.gz

# 5. CloudShell 中传到 ECS
scp /home/user/deploy.tar.gz root@121.37.68.136:/tmp/
# 密码：Hwy070507
# 如果提示 Input 'XXXX'.Problem contact HSS:XXXX  → 输入它显示的4位数字

# 6. SSH 进服务器
ssh root@121.37.68.136
# 密码：Hwy070507
```

### 第三阶段：服务器部署

SSH 进服务器后，逐条执行：

```bash
# ========== 1. 备份数据库 ==========
cp /var/www/alumni-site/data/prod.db /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S).pre-deploy

# ========== 2. 停止服务 ==========
systemctl stop alumni-site

# ========== 3. 解压并部署 ==========
cd /tmp
rm -rf /tmp/deploy
tar -xzf deploy.tar.gz

# 备份旧版本
mv /var/www/alumni-site/app /var/www/alumni-site/app.old

# 部署新版本
mv /tmp/deploy /var/www/alumni-site/app

# ========== 4. 创建 .env 软链接（deploy 包里没有 .env） ==========
ln -sf /var/www/alumni-site/.env /var/www/alumni-site/app/.env

# ========== 5. uploads 软链接 ==========
ln -sf /var/www/alumni-site/uploads /var/www/alumni-site/app/public/uploads

# ========== 6. 启动服务 ==========
systemctl start alumni-site
systemctl status alumni-site
```

### 第四阶段：验证

```bash
# 本地端口检查
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 期望：200

# HTTPS 检查
curl -s -o /dev/null -w "%{http_code}" https://yanchuaner.cn
# 期望：200

# 查看日志
journalctl -u alumni-site -n 20 --no-pager
```

浏览器访问 `https://yanchuaner.cn`，验证首页、登录、地图、新闻等功能正常。

---

## 回滚（部署出问题时）

```bash
systemctl stop alumni-site
mv /var/www/alumni-site/app /var/www/alumni-site/app.broken
mv /var/www/alumni-site/app.old /var/www/alumni-site/app
systemctl start alumni-site
```

---

## 服务器实际配置

### 目录结构

```text
/var/www/alumni-site/
├── app/                   # 部署代码（server.js + .next + public + prisma）
│   └── .env -> /var/www/alumni-site/.env   # 软链接
├── data/
│   └── prod.db            # 生产 SQLite 数据库
├── uploads/               # 用户上传文件
├── backups/               # 数据库备份
└── .env                   # 生产环境变量（手工维护，不随部署覆盖）
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

### 环境变量

`/var/www/alumni-site/.env`：

```bash
NODE_ENV="production"
DATABASE_URL="file:/var/www/alumni-site/data/prod.db"
PORT=3000
SITE_URL="https://yanchuaner.cn"
SITE_NAME="燕中校友数字母港"
ACCESS_PASSWORD_HASH="8f7ec246a06be739b1774bce02e77b600519a62585f677330a225aa37c7a31e4"
ACCESS_PASSWORD="yanzhongxiaoyouhui"
ADMIN_USERNAME="yanchuaner"
ADMIN_PASSWORD_HASH="615ed7fb1504b0c724a296d7a69e6c7b2f9ea2c57c1d8206c5afdf392ebdfd25"
SESSION_SECRET="12f60fe9c40ad630900e9032bbbd2d9577bf1e2390ae307221e522b81239cf4e"
```

---

## 常用运维命令

```bash
# === 服务管理 ===
systemctl status alumni-site      # 查看运行状态
systemctl restart alumni-site     # 重启
systemctl stop alumni-site        # 停止
systemctl start alumni-site       # 启动

# === 日志 ===
journalctl -u alumni-site -f      # 实时日志
journalctl -u alumni-site -n 50   # 最近 50 行

# === 数据库备份 ===
cp /var/www/alumni-site/data/prod.db /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S)

# === Nginx ===
nginx -t                           # 测试配置
systemctl reload nginx             # 重载配置

# === 证书续期 ===
certbot renew --dry-run            # 测试
certbot renew                      # 正式续期
```

---

## 踩坑记录

| 问题 | 原因 | 解决 |
| --- | --- | --- |
| 构建时 pre-rendering 失败 | DATABASE_URL 指向生产路径，WSL 中不存在 | 构建前临时改为 `file:./prisma/dev.db`，构建后改回 |
| SSH 登录循环提示 HSS 验证码 | 华为云主机安全服务拦截 | 用 CloudShell 上传文件，SSH 仍可用但要输入验证码 |
| Prisma `db push` 报 url 缺失 | Prisma 7.x 把 `url` 从 schema 移到了 `prisma.config.ts` | 数据库已存在无需 db push，直接启动即可 |
| Nginx 502 | proxy_pass 指向 3010，但服务跑在 3000 | 改 Nginx 配置 `proxy_pass http://127.0.0.1:3000` |
| 首次部署缺少目录结构 | 服务器是空的 | 手动创建 `/var/www/alumni-site/{app,data,backups,uploads}` |

---

## 相关文档

- [数据备份与恢复指南](BACKUP_GUIDE.md)
- [管理员使用手册](ADMIN_GUIDE.md)
- [故障排除](TROUBLESHOOTING.md)
- [运营指南](OPERATIONS_GUIDE.md)
