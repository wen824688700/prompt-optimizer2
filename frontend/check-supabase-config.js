/**
 * Supabase 配置检查脚本
 * 运行: node check-supabase-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查 Supabase 配置...\n');

// 读取 .env.local 文件
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ 错误：找不到 .env.local 文件');
  console.log('请创建 frontend/.env.local 文件');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

let supabaseUrl = '';
let supabaseKey = '';

lines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

console.log('📋 当前配置：');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// 检查是否是测试值
const isTestUrl = supabaseUrl.includes('test.supabase.co');
const isTestKey = supabaseKey === 'test-anon-key';

if (isTestUrl || isTestKey) {
  console.log('❌ 配置错误：你正在使用测试配置！\n');
  console.log('请按照以下步骤配置真实的 Supabase 凭据：\n');
  console.log('1. 访问 https://supabase.com/dashboard');
  console.log('2. 选择你的项目（或创建新项目）');
  console.log('3. 进入 Settings → API');
  console.log('4. 复制 "Project URL" 和 "anon public" key');
  console.log('5. 更新 frontend/.env.local 文件');
  console.log('6. 重启开发服务器\n');
  console.log('详细说明请查看：SUPABASE_SETUP.md\n');
  process.exit(1);
}

// 检查 URL 格式
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.log('⚠️  警告：Supabase URL 格式可能不正确');
  console.log('   正确格式：https://xxxxxxxxxxxxx.supabase.co\n');
}

// 检查 Key 格式
if (!supabaseKey.startsWith('eyJ')) {
  console.log('⚠️  警告：Supabase Key 格式可能不正确');
  console.log('   应该以 "eyJ" 开头（JWT 格式）\n');
}

console.log('✅ 配置看起来正常！\n');
console.log('下一步：');
console.log('1. 确保已配置 Google OAuth（参考 SUPABASE_SETUP.md）');
console.log('2. 运行: npm run dev');
console.log('3. 访问: http://localhost:3000');
console.log('4. 点击登录按钮测试\n');
