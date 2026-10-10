import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
  showTagline = false
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Futuristic Geometric Symbol Container with Chrome & Electric Blue Glow */}
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className="relative shrink-0 rounded-xl bg-black border border-slate-700/80 p-0.5 shadow-[0_0_20px_rgba(0,212,255,0.25)] ring-1 ring-cyan-400/30 overflow-hidden flex items-center justify-center group"
      >
        {/* Subtle dynamic chrome lighting flare */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-white/5 to-transparent pointer-events-none" />
        
        {/* User's Exact Geometric Brand Logo */}
        <img
          src="/brand-logo.jpg"
          alt="Ishant Macro Data Logo"
          className="w-full h-full object-contain filter contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Fallback SVG in case image hasn't loaded yet
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>

      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-sans font-bold tracking-wider text-foreground text-sm sm:text-base uppercase flex items-center gap-1.5">
              <span>ISHANT</span>
              <span className="text-muted-foreground font-semibold">MACRO DATA</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold border border-primary/40 shadow-glow">
                AI
              </span>
            </span>
          </div>

          {showTagline && (
            <p className="text-[10px] sm:text-[11px] font-sans text-muted-foreground font-medium tracking-wide">
              See the Flow. Read the Market. Trade with Clarity.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
