# 路由清单

## 权限标记

| 标记 | 说明 |
|------|------|
| 公开 | 无需任何凭据即可访问 |
| 登录用户 | 需要个人账号登录（httpOnly cookie: `yc_access_token`, role=user） |
| 认证校友 | 需要账号已通过校友认证（role=ALUMNI, status=VERIFIED），或管理员 |
| 管理员 | 需要数据库管理员账号登录（role=ADMIN） |

---

## 前台页面

| 路由 | 权限 | 说明 |
|------|------|------|
| `/` | 公开 | 首页（最新动态、校友寄语） |
| `/login` | 公开 | 普通用户与管理员共用登录页 |
| `/register` | 公开 | 用户注册（用户名、密码、邮箱、姓名、届别、班级） |
| `/verify-email` | 公开 | 邮箱验证（一次性 Token） |
| `/reset-password` | 公开 | 密码重置（一次性 Token） |
| `/about` | 公开 | 学校介绍（航天特色、办学理念、时间线，数据库驱动） |
| `/news` | 公开 | 新闻列表 |
| `/news/[id]` | 公开 | 新闻详情 |
| `/events` | 公开 | 活动列表（含封面图） |
| `/events/[id]` | 公开 | 活动详情与在线报名 |
| `/contact` | 公开 | 联系我们（数据库驱动，管理员可编辑） |
| `/teachers` | 公开 | 教师频道（数据库驱动，管理员可编辑版块） |
| `/students` | 公开 | 在校生资源站首页（数据库驱动，管理员可编辑卡片） |
| `/students/application-guide` | 公开 | 志愿填报参考 |
| `/students/university-insights` | 公开 | 大学与专业观察 |
| `/students/senior-qa` | 公开 | 学长问答 |
| `/students/learning-methods` | 公开 | 学习方法 |
| `/students/alumni-messages` | 公开 | 校友寄语 |
| `/me` | 登录用户 | 个人中心首页（姓名、邮箱、角色、认证状态） |
| `/me/edit` | 登录用户 | 编辑资料（修改用户名、联系方式） |
| `/me/posts` | 登录用户 | 我的投稿列表 |
| `/me/change-password` | 登录用户 | 修改密码（成功后旧会话失效） |
| `/alumni/certificate` | 认证校友 | 电子校友纪念卡（姓名+班级验证，生成专属卡片） |
| `/alumni/university-map` | 认证校友 | 校友大学城市分布地图（Leaflet + 城市聚合 + 校友明细） |
| `/alumni/radar` | 认证校友 | 重定向至 `/alumni/university-map` |
| `/alumni/memories` | 认证校友 | 燕中记忆文化长廊（数据库驱动，16:9 图片展示） |
| `/alumni/stories` | 认证校友 | 燕中故事（数据库驱动 + 邮箱投稿） |
| `/alumni/achievements` | 认证校友 | 校友成就墙（类别筛选，仅展示已发布记录） |
| `/alumni/correction` | 认证校友 | 校友信息修改申请（搜索姓名 → 提交修改） |

> 未登录访问受保护页面时，middleware 自动跳转至 `/login?redirect=<原路径>`。
> 校友数据 API 通过 `requireVerifiedAlumni()` 保护。未登录时返回 401，未通过校友认证时返回 403。

---

## 后台页面

| 路由 | 权限 | 说明 |
|------|------|------|
| `/admin` | 管理员 | 后台控制面板（统计概览） |
| `/admin/news` | 管理员 | 新闻管理列表 |
| `/admin/news/new` | 管理员 | 新建新闻 |
| `/admin/news/[id]` | 管理员 | 编辑新闻 |
| `/admin/events` | 管理员 | 活动管理列表 |
| `/admin/events/new` | 管理员 | 新建活动 |
| `/admin/events/[id]` | 管理员 | 编辑活动 |
| `/admin/events/[id]/registrations` | 管理员 | 活动报名名单（查看 + CSV 导出） |
| `/admin/alumni` | 管理员 | 校友名单管理（CRUD + CSV 导入/导出） |
| `/admin/alumni-corrections` | 管理员 | 校友信息修改申请审核（筛选、通过/驳回） |
| `/admin/memories` | 管理员 | 燕中记忆管理（CRUD、排序、图片上传） |
| `/admin/stories` | 管理员 | 燕中故事管理（CRUD） |
| `/admin/achievements` | 管理员 | 校友成就墙管理（CRUD、发布状态、排序） |
| `/admin/teachers` | 管理员 | 教师频道管理（版块 CRUD、排序） |
| `/admin/content` | 管理员 | 页面内容管理（about/contact/students/teachers 统一管理） |
| `/admin/posts` | 管理员 | 投稿管理 |
| `/admin/users` | 管理员 | 用户管理（用户列表、认证审核、账号操作） |
| `/admin/user-claims` | 管理员 | 旧资料认领审核 |

---

## API 路由

### 认证 API

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/auth/register` | 公开（限流） | POST | 注册账号（username, password, email, name, graduationClass, className, contact） |
| `/api/auth/login` | 公开（限流） | POST | 用户名/密码登录，返回 httpOnly cookie |
| `/api/auth/logout` | 登录用户 | POST | 清除登录 cookie |
| `/api/auth/me` | 登录用户 | GET | 获取当前登录用户信息 |
| `/api/auth/verify-email` | 公开 | POST | 一次性 Token 验证邮箱 |
| `/api/auth/resend-verification` | 公开（限流） | POST | 重发邮箱验证邮件 |
| `/api/auth/forgot-password` | 公开（限流） | POST | 申请密码重置邮件 |
| `/api/auth/reset-password` | 公开 | POST | 一次性 Token 重置密码 |
| `/api/auth/graduation-classes` | 公开 | GET | 获取去重后的届别列表 |

### 公开 API

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/health` | 公开 | GET | 健康检查 |
| `/api/join` | 公开（限流） | POST | 加入申请 |
| `/api/news` | 公开 | GET | 公开新闻列表 |
| `/api/news/[id]` | 公开 | GET | 新闻详情 |
| `/api/events` | 公开 | GET | 公开活动列表 |
| `/api/events/[id]` | 公开 | GET | 活动详情 |
| `/api/memories` | 公开 | GET | 燕中记忆展品列表（含图片存在性检查） |
| `/api/stories` | 公开 | GET | 燕中故事列表 |

### 校友 API（需认证校友或管理员）

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/alumni/search` | 认证校友 | GET | 校友搜索（按姓名/届别/标签） |
| `/api/alumni/verify` | 认证校友 | GET | 校友身份验证（姓名+班级） |
| `/api/alumni/map` | 认证校友 | GET | 校友地图数据（姓名+城市聚合） |
| `/api/alumni/city-stats` | 认证校友 | GET | 校友城市聚合统计（含成员明细：姓名、大学、专业、班级） |
| `/api/alumni/correction-requests` | 认证校友 | POST | 提交校友信息修改申请（含限流） |
| `/api/alumni/certificate/upload-bg` | 管理员 | POST | 上传校友证背景图 |

### 个人中心 API（登录用户）

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/me/profile` | 登录用户 | GET / PATCH | 获取/修改个人资料（仅可修改用户名和联系方式） |
| `/api/me/posts` | 登录用户 | GET | 我的投稿列表 |
| `/api/me/change-password` | 登录用户 | POST | 修改密码（旧密码验证，sessionVersion 递增使旧会话失效） |

### 图片上传 API（管理员）

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/upload` | 管理员 | POST | 通用图片上传（新闻/活动封面） |
| `/api/settings/card-bg/upload` | 管理员 | POST | 校友纪念卡默认背景上传（16:9，Sharp 裁切） |

### 后台管理 API（管理员）

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/admin/stats` | 管理员 | GET | 后台统计概览 |
| `/api/admin/news` | 管理员 | GET / POST | 新闻列表 / 新建新闻 |
| `/api/admin/news/[id]` | 管理员 | GET / PUT / DELETE | 单条新闻操作 |
| `/api/admin/events` | 管理员 | GET / POST | 活动列表 / 新建活动 |
| `/api/admin/events/[id]` | 管理员 | GET / PUT / DELETE | 单个活动操作 |
| `/api/admin/events/[id]/registrations` | 管理员 | GET | 活动报名名单（支持 CSV 导出） |
| `/api/admin/alumni` | 管理员 | GET / POST | 校友名单列表 / 新增校友 |
| `/api/admin/alumni/[id]` | 管理员 | PUT / DELETE | 单个校友编辑 / 删除 |
| `/api/admin/alumni/import` | 管理员 | POST | CSV 批量导入校友（按 name+graduationClass+className+email 去重） |
| `/api/admin/alumni-corrections` | 管理员 | GET | 修改申请列表（支持按状态筛选） |
| `/api/admin/alumni-corrections/[id]` | 管理员 | PATCH | 审核修改申请（通过并应用 / 驳回） |
| `/api/admin/posts` | 管理员 | GET / POST | 投稿管理 |
| `/api/admin/posts/[id]` | 管理员 | PUT / DELETE | 单个投稿操作 |
| `/api/admin/memories` | 管理员 | GET / POST | 燕中记忆列表 / 新建展品 |
| `/api/admin/memories/[id]` | 管理员 | PUT / DELETE | 编辑展品（支持部分更新）/ 删除展品 |
| `/api/admin/stories` | 管理员 | GET / POST | 燕中故事列表 / 新建故事 |
| `/api/admin/stories/[id]` | 管理员 | PUT / DELETE | 编辑故事 / 删除故事 |
| `/api/admin/achievements` | 管理员 | GET / POST | 校友成就列表 / 新建成就 |
| `/api/admin/achievements/[id]` | 管理员 | PUT / DELETE | 编辑成就 / 删除成就 |
| `/api/admin/content` | 管理员 | GET / POST | 页面内容列表（?page=xxx）/ 新建内容 |
| `/api/admin/content/[id]` | 管理员 | PUT / DELETE | 编辑内容 / 删除内容 |
| `/api/admin/teachers` | 管理员 | GET / POST | 教师频道列表 / 新建版块 |
| `/api/admin/teachers/[id]` | 管理员 | PUT / DELETE | 编辑版块 / 删除版块 |
| `/api/admin/users` | 管理员 | GET | 用户列表 |
| `/api/admin/users/[id]/actions` | 管理员 | POST | 用户管理操作（见下方说明） |
| `/api/admin/user-claims` | 管理员 | GET | 旧资料认领申请列表 |
| `/api/admin/user-claims/[id]` | 管理员 | GET / PATCH | 认领申请详情 / 审核 |

### 管理员用户操作 API

`POST /api/admin/users/[id]/actions` 支持以下操作：

| 操作 | action 值 | 说明 |
|------|-----------|------|
| 通过校友认证 | `approve-alumni` | 将用户升为 ALUMNI/VERIFIED，同步联系方式到校友名单 |
| 撤销校友认证 | `reject-alumni` | 将校友降为 GUEST/PENDING |
| 停用账号 | `disable-account` | accountStatus=DISABLED，所有会话失效 |
| 恢复账号 | `enable-account` | accountStatus=ACTIVE |
| 强制退出所有设备 | `logout-all-sessions` | sessionVersion+1，所有旧 token 失效 |
| 提升为管理员 | `grant-admin` | 授予 ADMIN 角色 |
| 撤销管理员 | `revoke-admin` | 撤销 ADMIN 角色（不能撤销自己） |
| 重发验证邮件 | `resend-verification` | 管理员代为触发验证邮件 |
| 发送密码重置邮件 | `send-reset-password` | 管理员代为触发重置邮件 |

所有操作均记录到 AuditLog 表，与业务变更在同一事务中写入。

---

## 认证机制说明

### 用户会话

- Cookie 名：`yc_access_token`
- Token 格式：`HMAC-SHA256(base64url(JSON payload))`，v3
- Payload 包含：用户 ID（userId）、会话版本（sessionVersion）、角色（role: "user" | "admin"）、过期时间（exp）
- sessionVersion 在修改密码、停用账号、强制退出所有设备时递增，旧 token 立即失效

### 权限等级

| 等级 | 登录 | 公开数据 | 校友数据 | 管理后台 |
|------|------|----------|----------|----------|
| 未登录 | ❌ | ✅ | ❌ | ❌ |
| 已注册（邮箱已验证） | ✅ | ✅ | ❌ | ❌ |
| 已认证校友 | ✅ | ✅ | ✅ | ❌ |
| 管理员 | ✅ | ✅ | ✅ | ✅ |

### 认证函数

- `requireAdmin()` — 仅管理员通过，用于 `/api/admin/*`
- `requireVerifiedAlumni()` — 已认证校友或管理员通过，用于 `/api/alumni/*`
- `requireUser()` — 任何登录用户通过
- `getAuthenticatedUser()` — 获取当前用户信息，未登录返回 null
- `requirePageUser()` / `requirePageAdmin()` — 服务端组件鉴权，未登录自动 redirect

### 邮箱验证和校友认证

邮箱验证和校友认证是两个独立状态：
- **邮箱验证**（emailVerified）：用户能否登录。通过点击验证邮件中的链接完成。
- **校友认证**（status: VERIFIED）：用户能否访问校友专属内容。注册时姓名+届别+班级+邮箱匹配名册则自动认证，否则由管理员后台审核。

### 未登录或凭据过期

- **页面**：middleware 自动跳转至 `/login?redirect=<原路径>`
- **API**：返回 `{ error: "Unauthorized" }`，HTTP 401

---

## 个人中心

| 路由 | 功能 | 可修改字段 | 只读字段 |
|------|------|------------|----------|
| `/me` | 个人中心首页 | — | 姓名、邮箱、用户名、届别、班级、认证状态 |
| `/me/edit` | 编辑资料 | 用户名、联系方式 | 姓名、邮箱、届别、班级 |
| `/me/posts` | 投稿列表 | — | 标题、类型、状态 |
| `/me/change-password` | 修改密码 | 密码 | — |

修改密码后 sessionVersion 递增，所有设备需重新登录。
变更管理员角色、账号状态或密码时，旧会话也会失效。

---

## 页面内容管理说明

### 统一内容管理（`/admin/content`）

通过 `/admin/content` 页面可以管理以下前端页面的内容：

| 页面标识 | 对应页面 | 内容类型 |
|----------|----------|----------|
| `about_features` | `/about` 学校介绍 | 特色卡片（icon + 标题 + 描述） |
| `about_timeline` | `/about` 学校介绍 | 发展历程时间线（年份 + 事件描述） |
| `contact` | `/contact` 联系我们 | 联系信息区块（icon + 标题 + 描述 + 链接） |
| `students` | `/students` 在校生资源站 | 资源卡片（icon + 标题 + 描述 + 跳转链接） |
| `teachers` | `/teachers` 教师频道 | 版块卡片（icon + 标题 + 描述 + 备注 + 链接） |

所有内容数据来自 `ContentSection` 表，以 `page` 字段区分归属，`sortOrder` 控制排序。

### 燕中故事管理（`/admin/stories`）

`/alumni/stories` 页面改为数据库驱动。管理员通过 `/admin/stories` 增删改查故事（标题、作者、标签、正文、日期）。前端页面从 `/api/stories` 拉取数据，支持标签筛选。

### 校友成就墙管理（`/admin/achievements`）

校友成就数据来自 `Achievement` 表。管理员可维护校友姓名、届别、成就标题、类别、简介、机构、年份、排序和发布状态；前台 `/alumni/achievements` 仅展示状态为 `PUBLISHED` 的记录，并支持按类别筛选。

### 燕中记忆管理

`/alumni/memories` 页面需登录并通过校友认证。展品数据来自 `MemoryItem` 数据库表，由管理员通过 `/admin/memories` 后台可视化维护（CRUD、排序、图片上传）。上传图片自动裁切为 16:9（2752×1548）。前台页面标记为 `force-dynamic`，管理员更新后刷新即生效。

### 用户管理（`/admin/users`）

管理员可查看用户列表、审核校友认证、停用/恢复账号、强制退出设备、提升/撤销管理员。敏感操作记录到 AuditLog。
