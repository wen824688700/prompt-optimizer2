/**
 * Google 登录按钮组件
 * 点击后打开登录弹窗
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/stores/authStore';
import { LogIn, LogOut, User } from 'lucide-react';
import LoginModal from './LoginModal';

export default function LoginButton() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
      >
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        加载中...
      </button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        {/* 用户信息 */}
        <div className="flex items-center gap-2">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name || user.email || 'User'}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          )}
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">
              {user.name || user.email || '用户'}
            </p>
            <p className="text-xs text-gray-500">
              {user.accountType === 'pro' ? 'Pro 用户' : '免费用户'}
            </p>
          </div>
        </div>

        {/* 登出按钮 */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">登出</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowLoginModal(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
      >
        <LogIn className="w-4 h-4" />
        登录
      </button>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
