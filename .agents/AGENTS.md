# 燕中数字母港项目后端架构准则 (System Architecture Context)

本项目已完成重大 API 与安全基建升级，后续开发必须严格遵守以下架构准则。所有生成的代码必须符合此标准：

### 1. 核心安全标准
- **鉴权与权限 (Auth/RBAC)**：系统采用基于 Token 的鉴权体系。所有 API 必须在最顶层校验权限，绝不信任客户端提交的 `userId`，所有作者 ID 或用户 ID 均应从服务端会话（Session/Token）获取。
- **防止水平越权 (IDOR)**：修改或删除操作必须在数据库层加入 `where: { id: targetId, authorId: currentUserId }` 条件，确保用户只能操作自己的资源。
- **速率限制 (Rate Limiting)**：所有 auth/registration/verification 类接口必须使用 `@upstash/ratelimit` 进行 Redis 限流。本地开发若无 Redis，须使用内存模式降级。
- **输入防御**：所有 POST/PUT 请求必须强制限制 Payload Size（使用 `readJsonBody`），且所有字段必须进行 trim、类型检查 and 长度约束，防止 DoS 和数据溢出。

### 2. 数据库与事务一致性
- **事务完整性**：对于涉及 `UserClaimRequest` 认领、`AuditLog` 审计记录、及 `WhitelistRoster` 导入的业务，必须在 `prisma.$transaction` 中执行。确保关联操作（如“转移投稿”、“标记旧记录已合并”、“记录审计日志”）要么全部成功，要么全部回滚。
- **数据去重**：`WhitelistRoster` 的导入和写入逻辑必须基于 `(name + graduationClass + className + email)` 的复合维度进行去重，严禁产生重复的校友名册条目。

### 3. 邮件与业务闭环
- **邮件服务**：系统统一使用 Resend API (`src/lib/email.ts`) 发送各类通知。邮件链接生成必须使用 `APP_URL`，禁止通过 `req.headers.get('host')` 伪造。
- **审计日志**：所有管理员操作（如用户停用、权限变更、认领审批）必须同步写入 `AuditLog` 表。

### 4. 数据脱敏原则
- 所有向前端返回列表的 `findMany` 操作，必须显式使用 `select` 语法，仅返回前端 UI 所需的最小数据字段，严禁返回 `passwordHash`、`token` 等敏感凭据。
