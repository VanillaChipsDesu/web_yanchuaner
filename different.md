# Pull Request：认证系统重构、API 接入与使用体验优化

## 一、PR 概述

本次 PR 在保留原有页面风格、内容管理和校友业务功能的基础上，对项目的认证、权限、个人中心、后台管理和校友名单维护流程进行了系统性重构。

本次最重要的变化，是将原先依赖共享访问口令的 Gatekeeper 模式，升级为完整的个人账号体系，并新增邮件服务、认证接口、限流服务等 API 接入能力。用户现在可以完成注册、邮箱验证、登录、密码重置和个人资料管理；管理员则可以审核校友身份、管理账号、处理旧资料认领，并对敏感操作进行审计。

此外，本次改动还根据实际使用情况完成了 16 项界面和交互细节优化，包括统一登录入口、修复导航状态、完善资料编辑提示、补充管理员操作入口和校友名单去重等。

希望维护者重点审阅：

- 新认证流程是否符合项目后续发展方向；
- Resend 邮件 API 和 Redis 限流的接入方式是否合适；
- 页面守卫与 API 的权限边界是否正确；
- 数据库字段及旧用户迁移方案是否满足兼容要求；
- 管理员敏感操作和旧资料认领事务是否足够安全。

### 改动动机

原项目使用全站共享口令控制访问，无法区分具体用户，也不便于管理账号状态、投稿归属、密码找回和细粒度权限。本次 PR 因此引入个人账号、邮箱验证和服务端分级鉴权，同时尽量保持原有业务页面及视觉设计不变。

---

## 二、核心功能变更

### 1. 从共享口令升级为个人账号

原项目使用全站共享口令控制访问，无法区分具体用户，也不便于执行账号停用、权限变更和投稿归属管理。

本次 PR 增加了以下账号功能：

- 用户名和密码注册；
- 邮箱验证；
- 用户登录与退出；
- 忘记密码和密码重置；
- 个人中心；
- 个人资料编辑；
- 修改密码；
- 查看“我的投稿”；
- 旧资料和历史投稿认领；
- 管理员账号初始化与权限管理。

共享口令 Gatekeeper 已从主要访问流程中移除，旧的 Join 写入接口也已停止继续创建旧式用户记录。

### 2. 新增分级权限体系

系统现在区分以下状态：

| 类型 | 状态 | 说明 |
| --- | --- | --- |
| 账号状态 | `ACTIVE` / `DISABLED` | 决定账号是否允许登录 |
| 邮箱状态 | 未验证 / 已验证 | 决定用户是否完成邮箱所有权验证 |
| 校友认证 | `PENDING` / `VERIFIED` / `REJECTED` | 决定用户是否可以访问校友私有内容 |
| 用户角色 | `GUEST` / `ALUMNI` / `ADMIN` | 决定普通用户、校友和管理员权限 |

权限规则如下：

- 游客可以访问首页、关于页和认证相关页面；
- 已验证邮箱的普通用户可以访问个人中心；
- 已认证校友可以访问新闻、活动、地图、通讯录、证书、故事等校友内容；
- 管理员可以访问管理后台，同时拥有个人中心和校友内容访问权限。

权限保护不只依赖前端跳转，而是由 middleware、服务端页面守卫和 API 鉴权共同完成。

### 3. 登录会话支持强制失效

登录 Token 新增 `userId`、角色、过期时间和 `sessionVersion`。

出现以下情况时，系统会增加 `sessionVersion`，使此前签发的 Token 立即失效：

- 用户修改密码；
- 用户重置密码；
- 管理员停用账号；
- 管理员执行“退出所有设备”；
- 用户角色或校友认证状态发生变化；
- 管理员权限被授予或撤销。

这可以避免用户在密码或权限发生变化后继续使用旧会话。

---

## 三、API 接入说明

API 接入是本次改动的重点。本次 PR 不仅增加了站内认证 API，还接入了 Resend 邮件 API，并为生产环境引入 Redis 限流支持。

### 1. Resend 邮件 API

相关官方网址：

- Resend 官网：[https://resend.com](https://resend.com)
- Resend 控制台：[https://resend.com/login](https://resend.com/login)
- 域名配置文档：[https://resend.com/docs/dashboard/domains/introduction](https://resend.com/docs/dashboard/domains/introduction)
- API Key 配置文档：[https://resend.com/docs/dashboard/api-keys/introduction](https://resend.com/docs/dashboard/api-keys/introduction)

首次配置时，需要先通过 Resend 官网注册或登录账号，然后在控制台完成发信域名验证和 API Key 创建。

项目使用 Resend 发送：

- 注册邮箱验证邮件；
- 重发邮箱验证邮件；
- 密码重置邮件；
- 管理员触发的验证或重置邮件。

相关实现位于：

```text
src/lib/email.ts
```

需要配置以下环境变量：

```env
APP_URL="https://your-domain.example"
RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM_EMAIL="燕中数字母港 <noreply@your-domain.example>"
```

配置说明：

- `APP_URL`：站点外部访问地址，用于生成邮箱验证和密码重置链接；
- `RESEND_API_KEY`：在 Resend 控制台创建的 API Key；
- `RESEND_FROM_EMAIL`：发件人名称和邮箱，邮箱域名必须已经在 Resend 中完成验证。

邮件链接只使用可信的 `APP_URL` 生成，不读取请求头中的 Host，避免恶意请求伪造邮件跳转地址。

#### Resend 配置步骤

##### 第一步：准备发信域名

建议使用独立的发信子域名，例如：

```text
mail.your-domain.example
```

这样可以将网站主域名与邮件发送配置分开，减少 DNS 调整对现有网站和其他邮箱服务的影响。

在 Resend 中添加域名后，控制台会生成需要配置的 DNS 记录。常见记录用于：

- SPF：声明 Resend 可以代表该域名发信；
- DKIM：为邮件增加域名签名；
- Return-Path：处理退信和投递状态。

请在域名的 DNS 服务商中逐条添加 Resend 控制台实际给出的记录。记录名称、类型和值应以控制台显示内容为准，不要自行修改，也不要直接照搬其他域名的示例。

配置 DNS 时需要注意：

- 如果 DNS 服务商会自动补全根域名，只填写控制台要求的主机记录部分；
- 如果使用 Cloudflare，邮件验证相关的 CNAME 记录通常应关闭代理，仅进行 DNS 解析；
- 不要删除网站、企业邮箱或其他邮件服务已经使用的 MX、SPF、DKIM 记录；
- 同一域名通常只应保留一条 SPF TXT 记录。如已有 SPF，应按邮件服务商要求合并，而不是重复添加；
- DNS 生效可能需要一段时间，添加后回到 Resend 控制台重新检查验证状态。

只有域名验证完成后，才能稳定使用该域名作为正式发件地址。

##### 第二步：创建 API Key

在 Resend 控制台创建供本项目使用的 API Key。建议：

- 为开发、测试和生产环境分别创建独立的 Key；
- 使用能够完成邮件发送的最小权限；
- 使用容易识别的名称，例如 `yanchuaner-production`；
- API Key 创建后立即保存，后续不要写入代码、提交记录或日志；
- 怀疑 Key 泄露时立即在 Resend 控制台撤销并重新创建。

将生成的 Key 配置为：

```env
RESEND_API_KEY="re_xxxxxxxxx"
```

##### 第三步：配置发件地址

发件地址必须属于已经验证的域名。例如已经验证：

```text
mail.your-domain.example
```

则可以配置：

```env
RESEND_FROM_EMAIL="燕中数字母港 <noreply@mail.your-domain.example>"
```

其中：

- `燕中数字母港` 是收件人看到的发件人名称；
- `noreply@mail.your-domain.example` 是实际发件邮箱；
- 域名部分必须与 Resend 中已验证的域名匹配；
- 发件地址只用于系统通知，不建议使用个人邮箱；
- 如果希望用户能够回复，应后续在邮件工具中单独增加 `replyTo`，不要直接把系统发件地址当作人工客服邮箱。

##### 第四步：配置站点地址

`APP_URL` 用于生成邮件中的验证链接和密码重置链接：

```env
APP_URL="https://your-domain.example"
```

生产环境必须使用用户实际访问的 HTTPS 地址，不应填写：

```text
localhost
127.0.0.1
容器内部地址
服务器内网地址
```

当前邮件工具会自动移除 `APP_URL` 末尾多余的 `/`，并生成：

```text
https://your-domain.example/verify-email?token=...
https://your-domain.example/reset-password?token=...
```

验证邮件链接有效期为 24 小时，密码重置链接有效期为 1 小时。

##### 第五步：重启并验证配置

修改环境变量后需要重启应用，使服务端重新读取配置。

建议按以下顺序测试：

1. 注册一个可以接收邮件的测试账号；
2. 确认注册接口返回 `emailSent: true`；
3. 检查收件箱、垃圾邮件和推广邮件分类；
4. 打开验证链接并确认邮箱状态更新；
5. 再次使用相同链接，确认一次性 Token 不能重复生效；
6. 使用“重发验证邮件”，确认旧链接失效、新链接可用；
7. 发起忘记密码请求；
8. 打开重置链接并修改密码；
9. 确认密码修改后旧登录会话失效；
10. 在 Resend 控制台检查邮件的发送、送达、退信或失败状态。

##### 第六步：区分不同环境

建议不同环境使用不同配置：

```env
# 本地或测试环境
APP_URL="http://localhost:3000"
RESEND_API_KEY="测试环境的 Key"
RESEND_FROM_EMAIL="燕中数字母港测试 <noreply@已验证域名>"

# 生产环境
APP_URL="https://your-domain.example"
RESEND_API_KEY="生产环境的 Key"
RESEND_FROM_EMAIL="燕中数字母港 <noreply@已验证域名>"
```

测试环境不应复用生产环境的 API Key，以免开发过程中的误操作向真实用户发送邮件。

#### 邮件发送失败时的表现

`src/lib/email.ts` 在以下情况下返回 `false`：

- `APP_URL`、`RESEND_API_KEY` 或 `RESEND_FROM_EMAIL` 缺失；
- Resend API 返回错误；
- 请求 Resend 时发生异常。

注册接口会保留已经创建的账号，并通过 `emailSent` 告知前端真实发送结果。页面应提示用户稍后重发验证邮件，不应在发送失败时显示“邮件已发送”。

忘记密码接口为了避免泄露邮箱是否注册，不会向外暴露具体账号状态。排查此类问题时应结合服务器日志和 Resend 控制台，而不是通过修改接口响应来显示敏感信息。

#### 常见问题排查

| 问题 | 检查内容 |
| --- | --- |
| 接口返回 `emailSent: false` | 检查三个环境变量是否完整，以及应用是否已经重启 |
| Resend 提示发件域名未验证 | 检查 DNS 记录是否完全匹配控制台给出的值 |
| 邮件已发送但未收到 | 检查垃圾邮件、收件规则、退信状态和 Resend 投递记录 |
| 邮件中的链接指向错误地址 | 检查 `APP_URL` 是否为正确的外部站点地址 |
| 验证链接打开后提示无效 | 检查 Token 是否过期、是否已经使用，或是否在重发后被新 Token 替换 |
| 开发环境可以发送，生产环境失败 | 检查生产服务器的环境变量、网络访问、域名验证状态及 API Key 是否属于正确环境 |
| 发件地址被拒绝 | 确认 `RESEND_FROM_EMAIL` 的域名与已验证域名一致 |

排查时不得在日志中输出完整 API Key、邮箱验证 Token 或密码重置 Token。

### 2. Redis 限流接入

登录、注册、邮箱验证、重发验证邮件、忘记密码、重置密码、投稿和部分上传接口均增加了请求限流。

生产环境应配置：

```env
REDIS_URL="redis://127.0.0.1:6379"
```

也可以使用带账号、密码或 TLS 的托管 Redis 地址。

限流实现位于：

```text
src/lib/redis.ts
src/lib/rate-limit.ts
```

本地开发未配置 Redis 时，系统可使用内存限流作为降级方案。生产环境如果没有可用 Redis，认证类请求可能被拒绝，因此正式部署前必须验证 `REDIS_URL` 和 Redis 服务可用。

### 3. 新增认证 API

| 方法 | API | 用途 | 权限 |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | 注册账号并发送验证邮件 | 公开，有限流 |
| `POST` | `/api/auth/login` | 用户或管理员登录 | 公开，有限流 |
| `POST` | `/api/auth/logout` | 退出登录并清除 Cookie | 已登录 |
| `GET` | `/api/auth/me` | 获取当前登录用户 | 已登录 |
| `POST` | `/api/auth/verify-email` | 使用一次性 Token 验证邮箱 | 公开，有限流 |
| `POST` | `/api/auth/resend-verification` | 重发验证邮件 | 公开，有限流 |
| `POST` | `/api/auth/forgot-password` | 申请密码重置邮件 | 公开，有限流 |
| `POST` | `/api/auth/reset-password` | 使用一次性 Token 重置密码 | 公开，有限流 |
| `GET` | `/api/auth/graduation-classes` | 获取去重后的届别选项 | 公开 |

邮箱验证 Token 和密码重置 Token 均为一次性 Token。邮件中发送原始 Token，数据库只保存 SHA-256 哈希；Token 使用后会立即清除，生成新 Token 后旧 Token 自动失效。

### 4. 新增个人中心 API

| 方法 | API | 用途 |
| --- | --- | --- |
| `GET` | `/api/me/profile` | 获取当前用户资料 |
| `PATCH` | `/api/me/profile` | 修改用户名和联系方式 |
| `GET` | `/api/me/posts` | 获取当前用户投稿 |
| `POST` | `/api/me/change-password` | 修改密码并使旧会话失效 |

这些接口只读取 Token 中的当前用户 ID，不接受客户端指定其他 `userId`，从而避免越权读取或修改其他用户资料。

### 5. 新增管理员 API

管理员敏感操作统一通过以下接口执行：

```text
POST /api/admin/users/[id]/actions
```

支持的操作包括：

- `approve-alumni`：通过校友认证；
- `reject-alumni`：撤销或拒绝校友认证；
- `disable-account`：停用账号；
- `enable-account`：恢复账号；
- `logout-all-sessions`：退出该账号的所有设备；
- `resend-verification`：重发验证邮件；
- `send-reset-password`：发送密码重置邮件；
- `grant-admin`：提升为管理员；
- `revoke-admin`：撤销管理员权限。

管理员不能通过通用资料修改接口直接改写密码哈希、Token 哈希、邮箱验证时间或 `sessionVersion`。敏感字段只能由固定的服务端流程修改。

### 6. 现有业务 API 权限收紧

本次改动同步检查并收紧了原有 API 权限：

- `/api/admin/*`、`/api/upload`、`/api/settings/*` 仅管理员可访问；
- 新闻、活动、故事、回忆、地图、搜索、证书等接口仅已认证校友或管理员可访问；
- 投稿接口从 Token 获取作者 ID，不再相信客户端提交的作者信息；
- GET 接口同样执行鉴权，不因“只读”而默认公开；
- 未明确权限的新 API 应默认拒绝访问。

---

## 四、数据库变更

### 1. User 模型扩展

`User` 新增了用户名、密码哈希、邮箱、邮箱验证、密码重置、账号状态、会话版本、届别、班级和旧资料合并等字段。

主要新增字段包括：

```text
username
passwordHash
email
emailVerified
emailVerifyTokenHash
emailVerifyExpiresAt
passwordResetTokenHash
passwordResetExpiresAt
graduationClass
className
accountStatus
sessionVersion
claimedAt
mergedIntoUserId
```

### 2. 新增审计日志

新增 `AuditLog` 模型，用于记录管理员的敏感操作，包括：

- 校友认证通过或撤销；
- 账号停用或恢复；
- 强制退出所有设备；
- 旧资料认领审批；
- 管理员权限授予或撤销。

审计记录与业务变更在同一数据库事务中写入，并且只保存经过白名单过滤的操作前后状态，不保存密码、Cookie、原始 Token 或密钥。

### 3. 新增旧资料认领申请

新增 `UserClaimRequest` 模型。注册用户可以声明自己曾通过旧“入轨联络舱”提交资料，随后由管理员人工核对并选择对应旧记录。

认领通过时，系统会在同一事务内：

1. 检查申请仍处于待审核状态；
2. 检查旧记录尚未被其他账号认领；
3. 将旧投稿转移到新账号；
4. 标记旧记录已合并并停用；
5. 更新认领申请状态和审核信息。

任一步骤失败时，整个事务回滚，不会出现只转移部分数据的情况。

### 4. 校友名单字段与去重

`WhitelistRoster` 新增：

```text
className
email
contact
```

校友名单新增、导入和校友审核写入流程统一使用去重逻辑。判断维度为：

```text
姓名 + 届别 + 班级 + 邮箱
```

匹配到已有记录时更新现有记录，不再新增重复项。校友认证通过时，用户注册时填写的联系方式也会自动同步到校友名单。

---

## 五、页面与使用流程

### 1. 用户注册

访问：

```text
/register
```

填写用户名、密码、姓名、届别、班级、邮箱和联系方式。注册后需进入邮箱完成验证，验证成功后才能登录。

如果姓名、届别、班级和邮箱与校友名单完整匹配，账号可以自动获得校友认证；未匹配的账号可由管理员在后台审核。

### 2. 登录

普通用户和管理员统一使用：

```text
/login
```

项目不再保留独立的 `/admin/login` 页面。访问未登录的后台地址时，会跳转到：

```text
/login?redirect=/admin
```

管理员登录成功后进入后台，普通用户登录后进入安全的站内重定向地址或默认页面。

### 3. 忘记密码

在登录页进入忘记密码流程：

1. 输入注册邮箱；
2. 系统调用 Resend API 发送重置邮件；
3. 点击邮件中的一次性链接；
4. 输入新密码；
5. 重置成功后所有旧设备自动退出。

为避免泄露账号是否存在，无论邮箱是否已注册，忘记密码接口均返回一致的外部提示。

### 4. 个人中心

个人中心包含：

```text
/me
/me/edit
/me/posts
/me/change-password
```

资料编辑页面中：

- 可以修改：用户名、联系方式；
- 不可修改：姓名、邮箱、届别、班级。

不可修改字段仍会显示明确标签，避免用户只看到无说明的禁用输入框。

保存资料成功后会显示居中的“资料已更新”提示。修改密码成功后会显示倒计时提示，随后跳转到登录页。

### 5. 管理后台

管理员登录后访问：

```text
/admin
```

后台新增或增强了：

- 用户账号与校友认证审核；
- 账号停用和恢复；
- 强制退出所有设备；
- 提升普通用户为管理员；
- 旧资料认领审核；
- 校友名单维护；
- CSV 导入和导出；
- 管理员敏感操作审计。

为防止误操作，管理员不能撤销自己的校友认证、停用自己的账号或撤销自己的管理员权限。

---

## 六、细节优化说明

在核心重构完成后，本次 PR 又完成了以下细节优化：

1. 登录后隐藏首页“入轨联络舱”注册入口；
2. 登录或退出后主动刷新认证状态，修复导航栏显示滞后；
3. 修复后台用户审核表格的表头与数据列错位；
4. 合并管理员和普通用户登录页；
5. 删除页面底部单独的“管理员入口”；
6. 为个人资料输入框补充明确标签；
7. 限制姓名、邮箱、届别和班级不可自行修改；
8. 修改密码成功后显示居中提示和跳转倒计时；
9. 编辑资料成功后显示居中成功提示；
10. Token 失效并跳转登录页时主动清空前端旧登录状态；
11. 阻止管理员撤销自己的校友认证；
12. 在用户审核页面增加“提升为管理员”按钮；
13. 管理后台只保留一个退出入口；
14. 统一校友名单写入路径的重复记录处理；
15. 将班级输入提示简化为“例如：1”；
16. 校友认证通过时自动同步用户联系方式到校友名单。

---

## 七、维护者本地验证与配置

### 1. 安装依赖

```bash
npm install
```

本次新增或重点使用的依赖包括：

```text
bcryptjs
resend
ioredis
tsx
```

### 2. 配置环境变量

至少需要配置：

```env
NODE_ENV="development"
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="请替换为足够长的随机密钥"
APP_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM_EMAIL="燕中数字母港 <noreply@your-domain.example>"
REDIS_URL="redis://127.0.0.1:6379"
SITE_URL="http://localhost:3000"
SITE_NAME="燕中校友数字母港"
```

注意：

- 生产环境必须更换 `SESSION_SECRET`；
- `APP_URL` 必须填写用户实际访问的站点地址；
- Resend 发件域名必须完成验证；
- 生产环境应配置可用的 Redis。

### 3. 初始化数据库

首次运行或 Schema 更新后执行：

```bash
npx prisma generate
npx prisma db push
```

生产数据库操作前必须先备份，禁止使用会清空数据的：

```bash
npx prisma migrate reset
```

### 4. 创建首个管理员

执行：

```bash
npm run create-admin
```

根据提示输入管理员用户名、邮箱和密码。脚本会：

- 校验用户名、邮箱和密码格式；
- 检查用户名和邮箱是否重复；
- 使用 bcrypt 保存密码哈希；
- 创建已验证、可用的管理员账号；
- 不在日志中输出明文密码。

### 5. 检查旧用户数据

升级已有数据库前执行：

```bash
npm run migrate-users
```

脚本会生成：

```text
user-migration-review.csv
```

该文件用于人工检查：

- 旧用户总数；
- 可能重名的记录；
- 缺少联系方式的记录；
- 关联投稿数量；
- 可以进入旧资料认领流程的记录。

脚本不会自动猜测届别、自动合并同名用户或生成弱密码。

### 6. 启动项目

开发环境：

```bash
npm run dev
```

生产构建：

```bash
npm run build
npm run start
```

### 7. 执行冒烟测试

```bash
SMOKE_BASE_URL=http://localhost:3000 \
SMOKE_USERNAME=admin \
SMOKE_PASSWORD=your-password \
npm run smoke
```

Windows PowerShell 可使用：

```powershell
$env:SMOKE_BASE_URL="http://localhost:3000"
$env:SMOKE_USERNAME="admin"
$env:SMOKE_PASSWORD="your-password"
npm run smoke
```

---

## 八、合并后的升级和部署影响

### 推荐升级顺序

1. 备份生产数据库和上传文件；
2. 部署新代码，但暂不删除旧备份；
3. 配置 `SESSION_SECRET`、Resend 和 Redis；
4. 执行 `npx prisma generate`；
5. 执行 `npx prisma db push`；
6. 运行 `npm run migrate-users` 检查旧数据；
7. 运行 `npm run create-admin` 创建数据库管理员；
8. 启动服务并测试注册、邮件验证和登录；
9. 测试管理员审核、账号停用和旧资料认领；
10. 测试私有页面及 API 的访问权限；
11. 运行冒烟测试；
12. 确认稳定后再清理旧共享口令配置和旧部署文件。

### 上线前必须检查

- Resend 域名已经验证；
- 验证邮件和密码重置邮件可以正常送达；
- `APP_URL` 指向正确的正式域名；
- `SESSION_SECRET` 为足够长的随机值；
- Redis 在生产环境可连接；
- 数据库已备份；
- Prisma Schema 已同步；
- 首个管理员可以正常登录；
- 游客不能访问私有页面和敏感 API；
- 普通用户不能访问管理 API；
- 未认证用户不能访问校友隐私数据；
- 修改密码或停用账号后旧 Token 立即失效；
- sitemap 和 robots 不再暴露私有页面；
- 日志中没有密码、原始 Token、Cookie 或密钥。

---

## 九、兼容性与安全说明

- 本项目依赖 Next.js API Routes、数据库和文件上传，不支持纯静态导出；
- 当前数据库为 SQLite，生产环境部署时应保证数据库文件和上传目录持久化；
- middleware 只负责第一层 Token 检查，敏感操作仍由服务端 API 查询数据库后再次鉴权；
- 前端 `AuthProvider` 只用于界面状态展示，不是安全边界；
- 注册接口不会接受客户端传入的管理员角色、账号状态或邮箱验证状态；
- 邮箱验证和校友认证是两个独立状态，邮箱验证不等于校友身份认证；
- 旧资料认领必须经过管理员人工核对，不能只凭姓名和届别直接取得历史账号；
- 管理员角色变化、账号状态变化和密码变化都会使旧会话失效。

---

## 十、PR 总结

本次 PR 不只是新增几个页面，而是完成了从“共享口令访问”到“个人账号、邮件验证、分级权限、后台审核和审计追踪”的整体升级。

其中，API 接入带来的主要能力包括：

- 通过 Resend API 完成邮箱验证和密码重置；
- 通过 Redis 支持生产级接口限流；
- 通过统一认证 API 管理注册、登录、退出和账号恢复；
- 通过个人中心 API 保证用户只能操作自己的资料；
- 通过管理员 Action API 约束敏感操作；
- 通过服务端鉴权保护新闻、活动、校友名单、地图、证书和后台数据。

配合界面、导航、校友名单和后台交互优化，本次改动在账号安全、数据归属、操作清晰度和日常维护能力方面均有明显提升。

本次 PR 涉及认证流程、数据库结构和部署配置，改动范围较大。请维护者重点审阅权限边界、数据库迁移、邮件配置和旧数据兼容方案。如整体方向得到认可，我愿意根据审阅意见继续拆分、调整或补充测试。
