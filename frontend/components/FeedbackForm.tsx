'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useToastStore } from '@/lib/stores/toastStore';

interface FeedbackFormProps {
  userId: string;
}

export default function FeedbackForm({ userId }: FeedbackFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent) {
      addToast('请输入反馈内容', 'error');
      return;
    }

    if (trimmedContent.length > 2000) {
      addToast('反馈内容不能超过 2000 字符', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.submitFeedback(userId, trimmedContent);
      addToast(result.message || '感谢您的反馈！', 'success');
      setContent(''); // 清空输入框
    } catch (error) {
      console.error('提交反馈失败:', error);
      addToast('提交反馈失败，请稍后重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2">💬 欢迎留下您的宝贵意见</h2>
      <p className="text-sm text-gray-500 mb-4">
        您的每一条建议都会被认真阅读，帮助我们改进产品
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="请输入您的反馈意见、功能建议或使用体验..."
        className="w-full border border-gray-300 rounded-lg p-3 resize-y min-h-[120px] max-h-[400px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isSubmitting}
      />

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          {content.length} / 2000 字符
        </span>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            isSubmitting || !content.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? '提交中...' : '提交反馈'}
        </button>
      </div>
    </div>
  );
}
