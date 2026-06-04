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
SITE_URL="https://yanchuaner.cn"
SITE_NAME="燕中校友数字母港"
ACCESS_PASSWORD_HASH="<口令SHA256哈希>"
ACCESS_PASSWORD="<你的访问口令>"
ADMIN_USERNAME="<管理员用户名>"
ADMIN_PASSWORD_HASH="<管理员密码SHA256哈希>"
SESSION_SECRET="<随机32字节hex密钥>"
ENDOFFILE

# ========== 6. 初始化本地数据库 ==========
DATABASE_URL="file:./prisma/dev.db" npx prisma db push

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
cd /var/www/alumni-site/app && node -e "
const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database('/var/www/alumni-site/data/prod.db');
const now = new Date().toISOString();
function uid() { return crypto.randomUUID(); }

db.exec('DELETE FROM ContentSection WHERE page IN (\"about_features\",\"about_timeline\",\"contact\",\"students\",\"teachers\")');
db.exec('DELETE FROM Story');

const d = [
  ['about_features','航天科技特色','全国首批航天科技教育特色高中。建有深圳市中小学唯一的航天科技教育体验馆、太空探索工程实践室和航天卫星工程实践室。学生自主研发的探空火箭前海宝安飞燕一号成功发射。','','Rocket','','','',0],
  ['about_features','大湾区核心区位','坐落于宝安区燕罗街道广田路108号，粤港澳大湾区核心地带。中共宝安县第一次党代会会址所在地，红色基因与创新精神在这里交汇。','','Globe2','','','',1],
  ['about_features','办学理念','以立德树人、创新发展为核心，构建航天科技教育、智慧教育、个性教育三位一体的办学特色。校名燕川寓意马踏飞燕，海纳百川。','','GraduationCap','','','',2],
  ['about_features','校园规模','占地8.7万平方米，建筑面积11万平方米，总投资11亿元。ARCHINA 2023年度最佳教育建筑TOP10。办学规模60个班，可容纳3000名高中学子。','','MapPin','','','',3],
  ['about_features','集团办学','隶属深圳市新安中学（集团），共享优质教育集团的师资与课程资源。','','Building2','','','',4],
  ['about_features','师资力量','正高级教师1名、高级教师25名、博士教师3名。广东省中小学智慧教育应用标杆校、宝安区首批教育数字化转型标杆学校。','','Users','','','',5],
  ['about_timeline','学校筹建成立','事业单位登记成立，筹建名称为深圳市第十三高级中学','','History','','','2021',0],
  ['about_timeline','正式开学','9月1日迎来首届高一学子，20个班共1000人。同年加入新安中学（集团）。','','History','','','2022',1],
  ['about_timeline','航天特色启航','与中国航天科技国际交流中心合作，航天科技教育体验馆落成。','','History','','','2022',2],
  ['about_timeline','崭露头角','航天科技特色项目列入宝安区重点工作；参与中国航天大会并获奖。','','History','','','2023',3],
  ['about_timeline','建筑获奖','校园建筑获评ARCHINA年度最佳教育建筑TOP10。','','History','','','2023',4],
  ['about_timeline','标杆之路','获评广东省中小学智慧教育应用标杆校、宝安区首批教育数字化转型标杆学校。','','History','','','2024',5],
  ['about_timeline','数字母港启航','校友数字母港平台正式上线，为燕中人建立永久的精神家园。','','History','','','2025',6],
  ['about_timeline','持续前行','入选广东省基础教育课程教学改革深化行动实验校、广东省中小学科学教育示范校。','','History','','','2026',7],
  ['contact','联系邮箱','网站维护、技术反馈、内容建议或活动合作，都可以发到这里。','yanchuan_alumni@163.com','Mail','mailto:yanchuan_alumni@163.com','发送邮件','',0],
  ['contact','校友投稿','你的燕中故事值得被记住。课堂趣事、校园回忆、成长感悟，都欢迎来稿。审核后发布。','','MessageSquare','/alumni/stories','前往燕中故事投稿','',1],
  ['contact','活动合作','想发起校友聚会、返校日或线上分享？告诉我们你的想法，我们帮你传播。','','CalendarDays','','','',2],
  ['students','志愿填报参考','分数、位次、城市、学校、专业——填志愿不是做选择题，是认识自己的过程。学长学姐用亲身经历帮你理清思路。','','School','/students/application-guide','','',0],
  ['students','大学与专业观察','这个专业到底学什么？那所大学怎么样？校友们用真实体验告诉你答案。','','Building2','/students/university-insights','','',1],
  ['students','学长问答','专业怎么选？志愿怎么填？大学怎么适应？过来人给你答案。','','HelpCircle','/students/senior-qa','','',2],
  ['students','学习方法','时间管理、高效复习、心态调整——不是鸡汤，是真能用的干货。','','GraduationCap','/students/learning-methods','','',3],
  ['students','校友寄语','天南海北的学长学姐，写给还在燕中的你。关于选择、努力与成长。','','Sparkles','/students/alumni-messages','','',4],
  ['teachers','教师名录','燕川中学在职及退休教师基本信息（学科、教学特色等），由校友志愿者持续补充。','欢迎校友提供恩师资料','BookOpen','','','',0],
  ['teachers','名师风采','展示燕川中学优秀教师的先进事迹与教学成就，传承尊师重教的校园传统。','期待你的推荐与投稿','Star','','','',1],
  ['teachers','教研成果','公开课、课题研究、教学论文——记录老师们的专业成长与教研探索。','内容整理中','Heart','','','',2],
  ['teachers','校友联络','想对恩师说声谢谢？通过燕中故事投稿，我们会让老师知道你的近况。','','MessageSquare','/alumni/stories','向恩师表达问候','',3],
];

const insert = db.prepare('INSERT INTO ContentSection (id, page, title, description, note, icon, href, actionLabel, yearLabel, sortOrder, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
for (const r of d) { insert.run(uid(), ...r, now, now); }
console.log('ContentSection: ' + d.length);

db.prepare('INSERT OR IGNORE INTO Story (id,title,author,tags,body,date,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)').run('story-1','写代码之前，先学会提问','黄同学 · 2022级1班 · 计算机专业','[\"专业真相\",\"避坑指南\"]','大一最容易掉的坑，就是以为课程难是最大挑战。其实真正拉开差距的，是从被动做题切换到主动定义问题。建议学弟学妹提前练习：用搜索引擎精准找到答案、看懂一篇技术文档、把模糊的需求拆成可执行的步骤。会提问的人，就已经解决了一半的问题。','2026-03-18',now,now);
db.prepare('INSERT OR IGNORE INTO Story (id,title,author,tags,body,date,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)').run('story-2','停电那晚，我们把青春写进走廊','吴同学 · 2022级17班 · 新闻传播专业','[\"校园回忆\",\"青春寄语\"]','高三有天晚上突然停电，整栋教学楼只剩手电筒的微光和窗外的星光。没有人回宿舍。我们围在走廊尽头，借着应急灯背英语、背地理，也聊起十年后你想成为什么样的人。那晚我们说了很多，关于大学、关于未来、关于不想散的约定。现在回头看，那不止是一个备考的夜晚。那是我们各自起飞前，最后一次集体抬头看星空。','2026-03-26',now,now);
db.prepare('INSERT OR IGNORE INTO Story (id,title,author,tags,body,date,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)').run('story-3','热门专业不等于适合你','杨同学 · 2022级14班 · 经济学专业','[\"专业真相\",\"避坑指南\"]','填志愿那会儿，我们最容易被就业率、薪资排名、听起来很厉害这些标签带偏。大学读了一年才明白：真正能让你走远的，是兴趣、能力和性格三者的交集。三个建议：1. 找在读的学长学姐聊聊，别只看招生简章；2. 去大学官网看课程表；3. 试着做一个小项目。不跟风，才能走得更稳。','2026-04-01',now,now);
db.prepare('INSERT OR IGNORE INTO Story (id,title,author,tags,body,date,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)').run('story-4','从燕中到大学：这一年我学会了什么','左同学 · 2022级20班 · 设计专业','[\"青春寄语\",\"校园回忆\"]','刚上大学那阵子，最不习惯的是没人管你了。不用六点起床跑操，不用穿校服，不用被班主任盯着交作业。自由来得太突然，反而有点慌。慢慢才明白，高中三年教给我的不只是知识，更是自律。那些你以为没用的晨读、晚自习、周考，其实都在帮你长出一根脊梁骨。谢谢燕中，谢谢那个每天天没亮就爬起来的自己。','2026-05-15',now,now);
console.log('Stories: 4');

db.close();
console.log('Seed complete.');
"
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
SITE_URL="https://yanchuaner.cn"
SITE_NAME="燕中校友数字母港"
ACCESS_PASSWORD_HASH="<口令SHA256哈希>"
ACCESS_PASSWORD="<你的访问口令>"
ADMIN_USERNAME="<管理员用户名>"
ADMIN_PASSWORD_HASH="<管理员密码SHA256哈希>"
SESSION_SECRET="<随机32字节hex密钥>"
ENDOFFILE
```

---

## 第六阶段：验证

```bash
# 接口检查
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000          # 200
curl -s http://localhost:3000/api/health                               # healthy

# 新页面产物检查（确认构建包含所有页面）
ls /var/www/alumni-site/app/.next/server/app/admin/content.html && echo "✅ content"
ls /var/www/alumni-site/app/.next/server/app/admin/stories.html && echo "✅ stories"
ls /var/www/alumni-site/app/.next/server/app/admin/teachers.html && echo "✅ teachers"

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
