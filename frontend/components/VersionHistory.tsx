'use client';

import { useState } from 'react';

interface Version {
  id: string;
  content: string;
  type: 'save' | 'optimize';
  createdAt: string;
  description?: string;
  versionNumber: string;
  topic?: string;
  framework_id?: string;
  framework_name?: string;
  original_input?: string;
}

interface VersionHistoryProps {
  versions: Version[];
  currentVersionId?: string;
  selectedVersionIds: string[];
  onSelectVersion: (versionId: string) => void;
  onRestoreVersion: (version: Version) => void;
  onUpdateVersionNumber: (versionId: string, newVersionNumber: string) => void;
}

export default function VersionHistory({
  versions,
  currentVersionId,
  selectedVersionIds,
  onSelectVersion,
  onRestoreVersion,
  onUpdateVersionNumber,
}: VersionHistoryProps) {
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editingVersionNumber, setEditingVersionNumber] = useState('');

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    // 小于1小时
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} 分钟前`;
    }
    // 小于24小时
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} 小时前`;
    }
    // 小于7天
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} 天前`;
    }
    // 显示日期
    return date.toLocaleDateString('zh-CN');
  };

  const getTypeLabel = (type: 'save' | 'optimize') => {
    return type === 'save' ? '手动保存' : '优化生成';
  };

  const sortedVersions = [...versions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleStartEdit = (version: Version, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVersionId(version.id);
    setEditingVersionNumber(version.versionNumber);
  };

  const handleSaveEdit = (versionId: string) => {
    if (editingVersionNumber.trim()) {
      onUpdateVersionNumber(versionId, editingVersionNumber.trim());
    }
    setEditingVersionId(null);
  };

  const handleCancelEdit = () => {
    setEditingVersionId(null);
    setEditingVersionNumber('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, versionId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(versionId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a2332] text-gray-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#3d4a5c]">
        <h2 className="text-lg font-semibold text-white">版本历史</h2>
        <p className="text-xs text-gray-400 mt-1">
          {selectedVersionIds.length === 2 ? '已选择 2 个版本进行对比' : '点击版本查看或选择两个版本对比'}
        </p>
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto">
        {sortedVersions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>暂无版本记录</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sortedVersions.map((version) => {
              const isSelected = selectedVersionIds.includes(version.id);
              const isCurrent = version.id === currentVersionId;
              const isEditing = editingVersionId === version.id;
              
              return (
                <div
                  key={version.id}
                  onClick={() => !isEditing && onSelectVersion(version.id)}
                  className={`
                    group relative p-3 rounded-lg border cursor-pointer transition-all
                    ${isSelected 
                      ? 'bg-blue-500/20 border-blue-500' 
                      : 'bg-[#242d3d] border-[#3d4a5c] hover:border-[#4d5a6c]'
                    }
                  `}
                >
                  {/* 选中指示器 */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* 版本信息 */}
                  <div className={`${isSelected ? 'ml-6' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingVersionNumber}
                            onChange={(e) => setEditingVersionNumber(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, version.id)}
                            className="px-2 py-1 text-sm bg-[#1a2332] border border-purple-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(version.id)}
                            className="p-1 text-green-400 hover:text-green-300"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              v{version.versionNumber}
                              {isCurrent && <span className="ml-2 text-xs text-green-400">(当前)</span>}
                            </span>
                            <button
                              onClick={(e) => handleStartEdit(version, e)}
                              className="p-1 text-gray-400 hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(version.createdAt)}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`
                        px-2 py-0.5 text-xs rounded
                        ${version.type === 'optimize' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-gray-500/20 text-gray-300'
                        }
                      `}>
                        {getTypeLabel(version.type)}
                      </span>
                      {version.topic && (
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-300 line-clamp-1 max-w-[150px]" title={version.topic}>
                          {version.topic}
                        </span>
                      )}
                    </div>

                    {/* 内容预览 */}
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {version.content.substring(0, 80)}...
                    </p>

                    {/* 操作按钮 */}
                    {!isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreVersion(version);
                        }}
                        className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        恢复此版本
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
