'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface TabContent {
  id: string;
  label: string;
  title: string;
  description: string;
  benefits: string[];
}

const tabsData: TabContent[] = [
  {
    id: 'chat',
    label: '聊天对话',
    title: 'AI助手高效解决各种任务',
    description: '将您的想法转化为精确的提示词，AI聊天助手机器人将生成出色的内容，解决各种任务。',
    benefits: [
      '自然语言交互，无需学习复杂语法',
      '智能理解上下文，多轮对话优化',
      '适用于内容创作、代码生成、数据分析等场景'
    ]
  },
  {
    id: 'optimize',
    label: '一键优化',
    title: '自动优化提示词，智能匹配最佳框架',
    description: '基于 57 个经过验证的 Prompt 工程框架（STAR、RISEN、COSTAR、RTF等），自动分析并优化您的提示词，让 AI 更准确理解您的需求。',
    benefits: [
      '智能匹配最适合的框架，无需手动选择',
      '自动补充缺失的关键信息（目标、受众、上下文、格式、约束）',
      '覆盖商业分析、技术开发、内容创作等多个领域',
      '提升 AI 响应质量 3-5 倍'
    ]
  },
  {
    id: 'version',
    label: '版本管理',
    title: '迭代优化，随时回溯',
    description: '保存每一次优化的历史版本，支持对比、回滚和继续优化，让提示词不断进化。',
    benefits: [
      '完整的版本历史记录，永不丢失',
      '一键回滚到任意版本',
      '支持版本对比和差异分析',
      '持续迭代，让提示词越来越精准'
    ]
  }
];

export default function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState<string>('chat');

  const currentTab = tabsData.find(tab => tab.id === activeTab) || tabsData[0];

  return (
    <div className="mt-20">
      {/* 整体容器 */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 md:p-12">
        {/* 选项卡导航 - 平铺展开 */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {tabsData.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-6 py-4 rounded-xl font-medium transition-all duration-300 border
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-transparent shadow-lg shadow-purple-500/30'
                  : 'bg-slate-800/50 text-gray-400 border-slate-700/50 hover:text-gray-300 hover:border-slate-600/50'
                }
              `}
            >
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* 左侧：说明区域 */}
          <div className="space-y-6">
            {/* 标题 */}
            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300">
              {currentTab.title}
            </h3>

            {/* 描述 */}
            <p className="text-lg text-gray-300 leading-relaxed">
              {currentTab.description}
            </p>

            {/* 核心价值点 */}
            <ul className="space-y-4">
              {currentTab.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  {/* UI 效果的 √ */}
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mt-0.5 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-gray-300 leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 右侧：图片展示区域 */}
          <div className="relative">
            <div className="relative aspect-[16/10] rounded-2xl border-2 border-slate-600/50 bg-slate-800/30 overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 shadow-xl">
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* 功能图片 */}
              <img 
                src={`/features/feature-${activeTab === 'chat' ? '1' : activeTab === 'optimize' ? '2' : '3'}.jpg`}
                alt={currentTab.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* 图片加载失败时的占位符 */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 opacity-0 group-hover:opacity-0 transition-opacity">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-cyan-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 装饰性光晕 */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-3xl blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
