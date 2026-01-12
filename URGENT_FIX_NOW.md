# 🚨 紧急修复 - 立即执行

## 第一步：撤销 API Key（最重要！）

### Resend API Key

1. **立即访问**: https://resend.com/api-keys
2. **删除旧密钥**: `re_Ziz9KEyC_ENcVa4H6mm6xUGfKisEgN7LK`
3. **生成新密钥**
4. **复制新密钥**（只显示一次！）

### 更新 Vercel 环境变量

1. 访问: https://vercel.com/dashboard
2. 选择你的项目
3. Settings → Environment Variables
4. 找到 `RESEND_API_KEY`
5. 点击 Edit
6. 粘贴新的 API Key
7. 保存并重新部署

## 第二步：清理 Git 历史

### 方法 1：使用 BFG Repo-Cleaner（推荐）

```powershell
# 下载 BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# 创建敏感词列表
@"
re_Ziz9KEyC_ENcVa4H6mm6xUGfKisEgN7LK
"@ | Out-File -Encoding UTF8 passwords.txt

# 清理历史
java -jar bfg.jar --replace-text passwords.txt

# 清理引用
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送
git push origin --force --all
```

### 方法 2：使用 git filter-branch

```powershell
# 运行清理脚本
.\clean_git_history.ps1

# 强制推送
git push origin --force --all
```

## 第三步：验证修复

### 检查 GitHub

1. 访问你的 GitHub 仓库
2. 搜索: `re_Ziz9KEyC`
3. 确认搜索结果为空

### 检查本地

```powershell
# 搜索所有历史
git log --all --full-history -S "re_Ziz9KEyC"

# 应该返回空结果
```

### 测试新 API Key

```powershell
# 设置环境变量
$env:RESEND_API_KEY = "your-new-key"

# 测试发送邮件
python -c "import resend; resend.api_key='$env:RESEND_API_KEY'; print(resend.Emails.send({'from':'onboarding@resend.dev','to':['your@email.com'],'subject':'Test','html':'Test'}))"
```

## 第四步：通知团队

如果有其他开发者，通知他们：

```
⚠️ 紧急通知：Git 历史已重写

由于安全原因，我们重写了 Git 历史。请执行以下操作：

1. 备份本地未推送的更改
2. 删除本地仓库
3. 重新克隆：git clone <repo-url>
4. 应用你的本地更改

不要尝试 pull 或 merge，会导致冲突！
```

## 第五步：监控

### Resend Dashboard

1. 访问: https://resend.com/dashboard
2. 检查最近的邮件发送记录
3. 查看是否有异常活动

### Vercel Logs

1. 访问: https://vercel.com/dashboard
2. 查看部署日志
3. 确认新 API Key 工作正常

## 完成检查清单

- [ ] 已撤销旧的 Resend API Key
- [ ] 已生成新的 API Key
- [ ] 已更新 Vercel 环境变量
- [ ] 已重新部署应用
- [ ] 已清理 Git 历史
- [ ] 已强制推送到 GitHub
- [ ] 已验证 GitHub 上看不到敏感信息
- [ ] 已测试新 API Key 工作正常
- [ ] 已通知团队成员（如有）
- [ ] 已检查 Resend 使用记录

## 时间估计

- 撤销 API Key: 2 分钟
- 更新环境变量: 3 分钟
- 清理 Git 历史: 5 分钟
- 验证修复: 5 分钟
- **总计: 约 15 分钟**

## 如果遇到问题

### Git 推送被拒绝

```powershell
# 强制推送（会覆盖远程历史）
git push origin --force --all
git push origin --force --tags
```

### BFG 找不到敏感词

```powershell
# 手动检查文件
git log --all --full-history --source --pretty=format:"%H %s" -- test_resend_api.py

# 查看特定提交
git show <commit-hash>:test_resend_api.py
```

### Vercel 部署失败

1. 检查环境变量是否正确
2. 查看部署日志
3. 尝试手动重新部署

## 联系支持

- Resend: https://resend.com/support
- Vercel: https://vercel.com/support
- GitHub: https://support.github.com

---

**记住：撤销 API Key 是最重要的！即使 Git 清理失败，只要 API Key 已撤销，就不会有安全风险。**
