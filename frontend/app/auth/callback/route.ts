/**
 * Supabase 认证回调路由
 * Google 登录后会重定向到这里
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('认证失败:', error);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }
  }

  // 认证成功，重定向到指定页面或首页
  return NextResponse.redirect(`${origin}${next}`);
}
