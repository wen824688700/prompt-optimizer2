/**
 * 用户头像组件
 * 显示用户头像图片或首字母
 */
'use client';

interface UserAvatarProps {
  user: {
    name?: string;
    email: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  // 获取首字符
  const getInitial = () => {
    if (user.name) return user.name[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return '?';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-2xl',
  };

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name || user.email}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold ${className}`}>
      {getInitial()}
    </div>
  );
}
