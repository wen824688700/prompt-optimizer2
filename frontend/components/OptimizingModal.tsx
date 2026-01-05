'use client';

import { useEffect, useState } from 'react';

interface OptimizingModalProps {
  isOpen: boolean;
}

export default function OptimizingModal({ isOpen }: OptimizingModalProps) {
  const [birdPosition, setBirdPosition] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setBirdPosition((prev) => (prev + 1) % 100);
    }, 30);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"></div>

      {/* 弹窗内容 */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full mx-4 animate-scale-in">
        {/* 天空背景 */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-white"></div>
          
          {/* 云朵装饰 */}
          <div className="absolute top-8 left-8 w-20 h-8 bg-white/60 rounded-full blur-sm animate-float"></div>
          <div className="absolute top-16 right-12 w-16 h-6 bg-white/50 rounded-full blur-sm animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-24 left-1/3 w-24 h-10 bg-white/40 rounded-full blur-sm animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* 内容区域 */}
        <div className="relative z-10">
          {/* 小鸟飞行动画 */}
          <div className="relative h-32 mb-8">
            <div
              className="absolute transition-all duration-300 ease-linear"
              style={{
                left: `${birdPosition}%`,
                top: `${Math.sin(birdPosition * 0.1) * 20 + 40}px`,
                transform: 'translateX(-50%)',
              }}
            >
              {/* 小鸟 SVG */}
              <svg
                className="w-16 h-16 animate-flap"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* 身体 */}
                <ellipse cx="32" cy="32" rx="16" ry="12" fill="#FFD93D" />
                
                {/* 翅膀 */}
                <g className="wing-left">
                  <path
                    d="M20 28 Q12 20, 16 16 Q20 20, 20 28"
                    fill="#FFA500"
                    className="animate-wing-flap"
                  />
                </g>
                <g className="wing-right">
                  <path
                    d="M44 28 Q52 20, 48 16 Q44 20, 44 28"
                    fill="#FFA500"
                    className="animate-wing-flap"
                    style={{ animationDelay: '0.1s' }}
                  />
                </g>
                
                {/* 眼睛 */}
                <circle cx="28" cy="30" r="2" fill="#000" />
                <circle cx="36" cy="30" r="2" fill="#000" />
                
                {/* 嘴巴 */}
                <path d="M32 34 L28 36 L32 36 L36 36 Z" fill="#FF6B35" />
                
                {/* 腮红 */}
                <ellipse cx="24" cy="34" rx="3" ry="2" fill="#FFB6C1" opacity="0.6" />
                <ellipse cx="40" cy="34" rx="3" ry="2" fill="#FFB6C1" opacity="0.6" />
              </svg>
            </div>
          </div>

          {/* 文字提示 */}
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-gray-800 animate-pulse">
              正在优化中...
            </h3>
            <p className="text-gray-600">
              AI 正在为你匹配最佳框架 ✨
            </p>
            
            {/* 加载点动画 */}
            <div className="flex justify-center gap-2 pt-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes flap {
          0%, 100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }

        @keyframes wing-flap {
          0%, 100% {
            transform: rotateX(0deg);
          }
          50% {
            transform: rotateX(60deg);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-flap {
          animation: flap 0.5s ease-in-out infinite;
        }

        .animate-wing-flap {
          animation: wing-flap 0.3s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
