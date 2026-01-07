/**
 * Supabase Auth Callback 路由
 * 处理 OAuth 登录后的回调
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // 如果有错误，重定向到首页并显示错误
  if (error) {
    console.error('Auth callback 错误:', error, error_description);
    return NextResponse.redirect(
      `${requestUrl.origin}/?error=${encodeURIComponent(error_description || error)}`
    );
  }

  // 如果有授权码，交换为会话
  if (code) {
    const supabase = createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('交换会话失败:', exchangeError);
      return NextResponse.redirect(
        `${requestUrl.origin}/?error=${encodeURIComponent('登录失败，请重试')}`
      );
    }
  }

  // 登录成功后重定向到首页
  return NextResponse.redirect(`${requestUrl.origin}/`);
}
