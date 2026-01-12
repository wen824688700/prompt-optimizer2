# 从 Git 历史中彻底删除敏感文件

Write-Host "WARNING: This will rewrite Git history!" -ForegroundColor Red
Write-Host "Press Ctrl+C to cancel, or any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Yellow
Write-Host ""

# 需要删除的文件和目录
$items = @(
    "test_resend_api.py",
    "test_production_api.py",
    "check_supabase_tables.py",
    "diagnose_email_auth.py",
    "docs/"
)

foreach ($item in $items) {
    Write-Host "Removing: $item" -ForegroundColor Cyan
    
    git filter-branch --force --index-filter `
        "git rm -rf --cached --ignore-unmatch $item" `
        --prune-empty --tag-name-filter cat -- --all
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK" -ForegroundColor Green
    } else {
        Write-Host "  FAILED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Cleaning up refs..." -ForegroundColor Yellow
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Force push: git push origin --force --all" -ForegroundColor Cyan
Write-Host "2. Revoke exposed API keys immediately!" -ForegroundColor Red
Write-Host ""
