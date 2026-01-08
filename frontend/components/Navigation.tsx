'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import LoginButton from './LoginButton';
import UserDropdown from './UserDropdown';

export default function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  const isActive = (path: string) => pathname === path;
  
  // 检查是否为开发模式
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center gap-2 group">
              <Image 
                src="/logo.jpg" 
                alt="Prompt Optimizer Logo" 
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg group-hover:scale-110 transition-transform"
              />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-cyan-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Prompt Optimizer
              </span>
              {/* 开发模式指示器 */}
              {isDevMode && (
                <span className="ml-2 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-md border border-yellow-300">
                  开发模式
                </span>
              )}
            </Link>
            <div className="ml-10 flex items-center space-x-2">
              <Link
                href="/"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                首页
              </Link>
              <Link
                href="/workspace"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/workspace')
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                工作台
              </Link>
              <Link
                href="/account"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/account')
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                账户
              </Link>
            </div>
          </div>
          
          {/* 登录按钮或用户下拉菜单 */}
          <div className="flex items-center">
            {isAuthenticated ? <UserDropdown /> : <LoginButton />}
          </div>
        </div>
      </div>
    </nav>
  );
}
