'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getSiteUrl } from '@/lib/supabase/siteUrl';
import { useAuthStore } from '@/lib/stores/authStore';
import { useQuotaStore } from '@/lib/stores/quotaStore';
import { apiClient } from '@/lib/api/client';
import FeatureVoting from '@/components/FeatureVoting';
import FeedbackForm from '@/components/FeedbackForm';

export default function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const initAuth = useAuthStore((s) => s.initAuth);
  const { quota, setQuota } = useQuotaStore();
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);

  const nextPath = useMemo(() => searchParams.get('next') || '/input', [searchParams]);

  // 初始化认证状态
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 加载配额数据
  useEffect(() => {
    if (!user) return;

    const loadQuota = async () => {
      setIsLoadingQuota(true);
      try {
        const quotaData = await apiClient.getQuota(user.id, user.accountType);
        setQuota({
          used: quotaData.used,
          total: quotaData.total,
          resetTime: quotaData.reset_time,
          canGenerate: quotaData.can_generate,
        });
      } catch (error) {
        console.error('Failed to load quota:', error);
      } finally {
        setIsLoadingQuota(false);
      }
    };

    loadQuota();
  }, [user, setQuota]);

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
        <div className="max-w-4xl mx-auto px-4">
          {/* 产品状态说明 */}
          <div className="mb-6 text-sm text-gray-500">
            <p>🚀 当前处于测试阶段，所有用户每日可免费使用 10 次生成配额</p>
            <p>感谢您的使用，您的反馈将帮助我们打造更好的产品！</p>
          </div>

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

              {/* 功能投票区 */}
              <FeatureVoting userId={user.id} />

              {/* 反馈意见区 */}
              <FeedbackForm userId={user.id} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 未登录提示 */}
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

              {/* 测试：未登录也显示投票和反馈（使用测试用户 ID） */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-amber-800">
                  💡 测试模式：未登录用户也可以查看和测试投票反馈功能
                </p>
              </div>

              <FeatureVoting userId="test-user-anonymous" />
              <FeedbackForm userId="test-user-anonymous" />
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

