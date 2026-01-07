/**
 * 认证回调 Route Handler（服务器端）
 * 处理 OAuth 登录后的回调 - PKCE 代码交换
 * 
 * 参考：https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  console.log('[Auth Callback Route] 处理回调:', { 
    code: code?.substring(0, 10), 
    error,
    origin 
  });

  // 如果有错误参数
  if (error) {
    console.error('[Auth Callback Route] OAuth 错误:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // 如果有授权码，交换为会话
  if (code) {
    try {
      const supabase = await createClient();
      
      // 在服务器端交换授权码为会话
      // 这会自动将会话保存到 Cookie 中
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[Auth Callback Route] 交换会话失败:', exchangeError);
        return NextResponse.redirect(
          `${origin}/?error=${encodeURIComponent('登录失败，请重试')}`
        );
      }

      console.log('[Auth Callback Route] 登录成功:', {
        userId: data.user?.id,
        email: data.user?.email,
      });

      // 成功后重定向到首页
      // 确保本地开发使用 HTTP，生产环境使用 HTTPS
      const forwardedProto = request.headers.get('x-forwarded-proto');
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      let redirectUrl: string;
      
      if (forwardedHost && forwardedProto) {
        // 反向代理环境（如 Vercel）
        redirectUrl = `${forwardedProto}://${forwardedHost}`;
      } else if (isLocalEnv) {
        // 本地开发环境，强制使用 HTTP
        redirectUrl = `http://localhost:3000`;
      } else {
        // 其他情况使用 origin
        redirectUrl = origin;
      }

      console.log('[Auth Callback Route] 重定向到:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    } catch (err) {
      console.error('[Auth Callback Route] 异常:', err);
      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent('登录处理失败')}`
      );
    }
  }

  // 如果既没有 code 也没有 error，直接返回首页
  console.warn('[Auth Callback Route] 缺少授权码和错误信息');
  return NextResponse.redirect(origin);
}
