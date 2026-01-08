'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackClient() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      // 尝试从 URL 中获取 code（可能在 query 或 hash 中）
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const code = params.get('code') || hashParams.get('code');
      
      console.log('[Auth Callback] URL:', window.location.href);
      console.log('[Auth Callback] Search params:', window.location.search);
      console.log('[Auth Callback] Hash:', window.location.hash);
      console.log('[Auth Callback] Code:', code);
      
      if (!code) {
        console.error('[Auth Callback] Missing OAuth code');
        setErrorMessage('Missing OAuth code. Please try logging in again.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[Auth Callback] Exchange failed:', error);
        setErrorMessage(error.message);
        return;
      }

      console.log('[Auth Callback] Login successful');
      const next = localStorage.getItem('postAuthRedirect') || '/';
      localStorage.removeItem('postAuthRedirect');
      router.replace(next);
    };

    void run();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-cyan-50/30 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 max-w-md w-full p-6">
        <h1 className="text-xl font-semibold text-gray-900">Signing you in…</h1>
        <p className="text-sm text-gray-600 mt-2">Please wait a moment.</p>
        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

