# Resend 域名验证完整指南

## 第一步：访问 Resend 域名管理

1. 打开浏览器，访问 https://resend.com/domains
2. 使用你的 Resend 账号登录
3. 点击右上角的 **"Add Domain"** 按钮

## 第二步：添加域名

1. 在弹出的对话框中输入你的域名：`prompt-optimizer.online`
2. 点击 **"Add"** 或 **"Continue"**

## 第三步：查看 DNS 记录要求

添加域名后，Resend 会显示一个页面，列出需要添加的 DNS 记录。

**重要**：每个账户的 DKIM 记录值都不同，你需要从 Resend 页面复制具体的值。

页面会显示类似这样的内容：

### 1. SPF 记录
```
Type: TXT
Name: @ (或者留空，表示根域名)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600 (或自动)
```

### 2. DKIM 记录（重要：从 Resend 页面复制）
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (很长的字符串)
TTL: 3600
```

### 3. DMARC 记录（可选但推荐）
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:824688700@qq.com
TTL: 3600
```

## 第四步：配置 DNS 记录

### 如果你的域名在 Cloudflare

1. 登录 Cloudflare Dashboard
2. 选择域名 `prompt-optimizer.online`
3. 点击左侧菜单的 **DNS** → **Records**
4. 点击 **Add record** 按钮

#### 添加 SPF 记录
- Type: `TXT`
- Name: `@`
- Content: `v=spf1 include:_spf.resend.com ~all`
- TTL: `Auto`
- Proxy status: `DNS only` (灰色云朵)
- 点击 **Save**

#### 添加 DKIM 记录
- Type: `TXT`
- Name: `resend._domainkey`
- Content: `[从 Resend 页面复制的完整值]`
- TTL: `Auto`
- Proxy status: `DNS only`
- 点击 **Save**

#### 添加 DMARC 记录
- Type: `TXT`
- Name: `_dmarc`
- Content: `v=DMARC1; p=none; rua=mailto:824688700@qq.com`
- TTL: `Auto`
- Proxy status: `DNS only`
- 点击 **Save**

### 如果你的域名在阿里云

1. 登录阿里云控制台
2. 进入 **域名** → **域名列表**
3. 找到 `prompt-optimizer.online`，点击 **解析**
4. 点击 **添加记录**

#### 添加 SPF 记录
- 记录类型: `TXT`
- 主机记录: `@`
- 记录值: `v=spf1 include:_spf.resend.com ~all`
- TTL: `10分钟`
- 点击 **确定**

#### 添加 DKIM 记录
- 记录类型: `TXT`
- 主机记录: `resend._domainkey`
- 记录值: `[从 Resend 页面复制]`
- TTL: `10分钟`
- 点击 **确定**

#### 添加 DMARC 记录
- 记录类型: `TXT`
- 主机记录: `_dmarc`
- 记录值: `v=DMARC1; p=none; rua=mailto:824688700@qq.com`
- TTL: `10分钟`
- 点击 **确定**

### 如果你的域名在其他服务商

原理相同，找到 DNS 管理页面，添加上述 TXT 记录。

## 第五步：验证 DNS 记录

### 在 Resend 页面验证

1. 回到 Resend 的域名页面
2. 等待 5-10 分钟（DNS 传播需要时间）
3. 点击 **"Verify"** 或 **"Check DNS"** 按钮
4. 如果显示绿色勾号 ✓，说明验证成功

### 手动检查 DNS 记录

你也可以使用命令行检查：

```bash
# 检查 SPF 记录
nslookup -type=TXT prompt-optimizer.online

# 检查 DKIM 记录
nslookup -type=TXT resend._domainkey.prompt-optimizer.online

# 检查 DMARC 记录
nslookup -type=TXT _dmarc.prompt-optimizer.online
```

或者使用在线工具：
- https://mxtoolbox.com/SuperTool.aspx
- https://dnschecker.org/

## 第六步：更新应用配置

### 1. 更新本地配置 (backend/.env)

```bash
RESEND_FROM_EMAIL=noreply@prompt-optimizer.online
```

### 2. 更新 Vercel 环境变量

1. 访问 Vercel Dashboard
2. 选择你的项目
3. Settings → Environment Variables
4. 找到 `RESEND_FROM_EMAIL`
5. 修改为：`noreply@prompt-optimizer.online`
6. 点击 **Save**

### 3. 关闭开发模式

如果之前启用了开发模式，现在可以关闭：

```bash
DEV_MODE=false
```

### 4. 重新部署

在 Vercel Dashboard：
1. Deployments 标签
2. 找到最新部署
3. 点击 **⋯** → **Redeploy**

## 第七步：测试

1. 访问你的网站
2. 尝试注册新账户
3. 输入任意邮箱地址（不再限制只能是你的邮箱）
4. 应该能收到验证码邮件

## 常见问题

### Q1: DNS 记录添加后多久生效？

**A**: 通常 5-30 分钟，最长可能需要 24-48 小时。

### Q2: Resend 一直显示 "Pending Verification"？

**A**: 
1. 检查 DNS 记录是否正确添加
2. 等待更长时间（DNS 传播）
3. 使用 `nslookup` 命令检查记录是否生效
4. 确保 DKIM 记录值完全正确（包括所有字符）

### Q3: 我找不到 DKIM 记录的值？

**A**: 
1. 回到 Resend 的域名页面
2. 点击你添加的域名
3. 应该能看到完整的 DNS 记录要求
4. 复制 DKIM 记录的完整值

### Q4: 可以使用子域名吗？

**A**: 可以！比如使用 `mail.prompt-optimizer.online`，配置方法相同。

### Q5: 验证失败怎么办？

**A**: 
1. 检查 DNS 记录的 Name 字段是否正确
2. 确保没有多余的空格
3. 某些 DNS 服务商会自动添加域名后缀，注意不要重复
4. 联系 Resend 支持：support@resend.com

## 截图参考

### Resend 域名页面应该显示：

```
✓ SPF Record
✓ DKIM Record  
✓ DMARC Record (optional)

Status: Verified
```

### DNS 记录示例（Cloudflare）

```
Type    Name                    Content
TXT     @                       v=spf1 include:_spf.resend.com ~all
TXT     resend._domainkey       p=MIGfMA0GCSqGSIb3DQEBAQUAA...
TXT     _dmarc                  v=DMARC1; p=none; rua=mailto:...
```

## 时间线

- **0-5 分钟**: 在 Resend 添加域名，获取 DNS 记录要求
- **5-10 分钟**: 在 DNS 服务商添加记录
- **10-30 分钟**: 等待 DNS 传播
- **30 分钟**: 在 Resend 验证域名
- **35 分钟**: 更新应用配置并重新部署
- **40 分钟**: 测试邮件发送

**总计：约 40-60 分钟**

## 需要帮助？

如果遇到问题：
1. 截图 Resend 域名页面
2. 截图 DNS 记录配置
3. 提供错误信息

---

**下一步：访问 https://resend.com/domains 开始配置！**
