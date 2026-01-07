# Vercel Serverless Functions API

本目录包含后端 API 的 Vercel Serverless Functions 实现。

## 架构说明

采用 Vercel Serverless Functions 架构，将原本的 FastAPI 后端改造为无服务器函数：

```
frontend/api/
├── _config.py              # 配置管理
├── _db.py                  # 数据库连接（Serverless 优化）
├── _utils.py               # 工具函数
├── _services/              # 业务逻辑服务（从 backend/app/services 复制）
│   ├── base_llm.py
│   ├── llm_factory.py
│   ├── llm_service.py
│   ├── gemini_service.py
│   ├── framework_matcher.py
│   ├── quota_manager.py
│   └── version_manager.py
├── frameworks.py           # 框架匹配 API
├── prompts.py              # 提示词生成 API
├── quota.py                # 配额查询 API
├── versions.py             # 版本管理 API
└── requirements.txt        # Python 依赖
```

## API 端点

### 1. 框架匹配
- **路径**: `/api/v1/frameworks/match`
- **方法**: POST
- **功能**: 根据用户输入匹配最合适的 Prompt 框架

### 2. 提示词生成
- **路径**: `/api/v1/prompts/generate`
- **方法**: POST
- **功能**: 生成优化后的提示词

### 3. 配额查询
- **路径**: `/api/v1/quota`
- **方法**: GET
- **功能**: 查询用户配额信息

### 4. 版本管理
- **路径**: `/api/v1/versions`
- **方法**: GET, POST
- **功能**: 获取版本列表、保存版本、回滚版本

## 关键特性

### 1. Serverless 优化

- **无连接池**: 使用 `NullPool` 避免连接池问题
- **按需连接**: 每次请求创建新的数据库连接
- **全局缓存**: 缓存 LLM 服务实例以减少初始化时间

### 2. 环境变量

所有配置通过环境变量管理，在 Vercel Dashboard 中配置：

```bash
# Backend API 环境变量
DATABASE_URL=postgresql://...
DEEPSEEK_API_KEY=sk-xxx...
DEEPSEEK_BASE_URL=https://api.deepseek.com
GEMINI_API_KEY=AIzaSyxxx...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
CREEM_API_KEY=your-creem-key
CREEM_WEBHOOK_SECRET=your-webhook-secret
JWT_SECRET=your-random-secret-key
ENVIRONMENT=production
```

### 3. CORS 处理

所有函数自动处理 CORS 预检请求，允许跨域访问。

## 本地开发

### 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 启动本地开发服务器
cd frontend
vercel dev
```

这会启动一个模拟 Vercel 生产环境的本地服务器，支持：
- Next.js 页面
- Serverless Functions
- 环境变量加载

### 测试 API

```bash
# 测试框架匹配
curl -X POST http://localhost:3000/api/v1/frameworks/match \
  -H "Content-Type: application/json" \
  -d '{"input": "帮我写一个营销文案", "model": "deepseek"}'

# 测试配额查询
curl http://localhost:3000/api/v1/quota?user_id=test_user&account_type=free
```

## 部署

### 自动部署

推送到 GitHub 后，Vercel 会自动：
1. 检测 `vercel.json` 配置
2. 构建 Next.js 应用
3. 部署 Serverless Functions
4. 分配域名

### 手动部署

```bash
cd frontend
vercel --prod
```

## 限制和注意事项

### Vercel Hobby 计划

- **函数执行时间**: 最长 10 秒
- **函数大小**: 最大 50MB
- **内存**: 1024MB
- **并发**: 1000 个实例

### 应对策略

1. **超时问题**: 如果 LLM 生成超过 10 秒，考虑升级到 Pro 计划或实现异步轮询
2. **冷启动**: 首次调用可能有 1-2 秒延迟，使用全局缓存优化
3. **数据库连接**: 使用 `NullPool` 和按需连接，避免连接泄漏

## 监控

在 Vercel Dashboard 中可以查看：
- 函数执行日志
- 错误率统计
- 响应时间
- 资源使用情况

## 故障排查

### 1. 函数超时

检查 LLM API 响应时间，考虑：
- 优化提示词长度
- 减少 max_tokens
- 升级到 Pro 计划

### 2. 导入错误

确保：
- `requirements.txt` 包含所有依赖
- Python 版本为 3.9
- 路径引用正确（使用相对导入）

### 3. 环境变量未加载

检查：
- Vercel Dashboard 中是否配置了环境变量
- 变量名是否正确
- 是否重新部署以应用变量

## 参考资料

- [Vercel Serverless Functions 文档](https://vercel.com/docs/functions/serverless-functions)
- [Python Runtime 文档](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [部署指南](../../DEPLOYMENT.md)
