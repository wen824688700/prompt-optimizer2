# 快速开始指南

## 🚀 5 分钟部署到生产环境

### 前置条件
- GitHub 账号
- Google 账号（用于 OAuth）

---

## 步骤 1：配置 Supabase（2 分钟）

1. 访问 [supabase.com](https://supabase.com) 并登录
2. 点击 "New Project"，填写项目信息
3. 等待项目创建完成
4. 进入 **Settings → API**，复制：
   - `Project URL`
   - `anon public key`
   - `service_role key`（后端用）

5. 进入 **Settings → Database**，复制 `Connection string` (URI 格式)

6. 配置 Google OAuth：
   - 进入 **Authentication → Providers → Google**
   - 点击 "Enable"
   - 前往 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - 创建 OAuth 2.0 客户端 ID
   - 授权重定向 URI 填写：`https://xxx.supabase.co/auth/v1/callback`
   - 复制 Client ID 和 Client Secret 到 Supabase
   - 保存

---

## 步骤 2：部署后端到 Render（1 分钟）

1. 访问 [render.com](https://render.com) 并用 GitHub 登录
2. 点击 "New +" → "Web Service"
3. 连接你的 GitHub 仓库
4. Render 会自动检测配置，点击 "Create Web Service"
5. 在 Environment 标签添加环境变量：

```bash
DATABASE_URL=你的Supabase数据库连接字符串
DEEPSEEK_API_KEY=你的DeepSeek-API-Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
SUPABASE_URL=你的Supabase-URL
SUPABASE_KEY=你的Supabase-service-role-key
JWT_SECRET=随机生成一个字符串
ALLOWED_ORIGINS=https://你的域名.vercel.app
ENVIRONMENT=production
```

6. 等待部署完成，复制服务 URL（如 `https://xxx.onrender.com`）

---

## 步骤 3：部署前端到 Vercel（1 分钟）

1. 访问 [vercel.com](https://vercel.com) 并用 GitHub 登录
2. 点击 "Add New..." → "Project"
3. 导入你的 GitHub 仓库
4. 配置：
   - Framework Preset: Next.js
   - Root Directory: `frontend`
5. 添加环境变量：

```bash
NEXT_PUBLIC_API_URL=你的Render后端URL
NEXT_PUBLIC_SUPABASE_URL=你的Supabase-URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase-anon-key
NEXT_PUBLIC_SITE_URL=https://你的域名.vercel.app
```

6. 点击 "Deploy"

---

## 步骤 4：更新 Google OAuth 重定向（30 秒）

1. 回到 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 编辑你的 OAuth 2.0 客户端
3. 添加授权重定向 URI：
   ```
   https://你的域名.vercel.app/auth/callback
   ```
4. 保存

5. 回到 Supabase Dashboard → Authentication → URL Configuration
6. 添加 Redirect URLs：
   ```
   https://你的域名.vercel.app/**
   ```

---

## 步骤 5：测试（30 秒）

1. 访问你的 Vercel 域名
2. 点击 "使用 Google 登录"
3. 完成 Google 登录
4. 应该看到你的用户信息

🎉 **完成！你的应用已经上线了！**

---

## 本地开发

### 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### 配置环境变量

复制示例文件：
```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

编辑 `.env.local` 和 `.env`，填入你的配置。

### 启动服务

```bash
# 后端（终端 1）
cd backend
uvicorn app.main:app --reload

# 前端（终端 2）
cd frontend
npm run dev
```

访问 `http://localhost:3000`

---

## 常见问题

### Q: 后端首次访问很慢？
A: Render 免费版会在 15 分钟无活动后休眠，首次访问需要 30-60 秒唤醒。

### Q: CORS 错误？
A: 确保后端的 `ALLOWED_ORIGINS` 环境变量包含你的前端域名。

### Q: Google 登录失败？
A: 检查 Google OAuth 的重定向 URI 和 Supabase 的 Redirect URLs 配置。

---

## 下一步

- 查看完整的 [部署文档](./DEPLOYMENT.md)
- 阅读 [项目文档](./README.md)
- 查看 [技术栈说明](./.kiro/steering/tech.md)

需要帮助？提交 Issue 或查看文档！
