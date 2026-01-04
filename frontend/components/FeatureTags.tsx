'use client';

export default function FeatureTags() {
  const features = [
    {
      icon: '💎',
      title: '专业级输出',
      description: '基于57个验证框架',
      gradient: 'from-purple-400/20 to-purple-600/20',
      iconColor: 'text-purple-400'
    },
    {
      icon: '🎯',
      title: '智能框架匹配',
      description: 'AI自动推荐最佳方案',
      gradient: 'from-cyan-400/20 to-cyan-600/20',
      iconColor: 'text-cyan-400'
    },
    {
      icon: '🌐',
      title: '适用各大行业',
      description: '内容/代码/分析全覆盖',
      gradient: 'from-pink-400/20 to-pink-600/20',
      iconColor: 'text-pink-400'
    }
  ];

  return (
    <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full px-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
      {features.map((feature, index) => (
        <div
          key={index}
          className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2"
        >
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <span className="text-4xl">{feature.icon}</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
          <p className="text-sm text-gray-400">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
