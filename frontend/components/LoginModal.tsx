/**
 * 登录弹窗组件 - 邮箱验证码认证
 * 支持：登录、注册（验证码）、忘记密码（验证码）、Google 登录
 */
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { signInWithGoogle } from '@/lib/supabase';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/authStore';
import { useToastStore } from '@/lib/stores/toastStore';
import Link from 'next/link';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'login' | 'register' | 'forgot';
type Step = 'form' | 'verify';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('form');
  
  // 表单字段
  const [identifier, setIdentifier] = useState(''); // 邮箱或用户名（登录用）
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { setUser } = useAuthStore();
  const { addToast } = useToastStore();

  // 重置表单
  const resetForm = () => {
    setIdentifier('');
    setEmail('');
    setUsername('');
    setPassword('');
    setCode('');
    setStep('form');
    setCountdown(0);
  };

  // 切换模式
  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    resetForm();
  };

  // 关闭模态框
  const handleClose = () => {
    resetForm();
    setMode('login');
    onClose();
  };

  // 开始倒计时
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 登录
  const handleLogin = async () => {
    if (!identifier.trim()) {
      addToast('请输入邮箱或用户名', 'error');
      return;
    }

    if (!password || password.length < 6) {
      addToast('请输入密码（至少6个字符）', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.login(identifier.trim(), password);
      
      setUser({
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        accountType: response.user.accountType,
      });
      
      addToast('登录成功', 'success');
      handleClose();
      
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : '登录失败',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码（注册或忘记密码）
  const handleSendCode = async () => {
    if (mode === 'register') {
      if (!username.trim() || username.trim().length < 3) {
        addToast('请输入用户名（至少3个字符）', 'error');
        return;
      }

      if (!password || password.length < 6) {
        addToast('请输入密码（至少6个字符）', 'error');
        return;
      }
    }

    if (!email.trim() || !email.includes('@')) {
      addToast('请输入正确的邮箱地址', 'error');
      return;
    }

    if (!agreedToTerms) {
      addToast('请先同意服务条款和隐私政策', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiClient.sendVerificationCode(email.trim());
      
      addToast('验证码已发送，请查收邮件', 'success');
      setStep('verify');
      startCountdown();
      
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : '发送验证码失败',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // 验证验证码并注册
  const handleRegister = async () => {
    if (code.length !== 6) {
      addToast('请输入6位验证码', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.verifyCodeAndRegister(
        email.trim(),
        code,
        username.trim(),
        password
      );
      
      setUser({
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        accountType: response.user.accountType,
      });
      
      addToast('注册成功', 'success');
      handleClose();
      
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : '注册失败',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (code.length !== 6) {
      addToast('请输入6位验证码', 'error');
      return;
    }

    if (!password || password.length < 6) {
      addToast('请输入新密码（至少6个字符）', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiClient.resetPassword(email.trim(), code, password);
      
      addToast('密码重置成功，请使用新密码登录', 'success');
      switchMode('login');
      setIdentifier(email.trim());
      
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : '重置密码失败',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Google 登录
  const handleGoogleLogin = async () => {
    if (!agreedToTerms) {
      addToast('请先同意服务条款和隐私政策', 'error');
      return;
    }

    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Google 登录失败',
        'error'
      );
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleClose}
      />

      {/* 弹窗 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 pointer-events-auto animate-scale-in max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo 和标题 */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'login' ? '登录' : mode === 'register' ? '注册' : '忘记密码'}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === 'login' && '使用邮箱或用户名登录'}
              {mode === 'register' && step === 'form' && '创建您的账户'}
              {mode === 'register' && step === 'verify' && '输入验证码完成注册'}
              {mode === 'forgot' && step === 'form' && '重置您的密码'}
              {mode === 'forgot' && step === 'verify' && '输入验证码设置新密码'}
            </p>
          </div>

          {/* 模式切换标签（仅在表单步骤显示） */}
          {step === 'form' && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                注册
              </button>
            </div>
          )}

          {/* 表单内容 */}
          <div className="space-y-4">
            {/* 登录模式 */}
            {mode === 'login' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱或用户名
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="请输入邮箱或用户名"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading || !identifier.trim() || !password}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '登录中...' : '登录'}
                </button>
                
                <div className="text-center">
                  <button
                    onClick={() => switchMode('forgot')}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    忘记密码？
                  </button>
                </div>
              </>
            )}

            {/* 注册模式 - 步骤1：填写信息 */}
            {mode === 'register' && step === 'form' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                      setUsername(value);
                    }}
                    placeholder="请输入用户名"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    字母、数字、下划线，至少3个字符
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱地址"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    用于接收验证码
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    至少6个字符
                  </p>
                </div>

                <button
                  onClick={handleSendCode}
                  disabled={loading || !username.trim() || !email.trim() || !password || !agreedToTerms}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '发送中...' : '获取验证码'}
                </button>
              </>
            )}

            {/* 注册模式 - 步骤2：验证码 */}
            {mode === 'register' && step === 'verify' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    验证码
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        setCode(value);
                      }
                    }}
                    placeholder="请输入6位验证码"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                    maxLength={6}
                    onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && handleRegister()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    验证码已发送至 {email}
                  </p>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={loading || code.length !== 6}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '验证中...' : '完成注册'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => setStep('form')}
                    className="text-purple-600 hover:underline"
                  >
                    返回修改
                  </button>
                  
                  {countdown > 0 ? (
                    <span className="text-gray-500">{countdown}秒后可重新发送</span>
                  ) : (
                    <button
                      onClick={handleSendCode}
                      disabled={loading}
                      className="text-purple-600 hover:underline disabled:text-gray-400"
                    >
                      重新发送验证码
                    </button>
                  )}
                </div>
              </>
            )}

            {/* 忘记密码模式 - 步骤1：填写邮箱 */}
            {mode === 'forgot' && step === 'form' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入注册时使用的邮箱"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    我们将发送验证码到您的邮箱
                  </p>
                </div>

                <button
                  onClick={handleSendCode}
                  disabled={loading || !email.trim() || !agreedToTerms}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '发送中...' : '获取验证码'}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => switchMode('login')}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    返回登录
                  </button>
                </div>
              </>
            )}

            {/* 忘记密码模式 - 步骤2：验证码和新密码 */}
            {mode === 'forgot' && step === 'verify' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    验证码
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        setCode(value);
                      }
                    }}
                    placeholder="请输入6位验证码"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    验证码已发送至 {email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入新密码"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    maxLength={100}
                    onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && password && handleResetPassword()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    至少6个字符
                  </p>
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={loading || code.length !== 6 || !password}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '重置中...' : '重置密码'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => setStep('form')}
                    className="text-purple-600 hover:underline"
                  >
                    返回修改
                  </button>
                  
                  {countdown > 0 ? (
                    <span className="text-gray-500">{countdown}秒后可重新发送</span>
                  ) : (
                    <button
                      onClick={handleSendCode}
                      disabled={loading}
                      className="text-purple-600 hover:underline disabled:text-gray-400"
                    >
                      重新发送验证码
                    </button>
                  )}
                </div>
              </>
            )}

            {/* 分隔线（仅在登录模式或表单步骤显示） */}
            {(mode === 'login' || step === 'form') && (
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
                </div>
              </div>
            )}

            {/* Google 登录按钮（仅在登录模式或表单步骤显示） */}
            {(mode === 'login' || step === 'form') && (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-700 font-medium">
                  使用 Google 登录
                </span>
              </button>
            )}

            {/* 服务条款（仅在登录模式或表单步骤显示） */}
            {(mode === 'login' || step === 'form') && (
              <div className="mt-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    我已阅读并同意{' '}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-purple-600 hover:text-purple-700 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      使用条款
                    </Link>
                    {' '}和{' '}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-purple-600 hover:text-purple-700 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      隐私政策
                    </Link>
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
