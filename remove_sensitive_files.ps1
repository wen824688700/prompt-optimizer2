# 从 Git 历史中彻底删除包含敏感信息的文件

Write-Host "开始清理 Git 历史中的敏感文件..." -ForegroundColor Yellow
Write-Host ""

# 需要删除的文件列表
$files = @(
    "test_resend_api.py",
    "test_production_api.py",
    "check_supabase_tables.py",
    "diagnose_email_auth.py"
)

foreach ($file in $files) {
    Write-Host "正在删除: $file" -ForegroundColor Cyan
    
    # 使用 git filter-branch 删除文件
    git filter-branch --force --index-filter `
        "git rm --cached --ignore-unmatch $file" `
        --prune-empty --tag-name-filter cat -- --all
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 已从历史中删除: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ 删除失败: $file" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "清理 Git 引用..." -ForegroundColor Yellow
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "✓ Git 历史清理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host "1. 强制推送到远程仓库："
Write-Host "   git push origin --force --all" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Revoke exposed API Key immediately" -ForegroundColor Red
Write-Host "   - Visit https://resend.com/api-keys"
Write-Host "   - Delete old API Key"
Write-Host "   - Generate new API Key"
Write-Host "   - Update Vercel environment variables"
Write-Host ""
