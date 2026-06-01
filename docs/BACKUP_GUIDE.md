# 数据备份与恢复指南

## 必须备份的内容

| 路径 | 说明 | 重要性 |
|------|------|--------|
| `/var/www/alumni-site/data/prod.db` | SQLite 生产数据库（新闻、活动、校友名单、报名记录、用户等全部数据） | 最高 |
| `/var/www/alumni-site/uploads/` | 用户上传的图片文件（新闻封面、活动封面、校友证背景等） | 高 |

---

## 自动化备份（推荐）

项目提供 `scripts/backup.sh`，配合 crontab 实现定时备份。

### 部署到服务器

```bash
# 1. 复制脚本
sudo cp /var/www/alumni-site/app/scripts/backup.sh /var/www/alumni-site/backups/
sudo chmod +x /var/www/alumni-site/backups/backup.sh

# 2. 配置 crontab
crontab -e
```

添加以下行：

```
# 每小时备份数据库（保留 24h）
0 * * * * /var/www/alumni-site/backups/backup.sh hourly

# 每天 02:30 完整备份（保留 30 天）
30 2 * * * /var/www/alumni-site/backups/backup.sh daily

# 每周日 03:00 周备份（保留 90 天）
0 3 * * 0 /var/www/alumni-site/backups/backup.sh weekly
```

保存退出后 cron 自动生效。验证：

```bash
crontab -l
```

### 备份保留策略

脚本自动清理：

| 级别 | 频率 | 保留期 | 内容 |
| --- | --- | --- | --- |
| hourly | 每小时 | 24 小时 | 数据库快照 |
| daily | 每日 | 30 天 | 数据库 + 上传文件 |
| weekly | 每周 | 90 天 | 数据库 + 上传文件 |

---

## 手动备份命令



### 一键完整备份

```bash
sudo tar -czf /var/www/alumni-site/backups/alumni-data-$(date +%Y%m%d-%H%M%S).tar.gz \
  /var/www/alumni-site/data/prod.db \
  /var/www/alumni-site/uploads
```

### 仅备份数据库（快速）

```bash
cp /var/www/alumni-site/data/prod.db \
  /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S)
```

### 仅备份上传文件

```bash
sudo tar -czf /var/www/alumni-site/backups/uploads-$(date +%Y%m%d-%H%M%S).tar.gz \
  /var/www/alumni-site/uploads
```

---

## 备份策略建议

### 定期备份

| 频率 | 内容 | 保留策略 |
|------|------|----------|
| 每日 | 数据库 | 保留最近 30 天 |
| 每周 | 数据库 + 上传文件（完整备份） | 保留最近 3 个月 |
| 每月 | 数据库 + 上传文件 | 保留最近 12 个月 |
| 部署前 | 数据库（pre-deploy 标记） | 每次部署前必须执行 |

### 自动清理旧备份

```bash
# 删除 30 天前的数据库备份
find /var/www/alumni-site/backups -name "prod.db.*" -mtime +30 -delete

# 删除 90 天前的完整备份
find /var/www/alumni-site/backups -name "alumni-data-*.tar.gz" -mtime +90 -delete
```

建议通过 crontab 设置定期执行。

### 部署前备份（必须）

每次部署前必须备份生产数据库：

```bash
cp /var/www/alumni-site/data/prod.db \
  /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S).pre-deploy
```

---

## 恢复流程

### 恢复前必须确认

1. **确认恢复的必要性**：是否可以通过后台操作修复数据，而不是整体回滚
2. **检查备份文件完整性**：
   ```bash
   ls -lh /var/www/alumni-site/backups/prod.db.20250101-120000
   # 检查文件大小是否合理（生产库通常几十 MB 到几百 MB）
   ```
3. **确认恢复的时间点**：选定要恢复到哪个备份

### 完整恢复步骤

**第 1 步：停止服务**（防止恢复过程中有新数据写入）

```bash
sudo systemctl stop alumni-site
```

**第 2 步：备份当前状态**（万一恢复出错可以反悔）

```bash
cp /var/www/alumni-site/data/prod.db \
  /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S).pre-restore
```

**第 3 步：恢复数据库**

从 tar.gz 完整备份恢复：

```bash
sudo tar -xzf /var/www/alumni-site/backups/alumni-data-20250101-120000.tar.gz \
  -C /var/www/alumni-site/
```

或从单文件数据库备份恢复：

```bash
sudo cp /var/www/alumni-site/backups/prod.db.20250101-120000 \
  /var/www/alumni-site/data/prod.db
```

**第 4 步：恢复上传文件**（如果备份中包含）

```bash
sudo tar -xzf /var/www/alumni-site/backups/alumni-data-20250101-120000.tar.gz \
  -C /var/www/alumni-site/ --wildcards '*/uploads/*'
```

**第 5 步：确认文件权限**

```bash
sudo chown -R www-data:www-data /var/www/alumni-site/data/prod.db
sudo chown -R www-data:www-data /var/www/alumni-site/uploads/
```

**第 6 步：启动服务**

```bash
sudo systemctl start alumni-site
sudo systemctl status alumni-site
```

**第 7 步：验证数据**

- 访问 `https://yanchuaner.cn` 确认首页正常
- 登录后台检查新闻、活动、校友名单数据是否完整
- 抽查几个校友记录确认信息正确
- 检查活动报名记录是否存在

---

## 恢复失败的回退

如果恢复后发现数据不对，可以从 `pre-restore` 备份回退：

```bash
sudo systemctl stop alumni-site
sudo cp /var/www/alumni-site/backups/prod.db.YYYYMMDD-HHMMSS.pre-restore \
  /var/www/alumni-site/data/prod.db
sudo systemctl start alumni-site
```

---

## 安全原则

| 原则 | 说明 |
|------|------|
| 恢复前先备份当前状态 | 确保恢复操作可逆 |
| 不要用旧库覆盖新库 | 除非确认旧库数据更新或当前库已损坏 |
| 恢复后验证关键数据 | 新闻、活动、校友名单是否完整 |
| 上传文件与数据库保持一致 | 如果只恢复了数据库没恢复上传文件，可能出现图片 404 |

---

## 线下备份建议

定期将线上备份下载到本地计算机：

```bash
# 从服务器下载最新备份（在本地执行）
scp user@yanchuaner.cn:/var/www/alumni-site/backups/prod.db.$(date +%Y%m%d).pre-deploy \
  ./offline-backup/

# 或下载完整备份
scp user@yanchuaner.cn:/var/www/alumni-site/backups/alumni-data-*.tar.gz \
  ./offline-backup/
```

---

## 相关文档

- [部署与运维指南](DEPLOYMENT_GUIDE.md) — 部署流程中的备份步骤
- [管理员使用手册](ADMIN_GUIDE.md) — 误操作处理与恢复
- [运营指南](OPERATIONS_GUIDE.md) — 本地数据库操作备份
