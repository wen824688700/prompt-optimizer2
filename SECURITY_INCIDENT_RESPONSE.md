# 安全事件响应 - API Key 泄露

## 事件概述

**时间**: 2026-01-13  
**严重程度**: 🔴 高危  
**影响范围**: Resend API Key 暴露在 Git 历史中

## 泄露的文件

1. `test_resend_api.py` - 包含硬编码的 Resend API Key
2. `test_production_api.py` - 测试脚本
3. `docs/` 目录 - 多个文档包含 API Key 示例
4. 其他测试脚本

## 立即行动清单

### 1. 撤销暴露的 API Key ⚠️ 最高优先级

- [ ] 访问 https://resend.com/api-keys
- [ ] 删除旧的 API Key: `re_Ziz9KEyC_ENcVa4H6mm6xUGfKisEgN7LK`
- [ ] 生成新的 API Key
- [ ] 更新 Vercel 环境变量

### 2. 清理 Git 历史

- [ ] 运行 `.\clean_git_history.ps1`
- [ ] 强制推送: `git push origin --force --all`
- [ ] 通知团队成员重新克隆仓库

### 3. 更新环境变量

#### Vercel Dashboard
1. 进入项目设置
2. Environment Variables
3. 更新 `RESEND_API_KEY`
4. 重新部署

### 4. 验证修复

- [ ] 确认旧 API Key 已撤销
- [ ] 确认新 API Key 工作正常
- [ ] 确认 Git 历史已清理
- [ ] 确认 GitHub 上看不到敏感信息

## 预防措施

### 更新 .gitignore

已添加：
```
# Documentation with sensitive info
docs/

# 测试脚本（包含敏感信息）
check_supabase_tables.py
test_resend_api.py
test_production_api.py
diagnose_email_auth.py
```

### 代码审查规则

1. ❌ 禁止在代码中硬编码 API Key
2. ✅ 所有密钥必须通过环境变量
3. ✅ 测试脚本必须从环境变量读取
4. ✅ 文档中使用占位符（如 `re_xxxxx`）

### Git Hooks

考虑添加 pre-commit hook 检测敏感信息：
```bash
# .git/hooks/pre-commit
#!/bin/sh
if git diff --cached | grep -E "(re_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_]{20,})"; then
    echo "ERROR: Detected API key in commit!"
    exit 1
fi
```

## 时间线

- **00:00** - 发现 API Key 暴露
- **00:10** - 添加 docs/ 到 .gitignore
- **00:15** - 从当前提交中移除敏感文件
- **00:20** - 准备清理 Git 历史
- **待完成** - 撤销 API Key
- **待完成** - 强制推送清理后的历史

## 影响评估

### 暴露的信息
- Resend API Key
- 测试邮箱地址
- 项目配置信息

### 潜在风险
- 未授权使用 Resend 服务
- 邮件配额被滥用
- 垃圾邮件发送

### 缓解措施
- 立即撤销 API Key（最重要）
- 监控 Resend 使用情况
- 检查是否有异常邮件发送

## 经验教训

1. **永远不要硬编码密钥**
   - 即使是测试脚本
   - 即使是临时文件
   - 即使打算稍后删除

2. **文档也要小心**
   - 使用占位符
   - 不要复制真实的 API Key
   - docs/ 应该在 .gitignore 中

3. **提交前检查**
   - 使用 `git diff` 检查更改
   - 使用工具扫描敏感信息
   - 设置 pre-commit hooks

4. **定期审查**
   - 检查 .gitignore 是否完整
   - 审查最近的提交
   - 扫描代码库中的密钥

## 联系人

- 开发者: [你的联系方式]
- Resend 支持: https://resend.com/support

## 参考资料

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Resend API Keys](https://resend.com/api-keys)
- [Git filter-branch](https://git-scm.com/docs/git-filter-branch)
