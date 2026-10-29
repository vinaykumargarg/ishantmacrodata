import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 32,
  showText = false,
  showTagline = false
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Original Purple-Blue Gradient Square Logo with Yellow Lightning Bolt ⚡ */}
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className="relative shrink-0 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.45)] border border-purple-400/30 flex items-center justify-center overflow-hidden group"
      >
        <span className="text-amber-300 text-sm font-bold select-none drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] transition-transform duration-200 group-hover:scale-110">
          ⚡
        </span>
      </div>

      {showText && (
        <div className="min-w-0 flex flex-col justify-center">
          <span className="bg-gradient-to-r from-purple-300 via-indigo-200 to-pink-200 bg-clip-text text-transparent text-sm font-semibold leading-tight tracking-tight">
            Ishant Jakhenia
          </span>
          <span className="font-mono text-[9px] font-bold tracking-widest text-slate-300 uppercase leading-none mt-0.5">
            GLOBAL MACRO COMMAND CENTRE
          </span>
          {showTagline && (
            <p className="text-[10px] font-sans text-muted-foreground font-medium tracking-wide mt-1">
              Institutional Global Macro & Quantitative Trading Intelligence
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
