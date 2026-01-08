'use client';

import { useEffect, useState } from 'react';
import { useFeedbackStore } from '@/lib/stores/feedbackStore';
import { apiClient } from '@/lib/api/client';
import { useToastStore } from '@/lib/stores/toastStore';

interface FeatureVotingProps {
  userId: string;
}

export default function FeatureVoting({ userId }: FeatureVotingProps) {
  const {
    options,
    selectedOptions,
    isLoading,
    isSubmitting,
    setOptions,
    toggleOption,
    setIsLoading,
    setIsSubmitting,
    setSelectedOptions,
  } = useFeedbackStore();

  const addToast = useToastStore((state) => state.addToast);
  const [hasVoted, setHasVoted] = useState(false);

  // 加载功能选项
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getFeatureOptions(userId);
        setOptions(data);
        
        // 设置用户已投票的选项
        const votedIds = data.filter((opt) => opt.is_voted).map((opt) => opt.id);
        setSelectedOptions(votedIds);
        setHasVoted(votedIds.length > 0);
      } catch (error) {
        console.error('加载功能选项失败:', error);
        addToast('加载功能选项失败', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, [userId, setOptions, setIsLoading, setSelectedOptions, addToast]);

  // 提交投票
  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) {
      addToast('请至少选择一个选项', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.submitVote(userId, selectedOptions);
      addToast(result.message || '投票提交成功！', 'success');
      setHasVoted(true);
      
      // 重新加载选项以更新投票数
      const data = await apiClient.getFeatureOptions(userId);
      setOptions(data);
    } catch (error) {
      console.error('提交投票失败:', error);
      addToast('提交投票失败，请稍后重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 计算进度条宽度
  const getProgressWidth = (voteCount: number) => {
    if (options.length === 0) return 0;
    const maxVotes = Math.max(...options.map((opt) => opt.vote_count), 1);
    return (voteCount / maxVotes) * 100;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-2">
        🗳️ 您最期待的新功能
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        最多选择 3 个（已选 {selectedOptions.length}/3）
      </p>

      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const isDisabled = !isSelected && selectedOptions.length >= 3;

          return (
            <div
              key={option.id}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
              onClick={() => !isDisabled && toggleOption(option.id)}
            >
              <div className="flex items-start gap-3">
                {/* 复选框 */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 mb-1">
                    {option.name}
                  </div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mb-2">
                      {option.description}
                    </div>
                  )}

                  {/* 投票进度条 */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300"
                        style={{ width: `${getProgressWidth(option.vote_count)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 font-medium min-w-[60px] text-right">
                      {option.vote_count} 票
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSubmitVote}
        disabled={isSubmitting || selectedOptions.length === 0}
        className={`mt-6 w-full py-3 rounded-lg font-medium transition-all ${
          isSubmitting || selectedOptions.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
        }`}
      >
        {isSubmitting ? '提交中...' : hasVoted ? '更新投票' : '提交投票'}
      </button>
    </div>
  );
}
