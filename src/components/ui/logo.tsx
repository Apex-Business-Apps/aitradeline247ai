import React from 'react';
import officialLogo from '@/assets/official-logo.svg';
import { cn } from '@/lib/utils';
interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
const sizeClasses = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12',
  xl: 'h-16'
};
const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-4xl'
};
export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className,
  ...props
}) => {
  const logoImage = <img src={officialLogo} alt="TradeLine 24/7 Logo" className={cn(sizeClasses[size], "w-auto")} />;
  const logoText;
  const logoIcon = <div className={cn(sizeClasses[size], "aspect-square bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center")}>
      <span className="text-white font-bold text-xl">TL</span>
    </div>;
  return <div className={cn("flex items-center gap-3", className)} {...props}>
      {variant === 'full' && <>
          {logoImage}
          {logoText}
        </>}
      {variant === 'icon' && logoIcon}
      {variant === 'text' && logoText}
    </div>;
};