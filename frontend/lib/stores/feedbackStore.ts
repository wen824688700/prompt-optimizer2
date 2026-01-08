/**
 * 反馈和投票状态管理
 */
import { create } from 'zustand';

export interface FeatureOption {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  vote_count: number;
  is_voted: boolean;
  created_at: string;
}

interface FeedbackStore {
  // 状态
  options: FeatureOption[];
  selectedOptions: string[];
  isLoading: boolean;
  isSubmitting: boolean;

  // 操作
  setOptions: (options: FeatureOption[]) => void;
  toggleOption: (optionId: string) => void;
  setSelectedOptions: (optionIds: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  // 初始状态
  options: [],
  selectedOptions: [],
  isLoading: false,
  isSubmitting: false,

  // 操作
  setOptions: (options) => set({ options }),
  
  toggleOption: (optionId) =>
    set((state) => {
      const isSelected = state.selectedOptions.includes(optionId);
      
      if (isSelected) {
        // 取消选择
        return {
          selectedOptions: state.selectedOptions.filter((id) => id !== optionId),
        };
      } else {
        // 选择（最多 3 个）
        if (state.selectedOptions.length >= 3) {
          return state; // 不做任何改变
        }
        return {
          selectedOptions: [...state.selectedOptions, optionId],
        };
      }
    }),

  setSelectedOptions: (optionIds) => set({ selectedOptions: optionIds }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  
  reset: () =>
    set({
      options: [],
      selectedOptions: [],
      isLoading: false,
      isSubmitting: false,
    }),
}));
