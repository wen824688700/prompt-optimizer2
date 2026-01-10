'use client';

import { useMemo, useRef, useEffect } from 'react';

interface Version {
  id: string;
  content: string;
  type: 'save' | 'optimize';
  createdAt: string;
  description?: string;
  versionNumber?: string; // 添加版本号字段
}

interface VersionComparisonProps {
  oldVersion: Version;
  newVersion: Version;
  onMerge?: (versionId: string) => void;
  onRevert?: (versionId: string) => void;
}

interface DiffLine {
  type: 'added' | 'deleted' | 'unchanged';
  content: string;
  lineNumber: number;
}

export default function VersionComparison({
  oldVersion,
  newVersion,
  onMerge,
  onRevert,
}: VersionComparisonProps) {
  // 创建滚动容器的引用
  const oldPanelRef = useRef<HTMLDivElement>(null);
  const newPanelRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef<'old' | 'new' | null>(null);

  // 同步滚动处理
  useEffect(() => {
    const oldPanel = oldPanelRef.current;
    const newPanel = newPanelRef.current;

    if (!oldPanel || !newPanel) return;

    const handleOldScroll = () => {
      if (syncingRef.current === 'new') return;
      syncingRef.current = 'old';
      newPanel.scrollTop = oldPanel.scrollTop;
      setTimeout(() => {
        syncingRef.current = null;
      }, 50);
    };

    const handleNewScroll = () => {
      if (syncingRef.current === 'old') return;
      syncingRef.current = 'new';
      oldPanel.scrollTop = newPanel.scrollTop;
      setTimeout(() => {
        syncingRef.current = null;
      }, 50);
    };

    oldPanel.addEventListener('scroll', handleOldScroll);
    newPanel.addEventListener('scroll', handleNewScroll);

    return () => {
      oldPanel.removeEventListener('scroll', handleOldScroll);
      newPanel.removeEventListener('scroll', handleNewScroll);
    };
  }, []);

  // 简单的行级 diff 算法
  const { oldLines, newLines } = useMemo(() => {
    const oldContent = oldVersion.content.split('\n');
    const newContent = newVersion.content.split('\n');
    
    const oldDiff: DiffLine[] = [];
    const newDiff: DiffLine[] = [];
    
    let oldIndex = 0;
    let newIndex = 0;
    
    while (oldIndex < oldContent.length || newIndex < newContent.length) {
      const oldLine = oldContent[oldIndex];
      const newLine = newContent[newIndex];
      
      if (oldLine === newLine) {
        // 相同行
        oldDiff.push({ type: 'unchanged', content: oldLine, lineNumber: oldIndex + 1 });
        newDiff.push({ type: 'unchanged', content: newLine, lineNumber: newIndex + 1 });
        oldIndex++;
        newIndex++;
      } else if (oldIndex < oldContent.length && !newContent.includes(oldLine)) {
        // 删除的行
        oldDiff.push({ type: 'deleted', content: oldLine, lineNumber: oldIndex + 1 });
        oldIndex++;
      } else if (newIndex < newContent.length && !oldContent.includes(newLine)) {
        // 新增的行
        newDiff.push({ type: 'added', content: newLine, lineNumber: newIndex + 1 });
        newIndex++;
      } else {
        // 修改的行（视为删除+新增）
        if (oldIndex < oldContent.length) {
          oldDiff.push({ type: 'deleted', content: oldLine, lineNumber: oldIndex + 1 });
          oldIndex++;
        }
        if (newIndex < newContent.length) {
          newDiff.push({ type: 'added', content: newLine, lineNumber: newIndex + 1 });
          newIndex++;
        }
      }
    }
    
    return { oldLines: oldDiff, newLines: newDiff };
  }, [oldVersion.content, newVersion.content]);

  const formatVersionLabel = (version: Version) => {
    const date = new Date(version.createdAt);
    return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN')}`;
  };

  const renderDiffPanel = (
    lines: DiffLine[], 
    title: string, 
    version: Version, 
    panelRef: React.RefObject<HTMLDivElement>
  ) => (
    <div className="flex-1 flex flex-col bg-[#242d3d] rounded-lg border border-[#3d4a5c] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#1a2332] border-b border-[#3d4a5c] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-sm font-medium text-white ml-2">{title}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{formatVersionLabel(version)}</p>
        </div>
      </div>

      {/* Code Content - 添加 ref */}
      <div ref={panelRef} className="flex-1 overflow-auto font-mono text-sm">
        {lines.map((line, index) => (
          <div
            key={index}
            className={`
              flex items-start px-4 py-1
              ${line.type === 'deleted' ? 'bg-red-500/10 text-red-300' : ''}
              ${line.type === 'added' ? 'bg-green-500/10 text-green-300' : ''}
              ${line.type === 'unchanged' ? 'text-gray-400' : ''}
            `}
          >
            <span className="w-10 text-right mr-4 text-gray-600 select-none flex-shrink-0">
              {line.lineNumber}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-all">
              {line.content || ' '}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // 统计差异
  const stats = useMemo(() => {
    const added = newLines.filter(l => l.type === 'added').length;
    const deleted = oldLines.filter(l => l.type === 'deleted').length;
    return { added, deleted };
  }, [oldLines, newLines]);

  return (
    <div className="h-full flex flex-col bg-[#1a2332]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#3d4a5c]">
        <h2 className="text-lg font-semibold text-white mb-2">版本对比</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            对比 v{oldVersion.versionNumber || '1.0'} 和 v{newVersion.versionNumber || '1.0'}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-red-300">
              <span className="w-3 h-3 bg-red-500/30 rounded"></span>
              删除 {stats.deleted} 行
            </span>
            <span className="flex items-center gap-1 text-green-300">
              <span className="w-3 h-3 bg-green-500/30 rounded"></span>
              新增 {stats.added} 行
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Panels */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {renderDiffPanel(oldLines, `v${oldVersion.versionNumber || '1.0'} (旧版本)`, oldVersion, oldPanelRef)}
        {renderDiffPanel(newLines, `v${newVersion.versionNumber || '1.0'} (新版本)`, newVersion, newPanelRef)}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-[#3d4a5c] flex items-center justify-end gap-3">
        {onRevert && (
          <button
            onClick={() => onRevert(oldVersion.id)}
            className="px-4 py-2 bg-[#242d3d] text-gray-300 rounded-lg border border-[#3d4a5c] hover:bg-[#2d3748] transition-colors"
          >
            恢复到 v{oldVersion.versionNumber || '1.0'}
          </button>
        )}
        {onMerge && (
          <button
            onClick={() => onMerge(newVersion.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            合并
          </button>
        )}
      </div>
    </div>
  );
}
