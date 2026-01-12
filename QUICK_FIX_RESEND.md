# 🔧 Resend 邮件发送问题修复

## 问题原因

Resend 免费账户在**测试模式**下只能发送邮件到**注册账户的邮箱**（824688700@qq.com）。

要发送给其他用户，必须：
1. 验证自己的域名
2. 使用验证后的域名作为发件地址

## 临时解决方案（立即可用）

### 在 Vercel 启用开发模式

1. 访问 Vercel Dashboard
2. Settings → Environment Variables
3. 修改或添加：
   ```
   ENVIRONMENT=production
   DEV_MODE=true  # 改为 true
   ```
4. 重新部署

这样用户可以使用固定验证码 `123456` 进行注册和登录。

## 永久解决方案（推荐）

### 步骤 1：验证域名

1. 访问 https://resend.com/domains
2. 点击 **Add Domain**
3. 输入你的域名：`prompt-optimizer.online`
4. 按照提示添加 DNS 记录：

#### 需要添加的 DNS 记录

在你的域名 DNS 管理面板（如 Cloudflare、阿里云等）添加：

**SPF 记录**：
```
类型: TXT
名称: @
值: v=spf1 include:_spf.resend.com ~all
```

**DKIM 记录**（Resend 会提供具体值）：
```
类型: TXT
名称: resend._domainkey
值: [Resend 提供的值]
```

**DMARC 记录**：
```
类型: TXT
名称: _dmarc
值: v=DMARC1; p=none; rua=mailto:your-email@example.com
```

### 步骤 2：更新发件地址

域名验证完成后：

1. 在 Vercel 环境变量中更新：
   ```
   RESEND_FROM_EMAIL=noreply@prompt-optimizer.online
   ```

2. 或者使用：
   ```
   RESEND_FROM_EMAIL=support@prompt-optimizer.online
   ```

3. 重新部署

### 步骤 3：关闭开发模式

```
DEV_MODE=false
```

## 当前状态检查

```bash
# 检查 Resend 域名状态
curl https://api.resend.com/domains \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 时间估计

- **临时方案**（开发模式）：5 分钟
- **永久方案**（域名验证）：30-60 分钟（DNS 传播需要时间）

## 推荐流程

1. **立即**：启用开发模式，让用户可以使用
2. **同时**：开始配置域名验证
3. **验证完成后**：切换到生产模式

## 注意事项

### 开发模式的限制

- ✅ 所有用户使用固定验证码 123456
- ⚠️ 不够安全，仅用于测试
- ⚠️ 不会真正发送邮件

### 生产模式的优势

- ✅ 真实的邮件验证
- ✅ 每个用户独立的验证码
- ✅ 更安全
- ✅ 可以发送给任何邮箱

## 快速操作

### 现在立即做（5分钟）

```bash
# 1. 在 Vercel 设置 DEV_MODE=true
# 2. 重新部署
# 3. 测试：所有用户使用验证码 123456
```

### 今天完成（1小时）

```bash
# 1. 访问 https://resend.com/domains
# 2. 添加域名 prompt-optimizer.online
# 3. 配置 DNS 记录
# 4. 等待验证（通常 10-30 分钟）
# 5. 更新 RESEND_FROM_EMAIL
# 6. 设置 DEV_MODE=false
# 7. 重新部署
```

---

**建议：先启用开发模式让用户可以使用，同时配置域名验证**
