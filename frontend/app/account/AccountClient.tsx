'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getSiteUrl } from '@/lib/supabase/siteUrl';
import { useAuthStore } from '@/lib/stores/authStore';

export default function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextPath = useMemo(() => searchParams.get('next') || '/input', [searchParams]);

  const handleGoogleLogin = async () => {
    setIsWorking(true);
    setErrorMessage(null);
    try {
      localStorage.setItem('postAuthRedirect', nextPath);
      const redirectTo = `${getSiteUrl()}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Login failed');
      setIsWorking(false);
    }
  };

  const handleLogout = async () => {
    setIsWorking(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Logout failed');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-cyan-50/30">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Prompt Optimizer
              </span>
            </div>

            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="font-medium">首页</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">账号</h1>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
            {user ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={user.avatar || '/logo.jpg'}
                    alt="User avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">Signed in as</div>
                    <div className="text-lg font-semibold text-gray-900 truncate">{user.email}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isWorking}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-60"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div>
                <div className="text-gray-900 font-semibold text-lg">登录 / 注册</div>
                <p className="text-gray-600 text-sm mt-1">使用 Google 登录。</p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isWorking}
                  className="mt-5 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 disabled:opacity-60"
                >
                  Continue with Google
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

