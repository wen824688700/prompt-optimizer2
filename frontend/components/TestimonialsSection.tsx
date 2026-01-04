'use client';

export default function TestimonialsSection() {
  const testimonials = [
    {
      quote: '以前写 Prompt 要反复调试 10 多次，现在 3 分钟就能生成专业级的提示词，效率提升太明显了！',
      author: '张先生',
      role: '内容创作者',
      avatar: '👨‍💼'
    },
    {
      quote: '作为 AI 新手，我完全不懂什么是 Chain of Thought、RACEF，但 Prompt Optimizer 让我也能写出专业的提示词。',
      author: '李女士',
      role: '市场营销',
      avatar: '👩‍💼'
    },
    {
      quote: '版本管理功能太实用了，可以随时回滚到之前的版本，再也不怕改坏了。',
      author: '王先生',
      role: '产品经理',
      avatar: '👨‍💻'
    },
    {
      quote: '团队现在都在用 Prompt Optimizer，大家的 AI 使用效率提升了至少 50%。',
      author: '陈女士',
      role: '技术总监',
      avatar: '👩‍💻'
    }
  ];

  return (
    <section className="w-full bg-slate-900 py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-4">
          用户怎么说
        </h2>
        <p className="text-xl text-gray-400 text-center mb-16">
          来自真实用户的反馈
        </p>

        {/* 横向滚动卡片 */}
        <div className="overflow-x-auto pb-8 -mx-4 px-4">
          <div className="flex gap-6 min-w-max">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="w-80 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2"
              >
                {/* 引号 */}
                <div className="text-cyan-400 text-4xl mb-4">"</div>
                
                {/* 评价内容 */}
                <p className="text-gray-300 text-base leading-relaxed mb-6">
                  {testimonial.quote}
                </p>

                {/* 用户信息 */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 滚动提示 */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">← 左右滑动查看更多评价 →</p>
        </div>
      </div>
    </section>
  );
}
