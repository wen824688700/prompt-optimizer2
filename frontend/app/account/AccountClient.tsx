'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getSiteUrl } from '@/lib/supabase/siteUrl';
import { useAuthStore } from '@/lib/stores/authStore';
import { useQuotaStore } from '@/lib/stores/quotaStore';

export default function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { quota } = useQuotaStore();
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

          {user ? (
            <div className="space-y-6">
              {/* 用户信息卡片 */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-500">已登录</div>
                      <div className="text-lg font-semibold text-gray-900 truncate">{user.email}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={isWorking}
                    className="px-4 py-2 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              </div>

              {/* 配额信息卡片 */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">使用配额</h2>
                
                <div className="space-y-4">
                  {/* 今日使用情况 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">今日已使用</span>
                      <span className="text-lg font-bold text-gray-900">
                        {quota?.used || 0} / {quota?.total || 10} 次
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(((quota?.used || 0) / (quota?.total || 10)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* 剩余次数 */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-cyan-50 rounded-xl">
                    <div>
                      <div className="text-sm text-gray-600">剩余次数</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {Math.max((quota?.total || 10) - (quota?.used || 0), 0)} 次
                      </div>
                    </div>
                    <div className="text-4xl">✨</div>
                  </div>

                  {/* 重置时间提示 */}
                  <div className="text-sm text-gray-500 text-center">
                    💡 配额每日 0:00 (UTC+8) 自动重置
                  </div>

                  {/* 升级提示 */}
                  {(quota?.used || 0) >= (quota?.total || 10) && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <div className="font-semibold text-amber-900">今日配额已用完</div>
                          <div className="text-sm text-amber-700 mt-1">
                            请明天再来，或升级到 Pro 版本获得更多配额（100次/天）
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 订阅信息卡片 */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">订阅计划</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
                    <div>
                      <div className="font-semibold text-gray-900">Free 免费版</div>
                      <div className="text-sm text-gray-600 mt-1">每日 10 次生成配额</div>
                    </div>
                    <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      当前计划
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-cyan-50 border-2 border-purple-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">Pro 专业版</div>
                        <div className="text-sm text-gray-600 mt-1">每日 100 次生成配额</div>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">$19/月</div>
                    </div>
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                      升级到 Pro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6">
              <div className="text-gray-900 font-semibold text-lg">登录 / 注册</div>
              <p className="text-gray-600 text-sm mt-1">使用 Google 登录查看账户详情。</p>
              <button
                onClick={handleGoogleLogin}
                disabled={isWorking}
                className="mt-5 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 disabled:opacity-60 transition-all"
              >
                使用 Google 登录
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
  );
}

