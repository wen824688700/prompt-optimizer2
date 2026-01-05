'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditorPanel from '@/components/EditorPanel';
import OutputTabs from '@/components/OutputTabs';
import MarkdownTab from '@/components/MarkdownTab';
import VersionsTab from '@/components/VersionsTab';

interface Version {
  id: string;
  content: string;
  type: 'save' | 'optimize';
  createdAt: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const [outputContent, setOutputContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [editorContent, setEditorContent] = useState('');

  // 从 localStorage 加载初始数据
  useEffect(() => {
    const savedPrompt = localStorage.getItem('currentPrompt');
    const originalInput = localStorage.getItem('originalInput');
    
    if (savedPrompt) {
      setOutputContent(savedPrompt);
      // 清除 localStorage 中的数据，避免刷新时重复加载
      localStorage.removeItem('currentPrompt');
    }
    
    if (originalInput) {
      setEditorContent(originalInput);
      localStorage.removeItem('originalInput');
    }
  }, []);

  const handleRegenerate = async (content: string) => {
    setIsLoading(true);
    try {
      // 从 localStorage 获取之前保存的框架和追问答案
      const savedFramework = localStorage.getItem('selectedFramework');
      const savedAnswers = localStorage.getItem('clarificationAnswers');
      
      if (!savedFramework || !savedAnswers) {
        console.error('Missing framework or clarification answers');
        // TODO: 使用 Toast 组件替代 alert
        alert('缺少必要的信息，请返回首页重新开始');
        setIsLoading(false);
        return;
      }

      const framework = JSON.parse(savedFramework);
      const answers = JSON.parse(savedAnswers);

      // 使用环境变量获取 API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      // 调用后端 API 重新生成
      const response = await fetch(`${apiUrl}/api/v1/prompts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: content,
          framework_id: framework.id,
          clarification_answers: answers,
          user_id: 'test_user',
          account_type: 'free',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '生成失败');
      }

      const data = await response.json();
      const newContent = data.output;
      setOutputContent(newContent);
      
      // 自动保存为新版本
      const newVersion: Version = {
        id: data.version_id,
        content: newContent,
        type: 'optimize',
        createdAt: new Date().toISOString(),
      };
      setVersions(prev => [newVersion, ...prev]);
    } catch (error) {
      console.error('Failed to regenerate:', error);
      // TODO: 使用 Toast 组件替代 alert
      alert(`重新生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = (content: string) => {
    setEditorContent(content);
  };

  const handleSave = (content: string) => {
    const newVersion: Version = {
      id: Date.now().toString(),
      content,
      type: 'save',
      createdAt: new Date().toISOString(),
    };
    setVersions(prev => [newVersion, ...prev]);
  };

  const handleViewVersion = (version: Version) => {
    setOutputContent(version.content);
  };

  const handleRollback = (version: Version) => {
    setOutputContent(version.content);
    setEditorContent(version.content);
  };

  const tabs = [
    {
      id: 'markdown',
      label: 'Markdown 原文',
      content: (
        <MarkdownTab
          content={outputContent}
          onModify={handleModify}
          onSave={handleSave}
        />
      ),
    },
    {
      id: 'versions',
      label: '版本记录',
      content: (
        <VersionsTab
          versions={versions}
          onViewVersion={handleViewVersion}
          onRollback={handleRollback}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-cyan-50/30">
      {/* 顶部导航 */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧 Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Prompt Optimizer
              </span>
            </div>

            {/* 右侧按钮组 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">首页</span>
              </button>
              <button
                onClick={() => router.push('/account')}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
              >
                登录 / 注册
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop: 5:5 split layout, Mobile: stacked layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] gap-4 p-4">
        {/* Left Editor Panel - 50% on desktop */}
        <div className="w-full lg:w-1/2 rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden">
          <EditorPanel
            initialContent={editorContent}
            onRegenerate={handleRegenerate}
            isLoading={isLoading}
          />
        </div>

        {/* Right Output Panel - 50% on desktop */}
        <div className="w-full lg:w-1/2 rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden">
          <OutputTabs tabs={tabs} defaultTab="markdown" />
        </div>
      </div>
    </div>
  );
}
