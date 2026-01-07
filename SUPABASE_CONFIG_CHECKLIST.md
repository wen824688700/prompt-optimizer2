# Supabase 配置检查清单

## 问题：登录后重定向到 localhost

### 必须检查的配置

#### 1. Supabase Dashboard 配置（最重要！）

进入 Supabase Dashboard：https://app.supabase.com

1. 选择你的项目
2. 进入 **Authentication** > **URL Configuration**
3. 检查以下配置：

```
Site URL: https://www.prompt-optimizer.online

Redirect URLs（添加以下两个）:
- https://www.prompt-optimizer.online/auth/callback
- https://www.prompt-optimizer.online/*
```

**注意**：
- 不要有尾部斜杠 `/`
- 确保使用 `https://` 而不是 `http://`
- 保存后等待 1-2 分钟生效

#### 2. Vercel 环境变量（已配置 ✓）

```
NEXT_PUBLIC_SITE_URL=https://www.prompt-optimizer.online
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase Anon Key
```

#### 3. 本地开发环境变量

在 `frontend/.env.local` 中保持：
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase Anon Key
```

### 调试步骤

1. 在生产环境打开浏览器控制台
2. 点击登录按钮
3. 查看控制台输出的 "登录重定向 URL"
4. 应该显示：`https://www.prompt-optimizer.online/auth/callback`

如果显示的是 localhost，说明：
- Vercel 环境变量没有生效（需要重新部署）
- 或者浏览器缓存了旧代码（清除缓存）

### 常见错误

❌ **错误 1**：Supabase Redirect URLs 中只配置了 localhost
```
http://localhost:3000/auth/callback  ← 只有这个
```

✅ **正确**：同时配置生产和本地
```
https://www.prompt-optimizer.online/auth/callback
https://www.prompt-optimizer.online/*
http://localhost:3000/auth/callback
http://localhost:3000/*
```

❌ **错误 2**：Site URL 配置错误
```
Site URL: http://localhost:3000  ← 错误
```

✅ **正确**：
```
Site URL: https://www.prompt-optimizer.online
```

### 如果还是不行

1. 清除浏览器缓存和 Cookie
2. 在 Vercel 触发重新部署
3. 检查 Supabase 的 Auth Logs（Authentication > Logs）
4. 查看是否有错误信息
