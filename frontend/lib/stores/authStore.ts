import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '../supabase/client';
import { signInWithGoogle, signOut as supabaseSignOut } from '../supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  avatar: string;
  accountType: 'free' | 'pro';
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
  updateAccountType: (accountType: 'free' | 'pro') => void;
}

// 将 Supabase User 转换为应用 User
function mapSupabaseUser(supabaseUser: SupabaseUser, accountType: 'free' | 'pro' = 'free'): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || '',
    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
    accountType,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

      // 登出
      logout: async () => {
        try {
          await supabaseSignOut();
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('登出失败:', error);
          throw error;
        }
      },

      // 初始化认证状态
      initAuth: async () => {
        try {
          const supabase = createClient();
          
          // 获取当前会话
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const user = mapSupabaseUser(session.user);
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }

          // 监听认证状态变化
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const user = mapSupabaseUser(session.user, get().user?.accountType || 'free');
              set({ user, isAuthenticated: true, isLoading: false });
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          });
        } catch (error) {
          console.error('初始化认证失败:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      // 更新账户类型（订阅后调用）
      updateAccountType: (accountType) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, accountType } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
