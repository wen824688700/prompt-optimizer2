'use client';

export default function FeaturesSection() {
  const comparisonItems = [
    { traditional: '不知道怎么写', optimized: 'AI 智能匹配框架' },
    { traditional: '反复调试 10+ 次', optimized: '3 分钟生成完成' },
    { traditional: '质量不稳定', optimized: '专业级输出质量' },
    { traditional: '无法保存历史', optimized: '版本管理 + 回滚' }
  ];

  const featureCards = [
    {
      icon: '🎯',
      title: '智能框架匹配',
      description: 'AI 自动分析您的需求，从 57 个经过验证的 Prompt 工程框架中智能推荐最合适的 1-3 个方案',
      gradient: 'from-cyan-500/10 to-cyan-600/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      icon: '💬',
      title: '交互式追问',
      description: '通过 5 个标准化问题深入理解需求：目标清晰度、目标受众、上下文完整性、格式要求、约束条件',
      gradient: 'from-purple-500/10 to-purple-600/10',
      borderColor: 'border-purple-500/20'
    },
    {
      icon: '🔄',
      title: '迭代优化',
      description: '支持多轮对话式改进，自动保存版本历史，一键回滚到任意版本，让优化过程可追溯',
      gradient: 'from-pink-500/10 to-pink-600/10',
      borderColor: 'border-pink-500/20'
    }
  ];

  return (
    <section id="features-section" className="w-full bg-slate-900 py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-4">
          为什么选择 Prompt Optimizer？
        </h2>
        <p className="text-xl text-gray-400 text-center mb-16">
          告别低效的 Prompt 编写方式
        </p>

        {/* 左右对比图 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* 传统方式 */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">❌</span>
              <h3 className="text-2xl font-bold text-white">传统方式</h3>
            </div>
            <ul className="space-y-4">
              {comparisonItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-gray-300">{item.traditional}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 使用我们 */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">✅</span>
              <h3 className="text-2xl font-bold text-white">使用我们</h3>
            </div>
            <ul className="space-y-4">
              {comparisonItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-1">✓</span>
                  <span className="text-gray-300">{item.optimized}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featureCards.map((card, index) => (
            <div
              key={index}
              className={`group bg-gradient-to-br ${card.gradient} border ${card.borderColor} rounded-2xl p-6 hover:scale-105 transition-all duration-300`}
            >
              <div className="text-5xl mb-4">{card.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
