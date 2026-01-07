/**
 * 认证回调页面（客户端）
 * 处理 OAuth 登录后的回调
 */
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// 禁用静态生成，强制动态渲染
export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('[Auth Callback Page] 处理回调:', { code: code?.substring(0, 10), error: errorParam });

      // 如果有错误参数
      if (errorParam) {
        console.error('[Auth Callback Page] OAuth 错误:', errorParam, errorDescription);
        setError(errorDescription || errorParam);
        setTimeout(() => {
          router.push(`/?error=${encodeURIComponent(errorDescription || errorParam)}`);
        }, 2000);
        return;
      }

      // 如果没有 code
      if (!code) {
        console.warn('[Auth Callback Page] 缺少授权码');
        router.push('/');
        return;
      }

      try {
        const supabase = createClient();
        
        // 交换授权码为会话
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('[Auth Callback Page] 交换会话失败:', exchangeError);
          setError('登录失败，请重试');
          setTimeout(() => {
            router.push('/?error=' + encodeURIComponent('登录失败，请重试'));
          }, 2000);
          return;
        }

        console.log('[Auth Callback Page] 登录成功:', {
          userId: data.user?.id,
          email: data.user?.email,
        });

        // 成功后跳转到首页
        router.push('/');
      } catch (err) {
        console.error('[Auth Callback Page] 异常:', err);
        setError('登录处理失败');
        setTimeout(() => {
          router.push('/?error=' + encodeURIComponent('登录处理失败'));
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-8 max-w-md">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">登录失败</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <p className="text-gray-400 text-sm">正在返回首页...</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 max-w-md">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">正在登录...</h2>
            <p className="text-gray-300">请稍候，正在完成认证</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 主组件，使用 Suspense 包裹
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 max-w-md">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">正在加载...</h2>
            <p className="text-gray-300">请稍候</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
