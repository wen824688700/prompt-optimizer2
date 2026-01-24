# 项目结构

## 根目录结构
```
prompt-optimizer-mvp/
├── .github/              # GitHub Actions CI/CD 配置
├── .kiro/                # Kiro 配置和规范文档
│   ├── specs/           # 项目规范（需求、设计、任务）
│   └── steering/        # AI 助手引导规则
├── backend/             # FastAPI 后端应用
├── frontend/            # Next.js 前端应用
├── skills-main/         # Prompt 框架参考资料（57 个框架）
└── README.md            # 项目主文档
```

## Backend 结构
```
backend/
├── app/
│   ├── api/                    # API 路由层
│   │   ├── frameworks.py      # 框架匹配 API
│   │   ├── prompts.py         # 提示词生成 API
│   │   ├── quota.py           # 配额管理 API
│   │   └── versions.py        # 版本管理 API
│   ├── services/              # 业务逻辑层
│   │   ├── framework_matcher.py   # 框架匹配服务
│   │   ├── llm_service.py         # LLM 调用服务
│   │   ├── quota_manager.py       # 配额管理服务
│   │   └── version_manager.py     # 版本管理服务
│   ├── models/                # 数据模型（SQLAlchemy）
│   ├── config.py              # 配置管理
│   └── main.py                # FastAPI 应用入口
├── tests/
│   ├── unit/                  # 单元测试
│   └── property/              # 属性测试（Hypothesis）
├── requirements.txt           # 生产依赖
├── requirements-test.txt      # 测试依赖
├── requirements-minimal.txt   # 最小依赖
├── pyproject.toml            # Python 项目配置（ruff, mypy）
├── pytest.ini                # pytest 配置
├── Dockerfile                # Docker 镜像
└── railway.json              # Railway 部署配置
```

## Frontend 结构
```
frontend/
├── app/                       # Next.js App Router
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 首页（输入和框架选择）
│   ├── workspace/            # 工作台页面
│   │   └── page.tsx
│   ├── account/              # 账户页面
│   │   └── page.tsx
│   └── globals.css           # 全局样式
├── components/               # React 组件
│   ├── ModelSelector.tsx         # 模型选择器
│   ├── AttachmentUploader.tsx    # 附件上传
│   ├── InputTextarea.tsx         # 输入框
│   ├── OptimizeButton.tsx        # 优化按钮
│   ├── ClarificationModal.tsx    # 追问弹窗
│   ├── EditorPanel.tsx           # 编辑器面板
│   ├── OutputTabs.tsx            # 输出标签页
│   ├── MarkdownTab.tsx           # Markdown 展示
│   ├── VersionsTab.tsx           # 版本历史
│   ├── Navigation.tsx            # 导航栏
│   ├── Toast.tsx                 # 提示消息
│   ├── ToastContainer.tsx        # 消息容器
│   ├── LoadingSkeleton.tsx       # 加载骨架屏
│   └── ErrorBoundary.tsx         # 错误边界
├── lib/                      # 工具函数和 Hooks
│   ├── api/
│   │   └── client.ts        # API 客户端
│   ├── stores/              # Zustand 状态管理
│   │   ├── authStore.ts
│   │   ├── modelStore.ts
│   │   ├── quotaStore.ts
│   │   ├── toastStore.ts
│   │   └── workspaceStore.ts
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── types.ts             # TypeScript 类型定义
│   └── utils.ts             # 工具函数
├── public/                  # 静态资源
├── package.json             # 依赖和脚本
├── tsconfig.json            # TypeScript 配置
├── tailwind.config.js       # Tailwind CSS 配置
├── next.config.js           # Next.js 配置
├── jest.config.js           # Jest 配置
└── vercel.json              # Vercel 部署配置
```

## 架构模式

### Backend 分层架构
1. **API 层** (`app/api/`)：处理 HTTP 请求和响应，参数验证
2. **Service 层** (`app/services/`)：业务逻辑实现，调用外部服务
3. **Model 层** (`app/models/`)：数据模型定义（SQLAlchemy ORM）
4. **Config 层** (`app/config.py`)：配置管理（Pydantic Settings）

### Frontend 组件组织
1. **页面组件** (`app/`)：路由页面，使用 App Router
2. **UI 组件** (`components/`)：可复用的展示组件
3. **状态管理** (`lib/stores/`)：Zustand stores，按功能模块划分
4. **API 层** (`lib/api/`)：统一的 API 调用接口
5. **工具函数** (`lib/utils.ts`, `lib/hooks/`)：通用工具和自定义 Hooks

## 命名约定

### Backend
- 文件名：小写下划线（`framework_matcher.py`）
- 类名：大驼峰（`FrameworkMatcher`）
- 函数名：小写下划线（`match_frameworks`）
- 常量：大写下划线（`MAX_FRAMEWORKS`）

### Frontend
- 文件名：大驼峰（`ModelSelector.tsx`）
- 组件名：大驼峰（`ModelSelector`）
- 函数名：小驼峰（`handleOptimize`）
- 常量：大写下划线（`API_BASE_URL`）
- CSS 类：Tailwind 工具类

## 关键文件说明

### Backend
- `app/main.py`：FastAPI 应用入口，路由注册，CORS 配置
- `app/config.py`：环境变量和配置管理
- `app/services/llm_service.py`：DeepSeek API 调用封装
- `app/services/framework_matcher.py`：框架匹配算法实现

### Frontend
- `app/page.tsx`：首页，用户输入和框架选择
- `app/workspace/page.tsx`：工作台，编辑和版本管理
- `lib/api/client.ts`：统一的 API 客户端
- `lib/stores/workspaceStore.ts`：工作台状态管理

### 框架资料
- `skills-main/skills/prompt-optimizer/references/frameworks/`：57 个 Prompt 框架的详细文档
- `skills-main/skills/prompt-optimizer/references/Frameworks_Summary.md`：框架总结

## 文档管理规则

**重要**：**除非用户明确要求，否则不要自行创建文档**

- ❌ 不要在完成任务后自动创建总结文档
- ❌ 不要创建未经请求的 README、指南或报告
- ✅ 只在用户明确要求时创建文档
- ✅ 如需创建文档，放在 `docs/` 目录下
