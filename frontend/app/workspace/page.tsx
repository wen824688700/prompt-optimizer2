'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditorPanel from '@/components/EditorPanel';
import MarkdownTab from '@/components/MarkdownTab';
import VersionHistory from '@/components/VersionHistory';
import VersionComparison from '@/components/VersionComparison';
import UserAvatar from '@/components/UserAvatar';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/authStore';

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

type ViewMode = 'editor' | 'comparison';

export default function WorkspacePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [outputContent, setOutputContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [editorContent, setEditorContent] = useState('');
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>();
  const [currentTopic, setCurrentTopic] = useState<string>(''); // 当前工作流的主题
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false); // 编辑区折叠状态

  // 计算下一个版本号（基于当前 topic 的版本）
  const getNextVersionNumber = (type: 'save' | 'optimize'): string => {
    // 过滤出当前 topic 的版本
    const topicVersions = versions.filter(v => v.topic === currentTopic);
    
    if (topicVersions.length === 0) return '1.0';
    
    const latestVersion = topicVersions[0]; // 最新版本
    const [major, minor] = latestVersion.versionNumber.split('.').map(Number);
    
    if (type === 'optimize') {
      // 优化生成：小版本号递增 (1.0 -> 1.1 -> 1.2)
      return `${major}.${minor + 1}`;
    } else {
      // 手动保存：大版本号递增 (1.x -> 2.0, 2.x -> 3.0)
      return `${major + 1}.0`;
    }
  };

  // 从数据库或 localStorage 加载初始数据
  useEffect(() => {
    const loadVersions = async () => {
      try {
        // 1. 尝试从 localStorage 加载临时数据（首次生成后跳转过来的情况）
        const savedPrompt = localStorage.getItem('currentPrompt');
        const originalInput = localStorage.getItem('originalInput');
        
        if (savedPrompt && originalInput) {
          // 首次生成后跳转过来，直接显示内容，不需要再保存
          // 因为 generatePrompt API 已经保存过了
          setOutputContent(savedPrompt);
          setEditorContent(originalInput);
          
          // 设置当前主题（用于过滤版本）
          const topic = originalInput.slice(0, 20) + (originalInput.length > 20 ? '...' : '');
          setCurrentTopic(topic);
          
          // 清理 localStorage
          localStorage.removeItem('currentPrompt');
          localStorage.removeItem('originalInput');
          
          // 从数据库加载版本历史（包含刚才保存的版本）
          const userId = user?.id || 'dev-user-001';
          const dbVersions = await apiClient.getVersions(userId, 20);
          
          if (dbVersions && dbVersions.length > 0) {
            const mappedVersions: Version[] = dbVersions.map(v => ({
              id: v.id,
              content: v.content,
              type: v.type,
              createdAt: v.created_at,
              versionNumber: v.version_number || '1.0',
              description: v.description,
              topic: v.topic,
              framework_id: v.framework_id,
              framework_name: v.framework_name,
              original_input: v.original_input,
            }));
            
            // 只显示当前 topic 的版本
            const topicVersions = mappedVersions.filter(v => v.topic === topic);
            setVersions(topicVersions);
            if (topicVersions.length > 0) {
              setCurrentVersionId(topicVersions[0].id);
            }
          }
        } else {
          // 2. 从数据库加载版本历史
          const userId = user?.id || 'dev-user-001';
          const dbVersions = await apiClient.getVersions(userId, 20);
          
          if (dbVersions && dbVersions.length > 0) {
            const mappedVersions: Version[] = dbVersions.map(v => ({
              id: v.id,
              content: v.content,
              type: v.type,
              createdAt: v.created_at,
              versionNumber: v.version_number || '1.0',
              description: v.description,
              topic: v.topic,
              framework_id: v.framework_id,
              framework_name: v.framework_name,
              original_input: v.original_input,
            }));
            
            // 显示所有版本（用户直接访问 workspace 页面的情况）
            setVersions(mappedVersions);
            // 恢复最新版本
            const latestVersion = mappedVersions[0];
            setOutputContent(latestVersion.content);
            setCurrentVersionId(latestVersion.id);
            setCurrentTopic(latestVersion.topic || '');
            if (latestVersion.original_input) {
              setEditorContent(latestVersion.original_input);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load versions:', error);
        // 不显示错误提示，静默失败
      }
    };
    
    loadVersions();
  }, [user?.id]);

  const handleRegenerate = async (content: string) => {
    setIsLoading(true);
    try {
      const savedFramework = localStorage.getItem('selectedFramework');
      const savedAnswers = localStorage.getItem('clarificationAnswers');
      
      if (!savedFramework || !savedAnswers) {
        console.error('Missing framework or clarification answers');
        alert('缺少必要的信息，请返回首页重新开始');
        setIsLoading(false);
        return;
      }

      const framework = JSON.parse(savedFramework);
      const answers = JSON.parse(savedAnswers);
      const userId = user?.id || 'dev-user-001';

      const data = await apiClient.generatePrompt({
        input: content,
        framework_id: framework.id,
        clarification_answers: answers,
        user_id: userId,
        account_type: user?.accountType || 'free',
        model: 'deepseek', // 添加 model 参数
      });

      const newContent = data.output;
      setOutputContent(newContent);
      
      // 生成 topic
      const topic = currentTopic || content.slice(0, 10);
      
      // 保存新版本到数据库
      const savedVersion = await apiClient.saveVersion({
        user_id: userId,
        content: newContent,
        type: 'optimize',
        version_number: getNextVersionNumber('optimize'),
        description: '重新优化生成',
        topic: topic,
        framework_id: framework.id,
        framework_name: framework.name,
        original_input: content,
      });
      
      const newVersion: Version = {
        id: savedVersion.id,
        content: savedVersion.content,
        type: savedVersion.type,
        createdAt: savedVersion.created_at,
        versionNumber: savedVersion.version_number || getNextVersionNumber('optimize'),
        description: savedVersion.description,
        topic: savedVersion.topic,
        framework_id: savedVersion.framework_id,
        framework_name: savedVersion.framework_name,
        original_input: savedVersion.original_input,
      };
      
      setVersions(prev => [newVersion, ...prev]);
      setCurrentVersionId(newVersion.id);
    } catch (error) {
      console.error('Failed to regenerate:', error);
      alert(`重新生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = (content: string) => {
    setEditorContent(content);
    setViewMode('editor');
  };

  const handleSave = async (content: string) => {
    try {
      const savedFramework = localStorage.getItem('selectedFramework');
      const framework = savedFramework ? JSON.parse(savedFramework) : null;
      const userId = user?.id || 'dev-user-001';
      
      // 保存到数据库（使用当前 topic）
      const savedVersion = await apiClient.saveVersion({
        user_id: userId,
        content,
        type: 'save',
        version_number: getNextVersionNumber('save'),
        description: '手动保存',
        topic: currentTopic, // 使用当前 topic
        framework_id: framework?.id,
        framework_name: framework?.name,
        original_input: editorContent,
      });
      
      const newVersion: Version = {
        id: savedVersion.id,
        content: savedVersion.content,
        type: savedVersion.type,
        createdAt: savedVersion.created_at,
        versionNumber: savedVersion.version_number || getNextVersionNumber('save'),
        description: savedVersion.description,
        topic: savedVersion.topic,
        framework_id: savedVersion.framework_id,
        framework_name: savedVersion.framework_name,
        original_input: savedVersion.original_input,
      };
      
      setVersions(prev => [newVersion, ...prev]);
      setCurrentVersionId(newVersion.id);
    } catch (error) {
      console.error('Failed to save version:', error);
      alert(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleSelectVersion = (versionId: string) => {
    if (selectedVersionIds.includes(versionId)) {
      // 取消选择
      const newSelected = selectedVersionIds.filter(id => id !== versionId);
      setSelectedVersionIds(newSelected);
      if (newSelected.length < 2) {
        setViewMode('editor');
        setIsEditorCollapsed(false); // 恢复编辑区
      }
    } else {
      // 选择版本
      if (selectedVersionIds.length < 2) {
        const newSelected = [...selectedVersionIds, versionId];
        setSelectedVersionIds(newSelected);
        
        // 如果选择了两个版本，切换到对比模式并折叠编辑区
        if (newSelected.length === 2) {
          setViewMode('comparison');
          setIsEditorCollapsed(true); // 自动折叠编辑区
        } else {
          // 单个版本，显示在编辑器
          const version = versions.find(v => v.id === versionId);
          if (version) {
            setOutputContent(version.content);
            setCurrentVersionId(version.id);
            setViewMode('editor');
            setIsEditorCollapsed(false);
          }
        }
      } else {
        // 已经选择了两个，替换第二个
        const newSelected = [selectedVersionIds[0], versionId];
        setSelectedVersionIds(newSelected);
        setViewMode('comparison');
        setIsEditorCollapsed(true); // 保持折叠状态
      }
    }
  };

  // 切换编辑区折叠状态
  const toggleEditorCollapse = () => {
    if (isEditorCollapsed) {
      // 展开编辑区，退出对比模式
      setIsEditorCollapsed(false);
      setViewMode('editor');
      setSelectedVersionIds([]);
      // 恢复最新版本到输出区
      if (versions.length > 0) {
        setOutputContent(versions[0].content);
        setCurrentVersionId(versions[0].id);
      }
    } else {
      // 折叠编辑区（只在对比模式下有效）
      if (viewMode === 'comparison') {
        setIsEditorCollapsed(true);
      }
    }
  };

  const handleRestoreVersion = (version: Version) => {
    setOutputContent(version.content);
    setEditorContent(version.content);
    setCurrentVersionId(version.id);
    setSelectedVersionIds([]);
    setViewMode('editor');
  };

  const handleUpdateVersionNumber = (versionId: string, newVersionNumber: string) => {
    setVersions(prev => prev.map(v => 
      v.id === versionId ? { ...v, versionNumber: newVersionNumber } : v
    ));
  };

  const handleMerge = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setOutputContent(version.content);
      setCurrentVersionId(version.id);
      setSelectedVersionIds([]);
      setViewMode('editor');
    }
  };

  const handleRevert = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setOutputContent(version.content);
      setEditorContent(version.content);
      setCurrentVersionId(version.id);
      setSelectedVersionIds([]);
      setViewMode('editor');
    }
  };

  // 获取对比的两个版本
  const comparisonVersions = selectedVersionIds.length === 2
    ? {
        old: versions.find(v => v.id === selectedVersionIds[0]),
        new: versions.find(v => v.id === selectedVersionIds[1]),
      }
    : null;

  return (
    <div className="min-h-screen bg-[#1a2332]">
      {/* 顶部导航 */}
      <nav className="bg-[#242d3d] border-b border-[#3d4a5c] sticky top-0 z-50">
        <div className="px-6 py-4">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">首页</span>
              </button>
              
              {/* 根据认证状态显示不同按钮 */}
              {isAuthenticated && user ? (
                <button
                  onClick={() => router.push('/account')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a2332] hover:bg-[#242d3d] rounded-xl transition-colors border border-[#3d4a5c]"
                  title="账户设置"
                >
                  <UserAvatar user={user} size="sm" />
                  <span className="text-sm text-gray-300 font-medium">{user.name || user.email}</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push('/account')}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
                >
                  登录 / 注册
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 - 三栏布局 */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* 左侧：版本历史 */}
        <div className="w-64 border-r border-[#3d4a5c] bg-[#1a2332]">
          <VersionHistory
            versions={versions}
            currentVersionId={currentVersionId}
            selectedVersionIds={selectedVersionIds}
            onSelectVersion={handleSelectVersion}
            onRestoreVersion={handleRestoreVersion}
            onUpdateVersionNumber={handleUpdateVersionNumber}
          />
        </div>

        {/* 中间：编辑器（可折叠） */}
        <div 
          className={`border-r border-[#3d4a5c] transition-all duration-300 ease-in-out ${
            isEditorCollapsed ? 'w-0 overflow-hidden' : 'flex-1'
          }`}
        >
          <EditorPanel
            initialContent={editorContent}
            onRegenerate={handleRegenerate}
            isLoading={isLoading}
          />
        </div>

        {/* 折叠按钮 */}
        <div className="relative w-0">
          <button
            onClick={toggleEditorCollapse}
            className={`
              absolute top-1/2 -translate-y-1/2 -translate-x-1/2
              w-8 h-16 bg-[#242d3d] border border-[#3d4a5c] 
              rounded-lg shadow-lg
              flex items-center justify-center
              hover:bg-[#2d3748] transition-all duration-200
              group z-10
              ${isEditorCollapsed ? 'hover:w-10' : ''}
            `}
            title={isEditorCollapsed ? '展开编辑区' : '折叠编辑区'}
          >
            <svg 
              className={`w-4 h-4 text-gray-400 group-hover:text-white transition-transform duration-200 ${
                isEditorCollapsed ? 'rotate-180' : ''
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
          </button>
        </div>

        {/* 右侧：输出区或对比区（自动扩展） */}
        <div className={`transition-all duration-300 ease-in-out ${
          isEditorCollapsed ? 'flex-[2]' : 'flex-1'
        }`}>
          {viewMode === 'comparison' && comparisonVersions?.old && comparisonVersions?.new ? (
            <VersionComparison
              oldVersion={comparisonVersions.old}
              newVersion={comparisonVersions.new}
              onMerge={handleMerge}
              onRevert={handleRevert}
            />
          ) : (
            <MarkdownTab
              content={outputContent}
              onModify={handleModify}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
