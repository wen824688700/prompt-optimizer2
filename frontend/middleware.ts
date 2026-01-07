/**
 * Next.js Middleware
 * 用于刷新 Supabase Auth tokens
 */
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // 跳过 auth callback 路由，让它自己处理重定向
  if (request.nextUrl.pathname === '/auth/callback') {
    return;
  }
  
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon 文件)
     * - public 文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
