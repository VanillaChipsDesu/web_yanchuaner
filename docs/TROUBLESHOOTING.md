# 故障排除

本文档记录项目开发与运维中实际遇到的问题及修复方案。按分类编排，方便快速定位。

---

## 构建问题

### 1. UTF-8 编码导致构建失败

**现象**：
- `npm run build` 失败
- 错误信息包含 `stream did not contain valid UTF-8`

**原因**：新建或复制的 TS/TSX 文件中混入了非 UTF-8 字节（如 GBK 编码的中文文件）

**修复**：
1. 确认文件编码为 UTF-8：`file src/app/xxx/page.tsx`
2. 将异常文件重写为 UTF-8 编码
3. 重新执行 `npm run build`

### 2. 构建卡死 / 长时间无输出

**现象**：`npm run build` 停在某个阶段不动，终端没有报错但也不结束

**常见原因**：
- 有正在运行的 `node server.js` 或 `next start` 进程占用端口
- `.next/standalone/` 正被运行中的服务读取，新构建无法落盘
- 内存不足导致构建缓慢

**处理步骤**：
1. 检查是否有旧服务占用端口：`lsof -i :3000` 或 `netstat -tlnp | grep 3000`
2. 停止正在运行的 Node 服务后重试
3. 删除 `.next` 目录后重新构建
4. 内存不足时可增大 Node 内存限制：`NODE_OPTIONS=--max_old_space_size=4096 npm run build`
5. 逐步排查：先执行 `npx tsc --noEmit` 验证类型，再构建

**经验规则**：
- 构建完全无输出超过 5 分钟时，先停服务再重试，不要无限等待
- 构建和服务尽量错峰执行，避免同一目录同时读写

### 3. webpack_modules 残留冲突

**现象**：运行时 `webpack_modules` 相关报错，可能伴随 `moduleId is not a function`

**原因**：`.next` 构建产物与当前代码版本不匹配

**修复**：
1. 删除 `.next` 目录
2. 删除 `node_modules/.cache`（如果存在）
3. 重新 `npm run dev` 或 `npm run build`

---

## 运行时问题

### 4. SSR 水合冲突（页面白屏）

**现象**：页面报 500 错误，控制台出现 hydration 相关错误信息

**常见场景**：模态框组件、客户端交互组件在 SSR 和客户端渲染阶段不一致

**修复方式一（添加 mounted 状态）**：
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

**修复方式二（跳过 SSR）**：
```tsx
import dynamic from 'next/dynamic';
const Component = dynamic(() => import('./Component'), { ssr: false });
```

### 5. Tailwind 样式失效（页面纯文字）

**现象**：页面无样式，纯文字显示

**原因**：
- `tailwind.config.ts` 中 `content` 配置未覆盖所有源码目录
- 或编译中间产物导致 CSS 丢失

**修复**：
1. 确认 `tailwind.config.ts` 的 `content` 至少包含：
   ```ts
   content: [
     "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
   ]
   ```
2. 确认 `postcss.config.mjs` 包含 `tailwindcss` 和 `autoprefixer`
3. 清缓存并重新构建

### 6. 静态资源 404（/_next/static/... 丢失）

**现象**：`/_next/static/...` 返回 404，页面样式或 JS 加载失败

**原因**：
- 多个 Node/Next 进程同时运行，端口或资源冲突
- 前次构建产物与当前运行环境不一致

**修复**：
1. 终止所有 Node 进程：`killall -9 node`（Linux）/ 任务管理器结束 node.exe（Windows）
2. 删除 `.next` 和 `node_modules/.cache`
3. 重新启动开发服务器
4. 浏览器强制刷新（Ctrl+Shift+R）

### 7. 图片上传失败

**现象**：后台上传图片时报错或无响应

**排查步骤**：
1. 检查上传目录权限：
   ```bash
   ls -la /var/www/alumni-site/uploads/
   # 确保 www-data 用户有写入权限
   ```
2. 检查磁盘空间：`df -h`
3. 检查 Nginx 上传大小限制（`client_max_body_size`）
4. 检查 `next.config.mjs` 中的 `serverActions.bodySizeLimit` 是否足够

### 8. 数据库锁定（SQLite 并发冲突）

**现象**：写入操作报错 `SQLITE_BUSY` 或操作卡住

**原因**：SQLite 不支持高并发写入，同时有多个写操作时可能冲突

**修复**：
1. 等待当前操作完成后重试
2. 如持续出现，重启服务：`sudo systemctl restart alumni-site`
3. 考虑在应用层加入写入队列或减少并发写入

---

## 认证问题

### 9. 登录后反复跳回登录页

**可能原因**：
- Cookie 已过期或被清除
- `SESSION_SECRET` 环境变量与签发 token 时不一致
- 浏览器阻止了第三方 cookie

**排查**：
1. 检查浏览器开发者工具 → Application → Cookies → 确认 `yc_access_token` 存在
2. 检查 `.env` 中 `SESSION_SECRET` 是否与上次启动时一致
3. 清除浏览器所有 cookie 后重新登录

### 10. API 返回 401 Unauthorized

**排查**：
1. 确认已通过口令验证页面输入正确口令
2. 检查 cookie 是否过期（重新登录看是否恢复）
3. 如果是管理员 API（`/api/admin/*`），确认当前登录的是管理员账号而非普通口令
4. 查看服务端日志确认具体拒绝原因

---

## 部署问题

### 11. 部署后首页正常但后台 500

**可能原因**：

- Prisma schema 未在服务器同步（`npx prisma db push` 未执行）
- 数据库文件路径不正确

**修复**：

1. SSH 登录服务器
2. 进入应用目录：`cd /var/www/alumni-site/app`
3. 执行：`npx prisma db push`
4. 确认 `.env` 中 `DATABASE_URL` 指向正确的数据库路径
5. 重启服务

### 12. 证书过期（HTTPS 不可用）

**检查与续期**：

```bash
sudo certbot renew --dry-run    # 测试续期流程
sudo certbot renew               # 正式续期
sudo systemctl reload nginx      # 重新加载证书
```

### 13. 华为云 HSS 拦截 SSH 登录

**现象**：SSH 登录提示 `Input 'XXXX'.Problem contact HSS:XXXX` 反复循环

**原因**：华为云主机安全服务（HSS）拦截非常规登录

**绕过方式**：

1. **CloudShell**（推荐）：华为云控制台 → ECS → 远程登录 → CloudShell，无需 SSH
2. **VNC 控制台**：直接在浏览器内操作终端
3. 输入 HSS 提示的 4 位数字 → 通过验证后再输密码

### 14. SCP 上传卡住

**原因**：HSS 拦截 SCP 通道

**替代方案**：

```bash
# 方式 1：通过 CloudShell 上传文件，再 scp 到 ECS
scp /home/user/file root@<服务器IP>:/tmp/

# 方式 2：rsync 增量同步
rsync -avz deploy/ user@server:/tmp/alumni-deploy/
```

### 15. 服务器内存不足，构建被杀（SIGBUS）

**现象**：`npm run build` 报 `Next.js build worker exited with code: null and signal: SIGBUS`

**原因**：服务器内存不足（< 2GB），Node.js 进程被系统 OOM Killer 杀死

**修复**：**不要在生产服务器上构建**，应该在 WSL/本地构建后上传 `deploy/` 目录

```bash
# 本地 WSL 构建
npm run build
tar -czf deploy.tar.gz deploy/

# 上传到服务器
scp deploy.tar.gz root@<服务器IP>:/tmp/
```

### 16. Prisma 7.x 报 `datasource.url is required`

**现象**：执行 `npx prisma db push` 时报错

**原因**：Prisma 7.x 不再读 schema 中的 `url`，必须通过 `prisma.config.ts` 或 `DATABASE_URL` 环境变量

**修复**：确认项目根目录有 `prisma.config.ts`：

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env["DATABASE_URL"] },
});
```

如果 `.env` 不在当前目录，运行命令时显式指定：

```bash
DATABASE_URL="file:/var/www/alumni-site/data/prod.db" npx prisma db push
```

### 17. 端口冲突（多个站点）

**现象**：服务启动失败 `EADDRINUSE: address already in use 0.0.0.0:3000`

**排查**：

```bash
ss -tlnp | grep 3000
```

**修复**：调整 `.env` 中的 `PORT=3010`，并同步 Nginx `proxy_pass http://127.0.0.1:3010`

### 18. Leaflet 地图标记不显示

**现象**：地图加载正常但找不到 marker 图标

**原因**：原代码引用 cdnjs 链接，国内可能不可达

**修复**：图标已本地化到 `public/leaflet/`，确认文件存在：

```bash
ls public/leaflet/
# 应包含：marker-icon.png, marker-icon-2x.png, marker-shadow.png
```

如缺失，从 `https://unpkg.com/leaflet@1.9.4/dist/images/` 下载补全。

---

## 快速修复流程（万能方案）

遇到不确定原因的问题时，按以下顺序尝试：

1. **终止所有 Node 进程**
2. **删除** `.next` 和 `node_modules/.cache`
3. **重新安装依赖**：`npm ci`
4. **重新构建或启动**：`npm run dev` 或 `npm run build`
5. **浏览器强制刷新**（Ctrl+Shift+R / Cmd+Shift+R）
6. **如果仍不行**，查看浏览器控制台（F12）和服务端日志：
   ```bash
   sudo journalctl -u alumni-site -n 100
   ```

这能解决大多数由缓存、构建残留或进程冲突引起的问题。
