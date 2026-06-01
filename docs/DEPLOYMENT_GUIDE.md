# 部署与运维指南

## 部署原则

- **Windows → 本地开发**：在 Windows 上写代码、调试
- **WSL / Linux → 构建**：`npm run build` 必须在 WSL 或 Linux 中执行，Windows 不完全兼容
- **服务器 → 只运行**：云服务器运行构建产物，不直接编辑业务代码

> 项目使用 `output: "standalone"`，**不能**使用 `output: "export"`。因为项目包含 API 路由、SQLite 数据库、文件上传、登录认证等服务端功能，静态导出不支持。

---

## WSL 构建流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖（严格按 lockfile）
npm ci

# 3. 生成 Prisma Client
npx prisma generate

# 4. 代码检查
npm run lint

# 5. 生产构建
npm run build

# 6. 部署目录准备
rm -rf deploy
mkdir -p deploy

# 7. 复制 standalone 产物
cp -a .next/standalone/. deploy/

# 8. 复制静态资源
cp -a .next/static deploy/.next/static

# 9. 复制公共资源与 Prisma schema
cp -a public deploy/public
cp -a prisma deploy/prisma
```

---

## 构建产物目录结构

构建完成后 `deploy/` 目录应包含：

```
deploy/
├── server.js              # Next.js standalone 入口
├── .next/
│   ├── BUILD_ID
│   ├── server/            # 服务端代码
│   └── static/            # 静态资源（JS/CSS）
├── public/                # 公共资源
└── prisma/                # Prisma schema（用于生产环境 db push）
```

### 不应包含在部署包中的内容

- `.env`（服务器上有独立配置）
- `dev.db` / `prod.db`（数据库在独立 data 目录）
- `.git/`
- `.next/cache/`
- `node_modules/`（standalone 已包含必要依赖）
- `public/uploads/`（上传文件在独立目录，通过 Nginx 代理）
- `.claude/`

---

## 服务器目录结构

```
/var/www/alumni-site/
├── app/                   # 部署代码（server.js + .next + public + prisma）
├── data/                  # 数据库目录
│   └── prod.db            # 生产 SQLite 数据库
├── uploads/               # 用户上传文件（Nginx 代理 /uploads/）
├── backups/               # 备份文件
└── .env                   # 生产环境变量（不随代码部署，手工维护）
```

---

## systemd 服务

服务名：`alumni-site`

### 服务配置文件

`/etc/systemd/system/alumni-site.service`：

```ini
[Unit]
Description=Alumni Site
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/alumni-site/app
EnvironmentFile=/var/www/alumni-site/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 监听端口

应用监听 `127.0.0.1:3010`（仅本地回环，不直接对外暴露。前端通过 Nginx 反向代理访问）

### systemd 常用命令

```bash
sudo systemctl status alumni-site     # 查看运行状态
sudo systemctl restart alumni-site    # 重启服务
sudo systemctl stop alumni-site       # 停止服务
sudo systemctl start alumni-site      # 启动服务
sudo systemctl enable alumni-site     # 开机自启
sudo journalctl -u alumni-site -f     # 实时查看日志
sudo journalctl -u alumni-site -n 50  # 查看最近 50 行日志
```

---

## Nginx 配置

```nginx
# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name yanchuaner.cn;
    return 301 https://$server_name$request_uri;
}

# 主站点
server {
    listen 443 ssl http2;
    server_name yanchuaner.cn;

    ssl_certificate     /etc/letsencrypt/live/yanchuaner.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yanchuaner.cn/privkey.pem;

    # 上传文件直接由 Nginx 返回（不经过 Node 应用）
    location /uploads/ {
        alias /var/www/alumni-site/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 其他请求代理到 Next.js 应用
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Nginx 常用命令

```bash
sudo nginx -t                        # 测试配置语法
sudo systemctl reload nginx          # 重载配置（不中断服务）
sudo systemctl restart nginx         # 重启 Nginx
```

---

## HTTPS 证书（Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书（自动配置 Nginx）
sudo certbot --nginx -d yanchuaner.cn

# 测试自动续期
sudo certbot renew --dry-run

# certbot 默认已配置 systemd timer 自动续期，无需手动操作
```

---

## 完整部署步骤

每次部署前按以下步骤执行：

### 1. 备份生产数据库

```bash
cp /var/www/alumni-site/data/prod.db \
  /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S).pre-deploy
```

### 2. 在 WSL/Linux 中构建

按上文"WSL 构建流程"执行，生成 `deploy/` 目录。

### 3. 上传构建产物到服务器

```bash
# 方式一：scp
scp -r deploy/ user@server:/tmp/alumni-deploy

# 方式二：rsync（推荐，增量同步）
rsync -avz deploy/ user@server:/tmp/alumni-deploy/
```

### 4. 在服务器上部署

```bash
# 停止服务
sudo systemctl stop alumni-site

# 备份当前版本（方便回滚）
mv /var/www/alumni-site/app /var/www/alumni-site/app.old

# 部署新版本
mv /tmp/alumni-deploy /var/www/alumni-site/app

# 确保 .env 存在且配置正确（不会被覆盖）
ls -la /var/www/alumni-site/.env

# 创建 uploads 软链接
ln -sf /var/www/alumni-site/uploads /var/www/alumni-site/app/public/uploads

# 同步数据库结构（如果 Prisma schema 有变更）
cd /var/www/alumni-site/app
npx prisma db push

# 启动服务
sudo systemctl start alumni-site

# 检查状态
sudo systemctl status alumni-site

# 查看日志确认正常启动
sudo journalctl -u alumni-site -f
```

### 5. 验证

- 访问 `https://yanchuaner.cn` 确认首页正常加载
- 访问 `https://yanchuaner.cn/admin/login` 确认登录页正常
- 访问 `https://yanchuaner.cn/api/health` 确认返回 200
- 确认管理员登录、新闻浏览、校友搜索等核心功能正常

### 6. 回滚（如果部署出问题）

```bash
sudo systemctl stop alumni-site
mv /var/www/alumni-site/app /var/www/alumni-site/app.broken
mv /var/www/alumni-site/app.old /var/www/alumni-site/app
sudo systemctl start alumni-site
```

---

## Prisma Schema 变更

如果 `prisma/schema.prisma` 有修改：

1. **先备份生产数据库**（参考 [BACKUP_GUIDE.md](BACKUP_GUIDE.md)）
2. 在本地修改 schema 并测试
3. 构建时确保 `deploy/prisma/` 包含最新 schema
4. 部署后在服务器执行：

   ```bash
   cd /var/www/alumni-site/app
   npx prisma db push    # 同步表结构（不丢数据）
   ```

5. **不要执行 `prisma migrate reset`**，这会清空所有数据
6. 验证数据完整性

---

## 关键注意事项

- 上线后**严禁用本地 dev.db 覆盖线上 prod.db**
- 不要在服务器上直接编辑业务代码或 `prisma/schema.prisma`
- 部署前**务必**备份数据库
- 上传目录（`uploads/`）在部署时**不要覆盖**
- `.env` 在每个环境独立配置，**不随代码部署**
- 构建必须在 **WSL 或 Linux** 中执行
- 应用监听 `127.0.0.1`，不对外暴露端口，仅通过 Nginx 代理
- 生产日志通过 `journalctl` 查看，不在应用目录生成日志文件
