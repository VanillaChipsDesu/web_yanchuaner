# 故障排除（实测问题记录）

本文档记录项目开发与运维中遇到的关键问题及修复方案。

## 1. UTF-8 编码导致构建失败

### 现象
- `npm run build` 失败。
- 错误信息包含 `stream did not contain valid UTF-8`。

### 原因
- 新建/拷贝的 TS/TSX 文件中混入了非 UTF-8 字节。

### 修复步骤
1. 将异常文件重写为纯 UTF-8。
2. 代码中使用 Unicode 转义（如 `你好`）时保持编码一致。
3. 重新执行 `npm run build` 验证。

---

## 2. SSR 水合冲突（JoinRequestModal 白屏）

### 现象
- 首页报 500 错误。
- 控制台水合错误信息。

### 原因
- 模态框组件 SSR 和客户端水合阶段执行时机不一致。

### 修复步骤
1. 在组件中添加 mounted 状态：
   - `const [mounted, setMounted] = useState(false)`
   - `useEffect(() => setMounted(true), [])`
   - `if (!mounted) return null`
2. 使用 dynamic 跳过 SSR：
   - `dynamic(() => import('...'), { ssr: false })`
3. 重新构建验证。

---

## 3. Tailwind 扫描失效（样式纯文字）

### 现象
- 页面无样式，纯文字显示。

### 原因
- `tailwind.config.ts` 中 `content` 未覆盖 `src/app`、`src/components` 等目录。
- 或编译中间产物导致 CSS 失效。

### 修复步骤
1. 确认 `content` 至少包含：
   - `./src/pages/**/*.{js,ts,jsx,tsx,mdx}`
   - `./src/components/**/*.{js,ts,jsx,tsx,mdx}`
   - `./src/app/**/*.{js,ts,jsx,tsx,mdx}`
2. 检查 `postcss.config.mjs` 是否包含 `tailwindcss` 和 `autoprefixer`。
3. 清缓存并重新构建。

---

## 4. Webpack 模块缓存冲突（webpack_modules 残留）

### 现象
- 运行时 `webpack_modules` 相关报错。
- 可能伴随 `moduleId is not a function` 异常。

### 原因
- `.next` 构建产物与当前代码版本不匹配，模块引用映射失效。

### 修复步骤
1. 手动删除 `.next`。
2. 重新 dev 或 build。
3. 若仍然异常，同时删除 `node_modules/.cache`。

---

## 5. WSL 端口与缓存清理（404 资源丢失）

### 现象
- `/_next/static/...` 返回 404。
- 页面偶发样式加载失败。

### 原因
- 多个 Node/Next 进程占用端口。
- 前次构建产物与当前运行环境冲突。

### 修复步骤
1. 终止所有进程：`killall -9 node`。
2. 删除 `.next` 和 `node_modules/.cache`。
3. 固定端口重启（必要时更换端口验证）。
4. 强刷新浏览器（Ctrl+Shift+R）。

---

## 6. build 看起来卡死

### 现象
- `npm run build` 长时间没有新输出。
- 构建停在 emit 阶段，终端没有报错但也不结束。

### 常见原因
- 有正在运行的 `node server.js` 或 `next start` 进程占住了 3000 端口。
- `.next/standalone/` 正在被运行中的服务读取，导致新构建无法顺利落盘。
- 原生依赖构建较慢或内存不足，表现为长时间无输出。

### 处理步骤
1. 先检查是否有旧服务占用端口 3000。
2. 停止正在运行的 Node/Next 服务后，再重新执行构建。
3. 如果仍然缓慢，删除 `.next` 后重试。
4. 若怀疑内存问题，增大 `NODE_OPTIONS=--max_old_space_size=4096` 再试一次。
5. 仍然失败时，单独执行 `npx tsc --noEmit` 和依赖重建，逐步排查问题。

### 经验规则
- 构建完全没有输出并持续超过较长时间时，先停服务再重试，不要无限等待。
- 生产服务和构建尽量错峰执行，避免同一目录同时读写。

---

## 推荐快速修复流程

1. 终止所有 Node 进程
2. 删除 `.next` 和 `node_modules/.cache`
3. `npm run dev` 或 `npm run build`
4. 浏览器强刷（Ctrl+Shift+R）
