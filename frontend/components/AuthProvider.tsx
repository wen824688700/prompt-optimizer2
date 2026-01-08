'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    // 使用 authStore 的 initAuth 方法，它会自动处理开发模式
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
}

