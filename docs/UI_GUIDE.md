# UI 开发指南（贡献者必读）

> 本指南面向参与共建的校友开发者。读完后，你将能**安全地**修改页面外观，而不会误触数据流与鉴权等核心逻辑。
>
> 一句话原则：**改样式 → 动组件和令牌；改数据 → 动 Hook 和 API。两者互不交叉。**

---

## 目录

1. [设计令牌字典（颜色 / 圆角 / 阴影）](#1-设计令牌字典)
2. [核心 UI 组件速查表](#2-核心-ui-组件速查表)
3. [后台 CRUD 架构（useResource + CrudManager）](#3-后台-crud-架构)
4. [新手避坑指南：如何安全改样式](#4-新手避坑指南如何安全改样式)
5. [常见任务速查（我想改 X，该动哪个文件）](#5-常见任务速查)

---

## 1. 设计令牌字典

全站颜色是**单一来源**的：定义在 `src/app/globals.css` 的 `:root`，通过 `tailwind.config.ts` 暴露为语义化的 Tailwind 类名。

**请永远使用语义令牌，不要在代码里裸写十六进制色值（如 `#7C3AED`）。** 这样改主题色时只需动一个文件。

### 颜色令牌映射表

| 语义令牌（Tailwind 类） | 实际颜色 | 含义与用途 |
|------------------------|----------|-----------|
| `brand` | `#7C3AED` 紫 | 主色：链接、图标、强调 |
| `brand-soft` | `#A78BFA` 淡紫 | 辅助色、柔和边框 |
| `brand-fg` | `#4C1D95` 深紫 | 主文本色（标题/正文） |
| `accent` | `#22C55E` 绿 | CTA 行动号召（如「加入我们」） |
| `surface` | `#FFFFFF` 白 | 卡片表面 |
| `surface-muted` | `#FAF5FF` 浅紫 | 页面背景 |
| `line` | `rgba(124,58,237,.1)` | 统一描边色 |

### 用法示例

```tsx
text-brand          // 主色文字
text-brand-fg       // 深紫标题
bg-brand/10         // 主色 10% 透明背景（支持任意透明度：/5 /10 /20 /30 ...）
border-brand/20     // 主色 20% 透明边框
bg-surface          // 白色卡片
bg-surface-muted    // 浅紫页面底色
border-line         // 统一描边
text-accent         // CTA 绿
```

> ⚠️ **透明度修饰符**（`/10`、`/30`）只在语义令牌上有效（如 `bg-brand/10`）。
> 这是因为令牌底层用 `rgb(var(--brand-rgb) / <alpha-value>)` 格式实现。
> 旧的裸写 `bg-[#7C3AED]/10` 虽然也能用，但**不要再新增**——逐步迁移到令牌。

### 圆角令牌

| 类名 | 值 | 用途 |
|------|-----|------|
| `rounded-btn` | 12px | 按钮 |
| `rounded-card` | 16px | 卡片（等价 `rounded-2xl`） |
| `rounded-modal` | 20px | 浮层弹窗 |

### 阴影令牌（仅 3 级，勿自造彩色阴影）

| 类名 | 用途 |
|------|------|
| `shadow-sm` | 静态卡片 |
| `shadow-md` | 悬停态 |
| `shadow-lg` | 浮层 / 弹窗 |

---

## 2. 核心 UI 组件速查表

所有基础组件位于 `src/components/ui/`，统一从 `@/components/ui` 导入。
它们**只负责渲染**，不含任何数据拉取逻辑——你可以放心修改它们的样式。

```tsx
import { PageShell, GlassCard, PageHeader, SectionHeader,
         Button, ButtonLink, Badge, EmptyState, DisclaimerBanner } from "@/components/ui";
```

| 组件 | 作用 | 关键 props |
|------|------|-----------|
| `PageShell` | 页面外层容器（最大宽度+留白） | `size`: `narrow`(max-w-3xl) / `default`(max-w-6xl) / `wide`(max-w-7xl) |
| `GlassCard` | 毛玻璃卡片容器 | `as`: `div`/`article`/`section`，`className` |
| `PageHeader` | 页头：胶囊标签 + H1 + 描述 | `eyebrow`、`eyebrowIcon`、`title`、`description`、`action` |
| `SectionHeader` | 区块标题：图标 + H2 | `icon`、`title`、`action` |
| `Button` | 按钮（`<button>`） | `variant`: `primary`/`secondary`/`ghost`/`danger`，`size`、`icon` |
| `ButtonLink` | 链接样式按钮（Next `Link`） | 同上 + `href` |
| `Badge` | 标签胶囊 | `tone`: `brand`/`neutral`/`success`/`warning`/`info`/`danger`，`icon` |
| `EmptyState` | 空状态占位 | `icon`、`title`、`description`、`action` |
| `DisclaimerBanner` | 琥珀色免责声明 | `title`（可选，带标题模式） |

### 典型内容页骨架

一个标准前台内容页长这样——清爽、声明式、零「面条类名」：

```tsx
import { Mail } from "lucide-react";
import { PageShell, GlassCard, PageHeader, ButtonLink, EmptyState } from "@/components/ui";

export default function MyPage() {
  return (
    <PageShell>
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="CONTACT"
          eyebrowIcon={Mail}
          title="联系我们"
          description="一句话描述这个页面。"
          action={<ButtonLink href="/" variant="secondary">返回首页</ButtonLink>}
        />
        {/* 你的内容 */}
        <EmptyState icon={Mail} title="暂无数据" />
      </GlassCard>
    </PageShell>
  );
}
```

> `cn(...)` 工具（`@/components/ui/cn`）用于按条件拼接类名，等价于轻量版 clsx：
> `cn("base", active && "bg-brand/10", className)`。

---

## 3. 后台 CRUD 架构

后台管理页遵循**统一架构**：数据层与 UI 层彻底分离。

```
useResource (数据层)  ←—— 只管 fetch/状态，对接 /api/admin/*
      +
CrudManager (UI 层)   ←—— 只管表单/列表渲染，零 fetch
```

### 3.1 `useResource` 数据 Hook

位置：`src/hooks/useResource.ts`。封装 `列表加载 + 增/改/删 + loading/saving/error`。

```ts
const res = useResource<Story>({
  endpoint: "/api/admin/stories",  // 集合端点
  listKey: "stories",              // 列表响应里数组的字段名
  listQuery: "page=teachers",      // 可选：列表查询串
  createDefaults: { page: "x" },   // 可选：创建时附加的固定字段
});

res.items     // 数据数组
res.loading   // 列表加载中
res.saving    // 增/改进行中
res.error     // 错误信息
res.setError  // 设置/清空错误
res.create(payload)      // POST endpoint
res.update(id, payload)  // PUT  endpoint/:id
res.remove(id)           // DELETE endpoint/:id
res.reload()             // 手动重新加载
```

### 3.2 `CrudManager` 通用管理组件

位置：`src/components/admin/CrudManager.tsx`。字段配置驱动，最适合「纯文本/下拉表单 + 列表」的页面。

完整示例见 `src/app/admin/stories/page.tsx` 或 `src/app/admin/achievements/page.tsx`：

```tsx
const FIELDS: FieldConfig[] = [
  { name: "title", label: "标题", required: true },
  { name: "category", label: "类别", type: "select", options: [...] },
  { name: "body", label: "正文", type: "textarea" },
];

export default function MyAdminPage() {
  const res = useResource<MyType>({ endpoint: "/api/admin/xxx", listKey: "items" });
  return (
    <CrudManager<MyType>
      title="..." fields={FIELDS}
      items={res.items} loading={res.loading} saving={res.saving}
      error={res.error} setError={res.setError}
      onCreate={res.create} onUpdate={res.update} onDelete={res.remove}
      toForm={(item) => ({ /* 记录 → 表单初值 */ })}
      toPayload={(form) => ({ /* 可选：表单 → API payload */ })}
      validate={(form) => form.title ? null : "标题不能为空"}
      renderItem={(item) => <>{/* 列表项左侧展示 */}</>}
    />
  );
}
```

### 3.3 特殊页面：只用数据层，不用 CrudManager

当页面有**特殊交互**（图片上传、图标选择器、上下拖动排序、Tab 切换），
`CrudManager` 表达不了，这时**只接入 `useResource` 数据层**，UI 自己写。

参考实现：
- `src/app/admin/memories/page.tsx` — 图片 16:9 上传 + 图标选择器 + 排序
- `src/app/admin/content/page.tsx` — Tab 切换（`listQuery` 随 Tab 变化）
- `src/app/admin/teachers/page.tsx` — 图标选择器 + 排序

这些页面用 `res.update(a.id, { sortOrder })` 实现排序、用 `/api/upload` 实现上传，
**数据流仍由 `useResource` 统一托管**，架构保持一致。

---

## 4. 新手避坑指南：如何安全改样式

### ✅ 可以放心做的事

- 修改 `src/components/ui/*` 里组件的 Tailwind 类名（改全站外观）
- 修改 `src/app/globals.css` 的 `:root` 颜色变量（改主题色）
- 在页面里替换组件、调整布局、增删展示元素
- 用语义令牌替换页面里残留的硬编码十六进制色

### 🚫 绝对不要碰的红线

| 禁区 | 路径 | 原因 |
|------|------|------|
| 后端 API | `src/app/api/**` | 数据契约与服务端逻辑 |
| 数据库模型 | `prisma/schema.prisma` | 改动会破坏数据结构 |
| 数据库连接 | `src/lib/db.ts` | 底层连接 |
| 鉴权校验 | `yc_access_token` 相关、`src/lib/verify-token.ts`、`src/lib/admin-auth.ts`、`middleware` | 安全机制，改错会导致越权 |
| 路由地址 | 任何 `href` / 文件夹名 | 改 URL 会导致死链、破坏 SEO 与外部引用 |

### ⚠️ 改 CRUD 页时的注意点

- 改**外观**：只动 `CrudManager` 的 `renderItem`、`FIELDS` 配置、或页面 JSX。
- **不要**在页面里手写 `fetch('/api/...')`——数据交给 `useResource`。
- **不要**改 `useResource` 里的 `endpoint`/`listKey` 去指向别的接口，除非你清楚 API 契约。
- 迁移老页面时，**务必保留原有特殊逻辑**（如图片上传链路、排序、Tab）。

### 改完后必须自检

```bash
npx tsc --noEmit     # 类型检查，必须零报错
npx next lint        # 代码规范，必须零警告
```

两项都通过，才能提交 PR。

---

## 5. 常见任务速查

| 我想…… | 该动的文件 |
|--------|-----------|
| 改全站主色 / 主题色 | `src/app/globals.css` 的 `:root`（同时改十六进制和 `*-rgb` 两处） |
| 改卡片/按钮的统一外观 | `src/components/ui/GlassCard.tsx` / `Button.tsx` |
| 改顶部导航的分组或菜单项 | `src/components/MobileNav.tsx` 的 `NAV_GROUPS` |
| 改后台侧边栏分组 | `src/app/admin/layout.tsx` 的 `NAV_SECTIONS` |
| 改某个内容页的文案/布局 | 对应 `src/app/**/page.tsx` |
| 新增一个后台 CRUD 页 | 仿照 `src/app/admin/stories/page.tsx`（useResource + CrudManager） |
| 改某页的数据来源 | 找到对应 `/api/**`——但这是后端，**需与维护者确认** |

---

有疑问？先看同类页面的现有实现，照着写最稳妥。欢迎共建，玩得开心 🚀
