'use client';

import { useState } from 'react';

interface MarkdownTabProps {
  content: string;
  onModify: (content: string) => void;
  onSave: (content: string) => void;
}

export default function MarkdownTab({ content, onModify, onSave }: MarkdownTabProps) {
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showModifyHint, setShowModifyHint] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleModify = () => {
    onModify(content);
    setShowModifyHint(true);
    setTimeout(() => setShowModifyHint(false), 5000);
  };

  const handleSave = () => {
    onSave(content);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Action Buttons - 优化样式 */}
      <div className="px-6 py-4 border-b border-gray-100 flex gap-2 bg-gradient-to-r from-white to-purple-50/20">
        <button
          onClick={handleCopy}
          className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 font-medium hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制
        </button>
        <button
          onClick={handleModify}
          className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 font-medium hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          修改
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 font-medium hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          保存
        </button>
      </div>

      {/* Modify Hint - 优化样式 */}
      {showModifyHint && (
        <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-cyan-50 border-b border-purple-100">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            已将优化后的 Prompt 放入左侧，你可以直接编辑，或在末尾追加修改要求。
          </p>
        </div>
      )}

      {/* Markdown Content - 优化样式 */}
      <div className="flex-1 p-6 overflow-auto bg-gray-50/30">
        {content ? (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-sm bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              {content}
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-center">
              优化后的提示词将显示在这里...
            </p>
          </div>
        )}
      </div>

      {/* Top Center Toast Notifications - 优化样式 */}
      {showCopiedToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in z-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">复制成功</span>
        </div>
      )}

      {showSavedToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in z-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">保存成功</span>
        </div>
      )}
    </div>
  );
}
