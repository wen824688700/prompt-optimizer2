/**
 * Supabase Server 客户端
 * 用于 Server Components 和 Route Handlers
 * 
 * 参考：https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // 在 Server Component 中调用时可能会失败
            // 这是预期行为，但在 Route Handler 中应该成功
            console.error('[Supabase Server] 设置 cookie 失败:', error);
          }
        },
      },
    }
  );
}
