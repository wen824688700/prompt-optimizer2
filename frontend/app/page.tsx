'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import FeaturesSection from '@/components/FeaturesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGetStarted = () => {
    setIsAnimating(true);
    setTimeout(() => {
      router.push('/input');
    }, 600);
  };

  if (!isClient) {
    return <LoadingSkeleton />;
  }

  return (
    <main className={`min-h-screen relative transition-opacity duration-600 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Hero Section - 首屏 */}
      <div className="relative overflow-hidden">
        {/* 统一背景颜色 */}
        <div className="absolute inset-0 bg-slate-900">
          {/* 动态光晕效果 */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

        {/* 顶部导航区域 */}
        <div className="relative z-20 px-6 py-6 flex items-center justify-between">
          {/* 左侧 Logo 和导航链接 */}
          <div className="flex items-center gap-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="Prompt Optimizer Logo" 
                className="w-10 h-10 rounded-xl shadow-lg"
              />
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Prompt Optimizer
              </span>
            </div>
            
            {/* 导航链接 */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => {
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                功能
              </button>
              <button
                onClick={() => {
                  document.getElementById('testimonials-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                用户案例
              </button>
              <button
                onClick={() => {
                  document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                常见问题
              </button>
            </nav>
          </div>

          {/* 右侧登录/注册按钮 */}
          <button
            onClick={() => router.push('/account')}
            className="px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 animate-fade-in"
          >
            登录 / 注册
          </button>
        </div>

        {/* 内容区域 */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 pb-32">
          {/* 主标题 */}
          <h1 className="text-5xl sm:text-7xl font-bold text-center mb-6 animate-fade-in-up" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300">
              Prompt Optimizer
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-xl sm:text-2xl text-gray-300 text-center max-w-2xl mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            把"一句话需求"变成专业 Prompt
          </p>

          <p className="text-base sm:text-lg text-gray-400 text-center max-w-xl mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            输入你的想法 → 选择框架 → 自动生成高质量的 Markdown Prompt，并支持迭代优化与版本管理
          </p>

          {/* CTA 按钮 - 居中显示 */}
          <div className="flex justify-center mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handleGetStarted}
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                开始优化
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
            </button>
          </div>

          {/* 小标签 - 紧凑设计 */}
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
              <span className="text-lg">💎</span>
              <span className="text-sm text-gray-300">专业级输出</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
              <span className="text-lg">🎯</span>
              <span className="text-sm text-gray-300">智能框架匹配</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
              <span className="text-lg">🌐</span>
              <span className="text-sm text-gray-300">适用各大行业</span>
            </div>
          </div>
        </div>
      </div>

      {/* 核心功能展示区 */}
      <FeaturesSection />

      {/* 用户评价区 */}
      <TestimonialsSection />

      {/* FAQ 常见问题 */}
      <FAQSection />

      {/* 页脚 */}
      <Footer />

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </main>
  );
}
