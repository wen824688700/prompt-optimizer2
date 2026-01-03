# Implementation Plan: Prompt Optimizer MVP

## Overview

本实施计划将 Prompt Optimizer MVP 的设计转换为可执行的编码任务。任务按照依赖关系组织，优先开发前端界面和交互逻辑，验证通过后再开发后端服务。

## Tasks

- [x] 1. 项目初始化与基础设施搭建
  - 创建 GitHub 仓库并初始化项目结构
  - 配置 Next.js 前端项目（App Router + TypeScript + Tailwind CSS）
  - 配置 FastAPI 后端项目（Python 3.11 + SQLAlchemy + Alembic）
  - 设置 Supabase 项目（PostgreSQL + Auth）
  - 配置环境变量模板（.env.example）
  - _Requirements: 1.5, 2.8_

## 前端开发阶段

- [ ] 2. 实现首页组件（Requirement 1 & 2）
  - [ ] 2.1 创建 HomePage 基础布局
    - 实现响应式容器（桌面全宽，移动单列）
    - 使用 Tailwind CSS 实现极简风格
    - _Requirements: 1.1, 1.2, 1.5, 1.6_
  
  - [ ] 2.2 实现模型选择组件
    - 创建 ModelSelector 下拉菜单
    - 初期仅显示 DeepSeek 选项
    - 实现选择状态保存
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 2.3 实现附件上传组件
    - 创建 AttachmentUploader 组件
    - 实现文件选择对话框
    - 验证文件类型（.txt, .md, .pdf）
    - 验证文件大小（≤5MB）
    - 显示文件名和删除按钮
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [ ] 2.4 实现输入框组件
    - 创建 InputTextarea 组件
    - 实现最少 10 字符验证
    - 显示字符计数
    - _Requirements: 3.1_
  
  - [ ] 2.5 实现优化按钮
    - 创建 OptimizeButton 组件
    - 实现加载状态
    - 实现点击事件处理
    - _Requirements: 3.2_

- [ ] 3. 实现框架选择弹窗（Requirement 3 & 4）
  - [ ] 3.1 创建 ClarificationModal 组件
    - 实现模态框基础结构
    - 实现打开/关闭动画
    - _Requirements: 3.6, 3.7, 4.1_
  
  - [ ] 3.2 实现框架选择器（多候选情况）
    - 创建 FrameworkSelector 组件
    - 显示 1-3 个框架候选
    - 实现单选逻辑
    - _Requirements: 3.5, 3.7_
  
  - [ ] 3.3 实现追问问题表单
    - 创建 5 个标准问题输入框
    - 目标清晰度（Goal Clarity）
    - 目标受众（Target Audience）
    - 上下文完整性（Context Completeness）
    - 格式要求（Format Requirements）
    - 约束条件（Constraints）
    - _Requirements: 4.2_
  
  - [ ] 3.4 实现表单验证
    - 标记必填字段
    - 实现提交验证
    - 显示验证错误
    - _Requirements: 4.3, 4.4_
  
  - [ ] 3.5 实现提交和取消按钮
    - 实现生成按钮（关闭弹窗，显示进度条）
    - 实现取消按钮（关闭弹窗，返回首页）
    - _Requirements: 4.5, 4.6_

- [ ] 4. 实现工作台页面（Requirement 5 & 6）
  - [ ] 4.1 创建 Workspace 基础布局
    - 实现 5:5 左右分栏布局（桌面）
    - 实现上下布局（移动）
    - _Requirements: 1.7, 5.4_
  
  - [ ] 4.2 实现左侧编辑区
    - 创建 EditorPanel 组件
    - 实现可编辑输入框
    - 实现本地草稿自动保存
    - 实现重新生成按钮
    - _Requirements: 6.1, 6.2_
  
  - [ ] 4.3 实现右侧选项卡容器
    - 创建 OutputTabs 组件
    - 实现两个选项卡切换
    - _Requirements: 5.5_
  
  - [ ] 4.4 实现 Markdown 原文选项卡
    - 创建 MarkdownTab 组件
    - 实现 Markdown 渲染
    - 实现复制按钮（复制到剪贴板，显示提示 2 秒）
    - 实现修改按钮（覆盖到左侧编辑区）
    - 实现保存按钮（保存版本）
    - 显示灰字提示
    - _Requirements: 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_
  
  - [ ] 4.5 实现版本记录选项卡
    - 创建 VersionsTab 组件
    - 显示版本列表（按时间倒序）
    - 版本标题格式：YYYY-MM-DD HH:mm:ss · 保存/优化
    - 实现点击查看版本内容
    - 实现回滚按钮
    - 限制最多 10 个版本
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 5. 实现账户页面（Requirement 7 & 8 & 9）
  - [ ] 5.1 创建 AccountPage 组件
    - 实现页面基础布局
    - _Requirements: 7.5_
  
  - [ ] 5.2 实现用户信息展示
    - 显示用户头像
    - 显示邮箱
    - 显示账户类型（Free/Pro）
    - _Requirements: 7.5_
  
  - [ ] 5.3 实现配额信息展示
    - 显示已用/总计配额
    - 显示下次重置时间（UTC）
    - _Requirements: 8.7_
  
  - [ ] 5.4 实现订阅信息展示
    - 显示订阅状态
    - 显示下次扣费日期
    - 实现升级到 Pro 按钮
    - 实现取消订阅按钮
    - _Requirements: 9.6_

- [ ] 6. 前端状态管理与本地存储
  - [ ] 6.1 配置 Zustand 状态管理
    - 创建 auth store（用户信息、登录状态）
    - 创建 workspace store（输入、输出、版本列表）
    - 创建 quota store（配额信息）
    - _Requirements: 2.3, 6.1, 8.1_
  
  - [ ] 6.2 实现本地存储
    - 实现草稿自动保存到 localStorage
    - 实现版本列表本地缓存
    - 实现模型选择持久化
    - _Requirements: 6.1, 2.3_

- [ ] 7. 前端错误处理与 UI 优化（Requirement 10）
  - [ ] 7.1 实现错误处理
    - 创建全局错误边界组件
    - 实现 Toast 通知组件
    - 实现输入验证错误显示
    - 实现文件上传错误显示
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 7.2 优化响应式设计
    - 测试桌面端布局
    - 测试移动端布局
    - 优化断点切换
    - _Requirements: 1.1, 1.2, 1.7_
  
  - [ ] 7.3 优化页面性能
    - 实现代码分割（Next.js dynamic import）
    - 优化图片加载（Next.js Image）
    - 实现骨架屏加载状态
    - 确保首屏渲染 < 2 秒
    - 确保交互响应 < 100ms
    - _Requirements: 1.3, 1.4_
  
  - [ ] 7.4 优化 UI 细节
    - 实现进度条动画
    - 实现按钮加载状态
    - 实现 Toast 通知动画
    - 实现灰字提示样式
    - _Requirements: 5.2, 5.8, 5.10_

- [ ] 8. Checkpoint - 前端功能验证
  - 测试所有前端组件和用户流程
  - 验证响应式布局
  - 验证本地存储功能
  - 验证错误处理
  - 询问用户是否满意前端实现

## 后端开发阶段

- [ ] 9. 数据库设计与迁移
  - [ ] 9.1 创建数据库 Schema
    - 定义 users, quotas, versions, subscriptions 表
    - 创建索引和外键约束
    - _Requirements: 6.9, 8.1_
  
  - [ ] 9.2 配置 Alembic 迁移
    - 初始化 Alembic
    - 创建初始迁移脚本
    - 测试迁移和回滚
    - _Requirements: 11.5_

- [ ] 10. 后端核心服务实现
- [ ] 10. 后端核心服务实现
  - [ ] 10.1 实现 LLMService
    - 封装 DeepSeek API 调用
    - 实现 analyze_intent 方法（框架匹配）
    - 实现 generate_prompt 方法（提示词生成）
    - 添加错误处理和重试逻辑
    - _Requirements: 2.8, 3.2, 5.1_
  
  - [ ] 10.2 实现 FrameworkMatcher Service
    - 加载 Frameworks_Summary.md 表格
    - 实现框架匹配逻辑（调用 LLMService）
    - 返回 1-3 个候选框架
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 10.3 实现 QuotaManager Service
    - 实现配额检查逻辑（Free: 5次/日，Pro: 100次/日）
    - 实现配额消耗逻辑
    - 实现每日配额重置（UTC 00:00）
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 10.4 实现 VersionManager Service
    - 实现版本保存逻辑（save/optimize 类型）
    - 实现版本列表获取（最近 10 个，按时间倒序）
    - 实现版本查询和回滚
    - 实现 UTC 时间戳格式化
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  
  - [ ] 10.5 实现 AuthService
    - 集成 Supabase Auth
    - 实现 JWT token 验证
    - 实现用户信息获取
    - _Requirements: 7.3, 7.4_
  
  - [ ] 10.6 实现 PaymentService
    - 集成 Creem API
    - 实现支付会话创建
    - 实现 Webhook 处理
    - 实现用户升级/降级逻辑
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11. 后端 API 端点实现
  - [ ] 11.1 实现框架匹配端点
    - POST /api/v1/frameworks/match
    - 验证用户输入（≥10 字符）
    - 处理附件上传（.txt/.md/.pdf，≤5MB）
    - 返回推荐框架列表
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [ ] 11.2 实现提示词生成端点
    - POST /api/v1/prompts/generate
    - 验证追问答案
    - 调用 LLMService 生成提示词
    - 自动保存版本
    - _Requirements: 4.5, 5.1, 5.2_
  
  - [ ] 11.3 实现版本管理端点
    - GET /api/v1/versions（获取版本列表）
    - POST /api/v1/versions（保存版本）
    - GET /api/v1/versions/{id}（获取特定版本）
    - POST /api/v1/versions/{id}/rollback（回滚版本）
    - _Requirements: 6.4, 6.6, 6.7, 6.9_
  
  - [ ] 11.4 实现配额管理端点
    - GET /api/v1/quota（获取配额信息）
    - 返回已用配额、总配额、重置时间
    - _Requirements: 8.7_
  
  - [ ] 11.5 实现支付端点
    - POST /api/v1/payment/checkout（创建支付会话）
    - POST /api/v1/payment/webhook（处理 Creem Webhook）
    - GET /api/v1/payment/subscription（获取订阅信息）
    - POST /api/v1/payment/cancel（取消订阅）
    - _Requirements: 9.1, 9.2, 9.6_

- [ ] 12. 前后端集成
  - [ ] 12.1 配置 React Query
    - 创建 API client（axios）
    - 实现框架匹配 query
    - 实现提示词生成 mutation
    - 实现版本管理 queries/mutations
    - 实现配额查询 query
    - _Requirements: 3.2, 5.1, 6.2, 8.1_
  
  - [ ] 12.2 实现 API 错误处理
    - 实现网络错误自动重试（3 次）
    - 实现配额不足提示
    - 实现 LLM 错误提示和重试
    - _Requirements: 10.1, 10.2, 10.5_

- [ ] 13. 用户认证集成
  - [ ] 13.1 配置 Supabase Auth
    - 初始化 Supabase client
    - 配置 Google OAuth provider
    - 实现登录/登出流程
    - _Requirements: 7.2, 7.3_
  
  - [ ] 13.2 实现认证中间件
    - 前端：保护需要登录的路由
    - 后端：验证 JWT token
    - 实现未登录用户重定向
    - _Requirements: 7.1, 7.2, 7.4_
  
  - [ ] 13.3 实现用户头像和账户类型显示
    - 在页面右上角显示用户头像
    - 显示账户类型（Free/Pro）
    - _Requirements: 7.5_

- [ ] 14. 支付集成
  - [ ] 14.1 集成 Creem 支付
    - 实现支付会话创建
    - 实现支付页面跳转
    - 实现 Webhook 接收和验证
    - _Requirements: 9.1, 9.2_
  
  - [ ] 14.2 实现订阅管理
    - 实现用户升级逻辑（Free → Pro）
    - 实现用户降级逻辑（Pro → Free）
    - 实现订阅状态查询
    - 实现取消订阅
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

- [ ] 15. Checkpoint - 后端服务测试
  - 确保所有后端服务和 API 端点通过测试
  - 测试前后端集成
  - 询问用户是否有问题

## 测试与部署阶段

- [ ] 16. 定时任务配置
  - [ ] 16.1 实现配额重置定时任务
    - 创建 Cron Job（每日 UTC 00:00）
    - 调用 QuotaManager.reset_daily_quotas()
    - 配置 Railway Cron Job
    - _Requirements: 8.6_
  
  - [ ] 16.2 实现订阅过期检查定时任务
    - 创建 Cron Job（每日检查）
    - 自动降级过期的 Pro 用户
    - _Requirements: 9.4_

- [ ] 17. 测试与质量保证
  - [ ] 17.1 编写单元测试
    - 前端组件测试（Jest + React Testing Library）
    - 后端服务测试（pytest）
    - 目标覆盖率：> 80%
    - _Requirements: All_
  
  - [ ] 17.2 编写集成测试
    - 端到端用户流程测试（Playwright）
    - API 集成测试（pytest + httpx）
    - _Requirements: All_
  
  - [ ] 17.3 手动测试
    - 测试完整优化流程
    - 测试 Google 登录流程
    - 测试 Creem 支付流程（测试模式）
    - 测试配额限制
    - 测试版本管理
    - 测试响应式布局
    - _Requirements: All_

- [ ] 18. 部署配置
  - [ ] 18.1 配置 Vercel 部署
    - 连接 GitHub 仓库
    - 设置 Root Directory 为 frontend
    - 配置环境变量
    - 绑定自定义域名（384866.xyz）
    - _Requirements: 11.1, 11.2, 11.7_
  
  - [ ] 18.2 配置 Railway 部署
    - 连接 GitHub 仓库
    - 设置 Root Directory 为 backend
    - 配置环境变量
    - 绑定自定义域名（api.384866.xyz）
    - 配置 Cron Jobs
    - _Requirements: 11.1, 11.2, 11.7_
  
  - [ ] 18.3 配置 Cloudflare DNS
    - 添加 CNAME 记录（@ → cname.vercel-dns.com）
    - 添加 CNAME 记录（www → cname.vercel-dns.com）
    - 添加 CNAME 记录（api → xxx.up.railway.app）
    - 配置 SSL/TLS 为 Full (strict)
    - _Requirements: 11.7_
  
  - [ ] 18.4 配置监控和告警
    - 配置 Sentry（前端 + 后端）
    - 启用 Vercel Analytics
    - 配置 Railway Metrics
    - 配置告警通知（Slack/Email）
    - _Requirements: 11.8_

- [ ] 19. 文档编写
  - [ ] 19.1 更新 README.md
    - 项目介绍
    - 功能特性
    - 技术栈
    - 本地开发指南
    - 部署指南
    - _Requirements: All_
  
  - [ ] 19.2 编写 API 文档
    - 使用 FastAPI 自动生成 OpenAPI 文档
    - 添加端点描述和示例
    - _Requirements: All_
  
  - [ ] 19.3 编写用户指南
    - 如何使用系统优化提示词
    - 如何理解 57 个框架
    - 如何管理版本
    - 如何升级到 Pro
    - _Requirements: All_

- [ ] 20. Final Checkpoint - 生产环境部署
  - 运行完整的部署检查清单
  - 验证所有功能在生产环境正常工作
  - 确认监控和告警配置正确
  - 询问用户是否准备好发布

## Notes

- 任务按照前端优先的顺序组织
- 前端开发完成并验证后，再开始后端开发
- 每个 Checkpoint 任务用于验证阶段性成果
- 所有任务都引用了具体的需求编号，确保可追溯性
- 测试任务贯穿整个开发过程，确保代码质量
- 部署任务在最后，确保所有功能完成后再部署
