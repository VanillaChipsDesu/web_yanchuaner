# 路由清单

## 权限标记

| 标记 | 说明 |
|------|------|
| 公开 | 无需任何凭据即可访问 |
| 普通口令 | 需要 `ACCESS_PASSWORD` / `ACCESS_PASSWORD_HASH` 验证（httpOnly cookie: `yc_access_token`） |
| 管理员 | 需要 `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` 验证（httpOnly cookie, role=admin） |

---

## 前台页面

| 路由 | 权限 | 说明 |
|------|------|------|
| `/` | 普通口令 | 首页（最新动态、校友寄语） |
| `/about` | 公开 | 学校介绍（航天特色、办学理念、校园规模） |
| `/news` | 公开 | 新闻列表 |
| `/news/[id]` | 公开 | 新闻详情 |
| `/events` | 公开 | 活动列表 |
| `/events/[id]` | 公开 | 活动详情与在线报名 |
| `/contact` | 公开 | 联系我们（邮箱引导、投稿说明、免责声明） |
| `/teachers` | 公开 | 教师频道（教师名录、名师风采、教研成果、校友联络） |
| `/students` | 公开 | 在校生资源站首页 |
| `/students/application-guide` | 公开 | 志愿填报参考 |
| `/students/university-insights` | 公开 | 大学与专业观察 |
| `/students/senior-qa` | 公开 | 学长问答 |
| `/students/learning-methods` | 公开 | 学习方法 |
| `/students/alumni-messages` | 公开 | 校友寄语 |
| `/alumni/certificate` | 普通口令 | 电子校友纪念卡（姓名+班级验证，生成专属卡片） |
| `/alumni/university-map` | 普通口令 | 校友大学城市分布地图（Leaflet + 城市聚合 + 校友明细） |
| `/alumni/radar` | 普通口令 | 重定向至 `/alumni/university-map` |
| `/alumni/memories` | 普通口令 | 校园记忆（风景、合影等文化记忆展览） |
| `/alumni/stories` | 普通口令 | 燕中故事（浏览 + 邮箱投稿） |
| `/alumni/correction` | 普通口令 | 校友信息修改申请（搜索姓名 → 提交修改） |

> 标记为普通口令的页面，其数据 API 通过 `requireAccessOrAdmin()` 保护。未验证时 API 返回 401。

---

## 后台页面

| 路由 | 权限 | 说明 |
|------|------|------|
| `/admin` | 管理员 | 后台控制面板（统计概览） |
| `/admin/login` | 公开 | 管理员登录页 |
| `/admin/news` | 管理员 | 新闻管理列表 |
| `/admin/news/new` | 管理员 | 新建新闻 |
| `/admin/news/[id]` | 管理员 | 编辑新闻 |
| `/admin/events` | 管理员 | 活动管理列表 |
| `/admin/events/new` | 管理员 | 新建活动 |
| `/admin/events/[id]` | 管理员 | 编辑活动 |
| `/admin/events/[id]/registrations` | 管理员 | 活动报名名单（查看 + CSV 导出） |
| `/admin/alumni` | 管理员 | 校友名单管理（CRUD + CSV 导入/导出） |
| `/admin/alumni-corrections` | 管理员 | 校友信息修改申请审核（筛选、通过/驳回） |
| `/admin/posts` | 管理员 | 投稿管理 |
| `/admin/users` | 管理员 | 用户管理 |

---

## API 路由

### 认证 API

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/auth/verify` | 普通口令 | GET | 验证当前 cookie 是否有效 |
| `/api/auth/logout` | — | POST | 清除登录 cookie |

### 公开 API

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/health` | 公开 | GET | 健康检查 |
| `/api/join` | 公开 | POST | 加入申请（含限流） |
| `/api/news` | 公开 | GET | 公开新闻列表 |
| `/api/news/[id]` | 公开 | GET | 新闻详情 |
| `/api/events` | 公开 | GET | 公开活动列表 |
| `/api/events/[id]` | 公开 | GET | 活动详情 |
| `/api/posts` | 公开 | GET | 公开投稿列表 |

### 校友 API（需普通口令或管理员）

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/alumni/search` | 普通口令 | GET | 校友搜索（按姓名/届别/标签） |
| `/api/alumni/verify` | 普通口令 | GET | 校友身份验证（姓名+班级） |
| `/api/alumni/map` | 普通口令 | GET | 校友地图数据（姓名+城市聚合） |
| `/api/alumni/city-stats` | 普通口令 | GET | 校友城市聚合统计（含成员明细：姓名、大学、专业、班级） |
| `/api/alumni/correction-requests` | 普通口令 | POST | 提交校友信息修改申请（含限流） |
| `/api/alumni/certificate/upload-bg` | 管理员 | POST | 上传校友证背景图 |

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
| `/api/admin/alumni/import` | 管理员 | POST | CSV 批量导入校友（按 name+graduationClass 去重） |
| `/api/admin/alumni-corrections` | 管理员 | GET | 修改申请列表（支持按状态筛选） |
| `/api/admin/alumni-corrections/[id]` | 管理员 | PUT | 审核修改申请（通过并应用 / 驳回） |
| `/api/admin/posts` | 管理员 | GET / POST | 投稿管理 |
| `/api/admin/posts/[id]` | 管理员 | PUT / DELETE | 单个投稿操作 |
| `/api/admin/users` | 管理员 | GET | 用户列表 |

---

## 认证机制说明

### 普通口令（Access Token）

- Cookie 名：`yc_access_token`
- Payload 包含 `{ role: "access" }` 或 `{ role: "admin" }`
- 验证函数：`verifyToken()` — HMAC-SHA256 签名
- 保护中间件：`requireAccessOrAdmin()` — 普通口令或管理员均可通过

### 管理员（Admin Token）

- Cookie 名：`yc_access_token`
- Payload 包含 `{ role: "admin" }`
- 保护中间件：`requireAdmin()` — 仅管理员可访问

### 未登录或凭据过期

- **页面**：不拦截页面访问，但依赖数据的页面会因 API 返回 401 而无法正常显示
- **API**：返回 `{ error: "Unauthorized" }`，HTTP 状态码 401

---

## 校园记忆页面说明

`/alumni/memories` 页面访问需要普通口令验证，但其使用的图片资源来自 `public/` 目录下的静态文件，不经过 API 鉴权。如果上传了敏感照片，应控制好图片本身的访问权限。
