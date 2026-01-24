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
  onDeleteVersion?: (versionId: string) => void;
  onRenameVersion?: (versionId: string, newName: string) => void;
}

interface WorkflowGroup {
  workflow_id: string;
  topic: string;
  versions: Version[];
}

export default function VersionHistory({
  versions,
  currentVersionId,
  selectedVersionIds,
  onSelectVersion,
  onRestoreVersion,
  onDeleteVersion,
  onRenameVersion,
}: VersionHistoryProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [topicSummaries, setTopicSummaries] = useState<Map<string, string>>(new Map());

  // 导入 API 客户端
  const { apiClient } = require('@/lib/api/client');

  // 生成主题摘要
  const generateTopicSummary = async (topic: string, content: string) => {
    if (topicSummaries.has(topic)) {
      return topicSummaries.get(topic)!;
    }

    try {
      const response = await apiClient.generateSummary(content, 15);
      const summary = response.summary;
      setTopicSummaries(prev => new Map(prev).set(topic, summary));
      return summary;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      // 使用原始 topic 作为后备
      return topic;
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return '刚刚';
    }
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} 分钟前`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} 小时前`;
    }
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} 天前`;
    }
    return date.toLocaleDateString('zh-CN');
  };

  const getTypeLabel = (type: 'save' | 'optimize') => {
    return type === 'optimize' ? '优化生成' : '手动保存';
  };

  // 按 topic 分组
  const groupedVersions: WorkflowGroup[] = [];
  const workflowMap = new Map<string, WorkflowGroup>();

  // 去重：使用 Set 来跟踪已添加的版本 ID
  const addedVersionIds = new Set<string>();

  versions.forEach(version => {
    // 跳过重复的版本
    if (addedVersionIds.has(version.id)) {
      return;
    }
    addedVersionIds.add(version.id);

    const topic = version.topic || '未命名工作流';
    if (!workflowMap.has(topic)) {
      const group: WorkflowGroup = {
        workflow_id: topic,
        topic: topic,
        versions: [],
      };
      workflowMap.set(topic, group);
      groupedVersions.push(group);
    }
    workflowMap.get(topic)!.versions.push(version);
  });

  // 按最新版本时间排序
  groupedVersions.sort((a, b) => {
    const aLatest = new Date(a.versions[0].createdAt).getTime();
    const bLatest = new Date(b.versions[0].createdAt).getTime();
    return bLatest - aLatest;
  });

  // 每组内按时间排序
  groupedVersions.forEach(group => {
    group.versions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  const toggleGroup = (workflowId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(workflowId)) {
      newCollapsed.delete(workflowId);
    } else {
      newCollapsed.add(workflowId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const handleStartEdit = (versionId: string, currentName: string) => {
    setEditingVersionId(versionId);
    setEditingName(currentName);
  };

  const handleSaveEdit = (versionId: string) => {
    if (onRenameVersion && editingName.trim()) {
      onRenameVersion(versionId, editingName.trim());
    }
    setEditingVersionId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingVersionId(null);
    setEditingName('');
  };

  const handleDelete = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteVersion && confirm('确定要删除这个版本吗？')) {
      onDeleteVersion(versionId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a2332] text-gray-200">
      <div className="px-4 py-4 border-b border-[#3d4a5c]">
        <h2 className="text-lg font-semibold text-white">版本历史</h2>
        <p className="text-xs text-gray-400 mt-1">
          {selectedVersionIds.length === 2 ? '已选择 2 个版本进行对比' : '点击版本查看或选择两个版本对比'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groupedVersions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>暂无版本记录</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {groupedVersions.map((group) => {
              const isCollapsed = collapsedGroups.has(group.workflow_id);
              const latestVersion = group.versions[0];
              const displayTopic = topicSummaries.get(group.topic) || group.topic;
              
              // 异步生成摘要（如果还没有）
              if (!topicSummaries.has(group.topic) && latestVersion.content) {
                generateTopicSummary(group.topic, latestVersion.content);
              }
              
              return (
                <div key={group.workflow_id} className="bg-[#242d3d] rounded-lg border border-[#3d4a5c]">
                  <div
                    onClick={() => toggleGroup(group.workflow_id)}
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#2d3748] transition-colors"
                    title={latestVersion.original_input}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-white truncate">
                        📁 {displayTopic}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({group.versions.length})
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">
                      {formatTimestamp(latestVersion.createdAt)}
                    </span>
                  </div>

                  {!isCollapsed && (
                    <div className="border-t border-[#3d4a5c] p-2 space-y-1">
                      {group.versions.map((version) => {
                        const isSelected = selectedVersionIds.includes(version.id);
                        const isCurrent = version.id === currentVersionId;
                        
                        return (
                          <div
                            key={version.id}
                            onClick={() => onSelectVersion(version.id)}
                            className={`
                              group relative p-2 rounded-lg cursor-pointer transition-all
                              ${isSelected 
                                ? 'bg-blue-500/20 border border-blue-500' 
                                : 'hover:bg-[#1a2332]'
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="absolute top-2 left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}

                            <div className={`${isSelected ? 'ml-5' : ''}`}>
                              {/* 第一行：版本号 + 描述（或编辑输入框） */}
                              {editingVersionId === version.id ? (
                                <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-sm font-medium text-gray-400">v{version.versionNumber}</span>
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveEdit(version.id);
                                      } else if (e.key === 'Escape') {
                                        handleCancelEdit();
                                      }
                                    }}
                                    className="flex-1 px-2 py-1 text-sm bg-[#1a2332] border border-blue-500 rounded text-white focus:outline-none"
                                    placeholder="输入版本描述"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(version.id)}
                                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm font-medium text-gray-200 mb-1">
                                  v{version.versionNumber}  {version.description || '未命名版本'}
                                </p>
                              )}
                              
                              {/* 第二行：(当前) + 类型标签 + 编辑/删除按钮 */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {isCurrent && (
                                    <span className="text-xs text-green-400">(当前)</span>
                                  )}
                                  <span className={`
                                    px-2 py-0.5 text-xs rounded
                                    ${version.type === 'optimize' 
                                      ? 'bg-purple-500/20 text-purple-300' 
                                      : 'bg-green-500/20 text-green-300'
                                    }
                                  `}>
                                    {getTypeLabel(version.type)}
                                  </span>
                                </div>
                                {!isSelected && editingVersionId !== version.id && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onRenameVersion && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartEdit(version.id, version.description || '');
                                        }}
                                        className="p-1 hover:bg-blue-500/20 rounded text-blue-400"
                                        title="编辑名称"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                    )}
                                    {onDeleteVersion && (
                                      <button
                                        onClick={(e) => handleDelete(version.id, e)}
                                        className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                        title="删除版本"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* 第三行：内容预览 */}
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {version.content.substring(0, 80)}...
                              </p>

                              {!isSelected && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRestoreVersion(version);
                                  }}
                                  className="mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
