'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ClarificationModal, { Framework, ClarificationAnswers } from '@/components/ClarificationModal';
import OptimizingModal from '@/components/OptimizingModal';
import Toast from '@/components/Toast';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ModelSelector from '@/components/ModelSelector';
import LoginModal from '@/components/LoginModal';
import UserDropdown from '@/components/UserDropdown';
import { validateInputLength, validateFileType, validateFileSize, formatFileSize } from '@/lib/utils';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { useModelStore } from '@/lib/stores/modelStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { apiClient } from '@/lib/api/client';

export default function InputPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const { selectedModel, setSelectedModel } = useModelStore();
  const { isAuthenticated, user } = useAuthStore();
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      setAttachment(null);
      return;
    }

    if (!validateFileType(file)) {
      showToast('仅支持 .txt, .md, .pdf 格式的文件', 'error');
      setAttachment(null);
      return;
    }

    if (!validateFileSize(file)) {
      showToast('文件大小不能超过 5MB', 'error');
      setAttachment(null);
      return;
    }

    setAttachment(file);
    showToast('文件上传成功', 'success');
  };

  const handleRemoveFile = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOptimize = async () => {
    // 检查是否登录
    if (!isAuthenticated) {
      setShowLoginModal(true);
      showToast('请先登录后再使用优化功能', 'info');
      return;
    }

    if (!validateInputLength(input)) {
      showToast('请输入至少 10 个字符', 'error');
      return;
    }

    setIsLoading(true);
    setIsOptimizing(true); // 显示小鸟加载动画
    
    try {
      const response = await apiClient.matchFrameworks({
        input,
        user_type: 'free',
        model: selectedModel,
      });

      if (response.frameworks && response.frameworks.length > 0) {
        setFrameworks(response.frameworks);
        setIsOptimizing(false); // 隐藏小鸟加载动画
        setIsModalOpen(true);
        showToast(`找到 ${response.frameworks.length} 个推荐框架`, 'success');
      } else {
        setIsOptimizing(false);
        showToast('未找到合适的框架，请尝试更详细的描述', 'error');
      }
    } catch (error) {
      console.error('Framework matching error:', error);
      setIsOptimizing(false);
      showToast(
        error instanceof Error ? error.message : '框架匹配失败，请稍后重试',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSubmit = async (answers: ClarificationAnswers) => {
    try {
      setIsLoading(true);
      setIsOptimizing(true); // 显示小鸟加载动画
      setIsModalOpen(false); // 关闭追问弹窗
      
      const selectedFramework = frameworks.find(f => f.id === answers.frameworkId);
      if (selectedFramework) {
        localStorage.setItem('selectedFramework', JSON.stringify(selectedFramework));
      }
      localStorage.setItem('clarificationAnswers', JSON.stringify({
        goalClarity: answers.goalClarity,
        targetAudience: answers.targetAudience,
        contextCompleteness: answers.contextCompleteness,
        formatRequirements: answers.formatRequirements,
        constraints: answers.constraints,
      }));
      
      const response = await apiClient.generatePrompt({
        input,
        framework_id: answers.frameworkId,
        clarification_answers: {
          goalClarity: answers.goalClarity,
          targetAudience: answers.targetAudience,
          contextCompleteness: answers.contextCompleteness,
          formatRequirements: answers.formatRequirements,
          constraints: answers.constraints,
        },
        user_id: user?.id || 'dev-user-001',
        account_type: user?.accountType || 'free',
        model: selectedModel,
      });
      
      setIsOptimizing(false); // 隐藏小鸟加载动画
      
      localStorage.setItem('currentPrompt', response.output);
      localStorage.setItem('originalInput', input);
      localStorage.setItem('frameworkUsed', response.framework_used);
      localStorage.setItem('versionId', response.version_id);
      
      showToast('提示词生成成功！', 'success');
      
      setTimeout(() => {
        router.push('/workspace');
      }, 800);
    } catch (error) {
      console.error('Prompt generation error:', error);
      setIsOptimizing(false);
      showToast(
        error instanceof Error ? error.message : '提示词生成失败，请稍后重试',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (validateInputLength(input) && !isLoading) {
        handleOptimize();
      }
    }
  };

  const charCount = input.trim().length;
  const isValid = validateInputLength(input);

  if (!isClient) {
    return <LoadingSkeleton />;
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#1a2332]">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 小鸟加载弹窗 */}
      <OptimizingModal isOpen={isOptimizing} />

      {/* Modal */}
      <ClarificationModal
        frameworks={frameworks}
        isOpen={isModalOpen}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
      />

      {/* 顶部导航 */}
      <nav className="relative z-50 px-6 py-6 bg-[#242d3d] border-b border-[#3d4a5c]">
        <div className="flex items-center justify-between">
          {/* 左侧 Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Prompt Optimizer
            </span>
          </div>

          {/* 右侧按钮组 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">返回</span>
            </button>
            
            {/* 登录状态：显示用户下拉菜单，未登录：显示登录按钮 */}
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 主内容区 - ChatGPT 风格 */}
      <div className="relative z-10 flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 88px)' }}>
        <div className="w-full max-w-3xl px-4">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              输入一句话需求
            </h2>
            <p className="text-lg text-gray-400">
              简单、自然地描述你想要的 Prompt
            </p>
          </div>

          {/* 输入框容器 - 深色主题 */}
          <div className="bg-[#242d3d] rounded-2xl shadow-xl border border-[#3d4a5c] overflow-visible">
            {/* 附件显示区域 */}
            {attachment && (
              <div className="px-6 pt-4 pb-2 border-b border-[#3d4a5c]">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a2332] rounded-xl border border-[#3d4a5c]">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-sm font-medium text-gray-300">{attachment.name}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                  <button
                    onClick={handleRemoveFile}
                    className="ml-1 p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* 输入区域 */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="例如：帮我写一个关于产品营销的提示词..."
                rows={1}
                className="w-full px-6 py-5 text-gray-200 placeholder-gray-500 resize-none focus:outline-none text-base bg-transparent"
                style={{ minHeight: '60px', maxHeight: '300px' }}
              />
            </div>

            {/* 底部工具栏 - 深色主题 */}
            <div className="px-6 py-3 bg-[#1a2332] border-t border-[#3d4a5c] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* 附件按钮 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-gray-400 hover:text-purple-400 hover:bg-[#242d3d] rounded-xl transition-all"
                  title="上传附件"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                {/* 模型选择器 */}
                <div className="w-48 relative z-50">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                  />
                </div>

                {/* 字符计数 */}
                <span className={`text-xs font-medium ${charCount < 10 ? 'text-gray-500' : 'text-purple-400'}`}>
                  {charCount} / 最少 10
                </span>
              </div>

              {/* 发送按钮 - 优化圆角 */}
              <button
                onClick={handleOptimize}
                disabled={!isValid || isLoading}
                className="p-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              按 <kbd className="px-2 py-1 bg-[#242d3d] rounded border border-[#3d4a5c] text-xs text-gray-300">Enter</kbd> 发送，
              <kbd className="px-2 py-1 bg-[#242d3d] rounded border border-[#3d4a5c] text-xs text-gray-300">Shift + Enter</kbd> 换行
            </p>
          </div>
        </div>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
}
