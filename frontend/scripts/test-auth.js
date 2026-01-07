/**
 * 认证配置测试脚本
 * 用于验证环境变量和 Supabase 配置是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查认证配置...\n');

// 读取环境变量
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const config = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    config[key.trim()] = values.join('=').trim();
  }
});

// 检查必需的环境变量
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
];

let hasErrors = false;

console.log('📋 环境变量检查：');
required.forEach(key => {
  if (config[key]) {
    console.log(`  ✅ ${key}: ${config[key].substring(0, 30)}...`);
  } else {
    console.log(`  ❌ ${key}: 未设置`);
    hasErrors = true;
  }
});

console.log('\n🌐 URL 配置检查：');

// 检查 SITE_URL 格式
const siteUrl = config['NEXT_PUBLIC_SITE_URL'];
if (siteUrl) {
  if (siteUrl.startsWith('http://') || siteUrl.startsWith('https://')) {
    console.log(`  ✅ SITE_URL 格式正确: ${siteUrl}`);
  } else {
    console.log(`  ❌ SITE_URL 格式错误，必须以 http:// 或 https:// 开头`);
    hasErrors = true;
  }

  // 检查是否包含端口号（本地开发）
  if (siteUrl.includes('localhost') && !siteUrl.includes(':3000')) {
    console.log(`  ⚠️  本地开发建议使用 http://localhost:3000`);
  }

  // 检查生产环境配置
  if (siteUrl.includes('prompt-optimizer.online')) {
    if (!siteUrl.startsWith('https://')) {
      console.log(`  ❌ 生产环境必须使用 HTTPS`);
      hasErrors = true;
    } else {
      console.log(`  ✅ 生产环境使用 HTTPS`);
    }
  }
}

console.log('\n📝 Supabase 配置检查：');

const supabaseUrl = config['NEXT_PUBLIC_SUPABASE_URL'];
if (supabaseUrl) {
  if (supabaseUrl.includes('.supabase.co')) {
    console.log(`  ✅ Supabase URL 格式正确`);
  } else {
    console.log(`  ❌ Supabase URL 格式错误`);
    hasErrors = true;
  }
}

const supabaseKey = config['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
if (supabaseKey) {
  if (supabaseKey.length > 100) {
    console.log(`  ✅ Supabase Anon Key 长度正常`);
  } else {
    console.log(`  ⚠️  Supabase Anon Key 长度异常，请检查`);
  }
}

console.log('\n🔐 回调 URL 配置：');
const callbackUrl = `${siteUrl}/auth/callback`;
console.log(`  📍 回调地址: ${callbackUrl}`);
console.log(`  ℹ️  请确保在 Supabase Dashboard 中添加此地址到 Redirect URLs`);

console.log('\n📚 需要在 Supabase 配置的地址：');
console.log(`  1. Site URL: ${siteUrl}`);
console.log(`  2. Redirect URLs: ${callbackUrl}`);

console.log('\n📚 需要在 Google Console 配置的地址：');
console.log(`  1. 授权的重定向 URI: ${supabaseUrl}/auth/v1/callback`);
console.log(`  2. 授权的 JavaScript 来源: ${siteUrl}`);

if (hasErrors) {
  console.log('\n❌ 发现配置错误，请修复后重试');
  process.exit(1);
} else {
  console.log('\n✅ 所有配置检查通过！');
  console.log('\n💡 下一步：');
  console.log('  1. 运行 npm run dev 启动开发服务器');
  console.log('  2. 访问 http://localhost:3000 测试登录');
  console.log('  3. 检查浏览器控制台是否有错误');
}
