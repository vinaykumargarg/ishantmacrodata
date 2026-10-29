import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'positive' | 'negative' | 'warning' | 'info' | 'neutral' | 'gold';
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider',
    md: 'text-[11px] px-2.5 py-0.5 tracking-wide',
  }[size];

  const variantStyles = {
    positive: 'bg-[#2ebd85]/12 text-[#2ebd85] border border-[#2ebd85]/30',
    negative: 'bg-[#f0616d]/12 text-[#f0616d] border border-[#f0616d]/30',
    warning: 'bg-[#e8b04a]/12 text-[#e8b04a] border border-[#e8b04a]/30',
    info: 'bg-[#5b8cff]/12 text-[#5b8cff] border border-[#5b8cff]/30',
    neutral: 'bg-white/5 text-[#a7b0c3] border border-white/10',
    gold: 'bg-[#d4a94c]/14 text-[#d4a94c] border border-[#d4a94c]/30',
  }[variant];

  const dotColor = {
    positive: 'bg-[#2ebd85]',
    negative: 'bg-[#f0616d]',
    warning: 'bg-[#e8b04a]',
    info: 'bg-[#5b8cff]',
    neutral: 'bg-[#a7b0c3]',
    gold: 'bg-[#d4a94c]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium uppercase tabular-nums select-none ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`size-1.5 rounded-full ${dotColor} shrink-0`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
