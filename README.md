# Prompt Optimizer MVP

> 基于 57 个经过验证的 Prompt 工程框架，智能匹配最佳方案，3 分钟生成专业级提示词

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/prompt-optimizer-mvp)

## ✨ 特性

- 🎯 **智能框架匹配** - 从 57 个 Prompt 框架中自动推荐最合适的方案
- 💬 **交互式追问** - 通过标准化问题深入理解需求
- 📝 **可视化工作台** - 实时预览和编辑优化效果
- 🔄 **版本管理** - 保存历史版本，支持一键回滚
- 📎 **附件支持** - 上传参考文档提供更多上下文
- 🚀 **完全免费部署** - 基于 Vercel Serverless 架构

## 🚀 快速开始

### 一键部署到 Vercel

1. 点击上方 "Deploy with Vercel" 按钮
2. 按照 [部署指南](docs/DEPLOYMENT.md) 配置环境变量
3. 等待部署完成，开始使用

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/your-username/prompt-optimizer-mvp.git
cd prompt-optimizer-mvp/frontend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写真实值

# 4. 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

## 📚 文档

- 📖 [部署指南](docs/DEPLOYMENT.md) - 完整的部署文档
- 🔑 [环境变量配置](docs/ENV_GUIDE.md) - 详细的配置说明
- 🚀 [快速开始](docs/QUICKSTART.md) - 5 分钟快速部署
- ✅ [部署检查清单](docs/CHECKLIST.md) - 逐步检查配置

## 💻 技术栈

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Vercel Serverless Functions (Python)
- **Database**: Supabase (PostgreSQL)
- **LLM**: DeepSeek API
- **Auth**: Supabase Auth

## 📁 项目结构

```
prompt-optimizer-mvp/
├── frontend/           # Next.js 前端 + Serverless Functions
│   ├── app/           # 页面路由
│   ├── components/    # React 组件
│   ├── lib/           # 工具函数和状态管理
│   └── api/           # Serverless Functions (Python)
├── backend/           # FastAPI 后端（本地开发用）
├── skills-main/       # 57 个 Prompt 框架资料
└── docs/              # 文档
```


## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件
