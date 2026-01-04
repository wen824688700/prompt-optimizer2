'use client';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 border-t border-white/10 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 单行链接 */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
          <a href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
            Privacy Policy
          </a>
          <span className="text-gray-600">·</span>
          <a href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
            Terms of Service
          </a>
          <span className="text-gray-600">·</span>
          <a href="mailto:support@384866.xyz" className="text-sm text-gray-400 hover:text-white transition-colors">
            Contact Us
          </a>
        </div>

        {/* 版权信息 */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2026 Prompt Optimizer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
