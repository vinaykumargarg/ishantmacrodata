import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-1.5 font-medium transition-colors select-none rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 min-h-[30px]',
    md: 'text-xs px-3.5 py-1.5 min-h-[36px]',
    lg: 'text-sm px-4 py-2 min-h-[40px]',
  }[size];

  const variantStyles = {
    primary: 'bg-[#5b8cff] hover:bg-[#7aa2ff] text-white active:bg-[#4a7be8] shadow-sm',
    secondary: 'bg-[#1a2030] hover:bg-[#222a3c] text-[#e8ecf4] border border-white/10 active:bg-[#263046]',
    ghost: 'bg-transparent hover:bg-white/5 text-[#a7b0c3] hover:text-[#e8ecf4]',
    danger: 'bg-[#f0616d]/15 text-[#f0616d] border border-[#f0616d]/30 hover:bg-[#f0616d]/25',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};

export default Button;
