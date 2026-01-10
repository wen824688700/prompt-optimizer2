# 版本持久化功能部署清单

## 📋 部署前准备

### 1. 数据库迁移
- [ ] 登录 Supabase Dashboard
- [ ] 进入 SQL Editor
- [ ] 执行 `backend/migrations/create_versions_table.sql`
- [ ] 验证表创建成功：`SELECT * FROM versions LIMIT 1;`

### 2. 环境变量配置

#### Vercel 生产环境
- [ ] 登录 Vercel Dashboard
- [ ] 进入项目 Settings → Environment Variables
- [ ] 添加 `SUPABASE_URL`
- [ ] 添加 `SUPABASE_KEY` (使用 service_role key)
- [ ] 添加 `ENVIRONMENT=production`

#### 本地开发环境
- [ ] 在 `backend/.env` 中配置 Supabase 变量
- [ ] 设置 `ENVIRONMENT=development`

### 3. 代码检查
- [ ] 后端代码无语法错误
- [ ] 前端代码无语法错误
- [ ] 依赖已安装（`supabase==2.3.4`）

## 🚀 部署步骤

### 1. 提交代码
```bash
git add .
git commit -m "feat: 实现版本持久化功能"
git push origin main
```

### 2. 等待部署
- [ ] Vercel 自动部署完成
- [ ] 检查部署日志无错误

### 3. 验证部署
- [ ] 访问生产环境 URL
- [ ] 测试生成提示词
- [ ] 测试保存版本
- [ ] 刷新页面验证版本恢复

## ✅ 功能测试

### 基础功能
- [ ] 首次生成提示词
- [ ] 版本自动保存到数据库
- [ ] 刷新页面后版本恢复
- [ ] 版本历史显示正确

### 版本管理
- [ ] 重新生成创建新版本（小版本号递增）
- [ ] 手动保存创建新版本（大版本号递增）
- [ ] 版本数量限制生效（最多20个）
- [ ] 删除版本功能正常

### 数据验证
- [ ] 在 Supabase Table Editor 中查看数据
- [ ] 验证版本元数据完整
- [ ] 验证 RLS 策略生效

## 🧪 测试脚本

### 运行后端测试
```bash
cd backend
python test_version_persistence.py
```

预期结果：
- [ ] 所有测试通过
- [ ] 无错误信息

## 🔍 故障排查

### 如果版本没有保存
1. [ ] 检查浏览器控制台错误
2. [ ] 检查 Vercel 部署日志
3. [ ] 验证 Supabase 环境变量
4. [ ] 确认使用 service_role key

### 如果刷新后版本丢失
1. [ ] 确认 `ENVIRONMENT=production`
2. [ ] 检查数据库中是否有数据
3. [ ] 验证用户ID匹配

## 📊 性能检查

- [ ] 版本列表加载 < 1秒
- [ ] 保存版本响应 < 2秒
- [ ] 页面刷新恢复 < 2秒

## 🔒 安全检查

- [ ] RLS 策略生效
- [ ] 用户只能访问自己的版本
- [ ] Service Role Key 未泄露
- [ ] API 端点验证用户ID

## 📝 文档检查

- [ ] README 更新
- [ ] API 文档更新
- [ ] 部署文档完整

## ✨ 完成标志

当以下所有项都完成时，部署成功：

- ✅ 数据库迁移完成
- ✅ 环境变量配置正确
- ✅ 代码部署成功
- ✅ 所有功能测试通过
- ✅ 性能指标达标
- ✅ 安全检查通过

## 🎉 部署完成！

恭喜！版本持久化功能已成功部署到生产环境。

用户现在可以：
- 永久保存提示词版本
- 刷新页面后恢复历史
- 管理最多 20 个版本
- 安全地访问自己的数据

---

**需要帮助？** 查看详细文档：
- `docs/VERSION_PERSISTENCE_QUICKSTART.md`
- `docs/VERSION_PERSISTENCE_DEPLOYMENT.md`
- `docs/VERSION_PERSISTENCE_IMPLEMENTATION.md`
