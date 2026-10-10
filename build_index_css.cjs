const fs = require('fs');

const baseStyles = fs.readFileSync('lovable_styles.css', 'utf8');

const extraStyles = `
/* ============================================================
   TERMINAL ENHANCEMENTS & CUSTOM POLISH
   ============================================================ */

/* Sleek Terminal Scrollbar */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: rgba(13, 17, 23, 0.6);
}
::-webkit-scrollbar-thumb {
  background: #1e2a42;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #3b4c6e;
}

/* Continuous High-Performance Ticker Animation */
@keyframes ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-ticker {
  display: flex !important;
  width: max-content !important;
  animation: ticker 40s linear infinite !important;
  will-change: transform;
}
.animate-ticker:hover {
  animation-play-state: paused !important;
}

/* Glowing Indicator Dots */
@keyframes pulseGlow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.pulse-dot {
  animation: pulseGlow 2s ease-in-out infinite;
}

/* Glassmorphism & Panel Depth */
.panel {
  background: #13192a !important;
  border: 1px solid #1e2a42 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.5) !important;
}

.panel:hover {
  border-color: #2a3a5c !important;
}

.panel-glow {
  border-color: #f59e0b !important;
  box-shadow: 0 0 20px -4px rgba(245, 158, 11, 0.25) !important;
}

/* Color coordination tokens */
:root {
  --bull: #22c55e;
  --bear: #ef4444;
  --gold: #f59e0b;
  --border-color: #1e2a42;
  --bg-card: #13192a;
  --text-main: #f0f4f8;
  --text-muted: #8b9ab5;
}

.text-bull { color: #22c55e !important; }
.text-bear { color: #ef4444 !important; }
.text-gold { color: #f59e0b !important; }
.bg-bull { background-color: #22c55e !important; }
.bg-bear { background-color: #ef4444 !important; }
.bg-gold { background-color: #f59e0b !important; }

/* Subtle card headers */
.label-xs {
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  color: #8b9ab5 !important;
}

.num {
  font-family: 'JetBrains Mono', monospace !important;
  font-variant-numeric: tabular-nums !important;
}
`;

fs.writeFileSync('src/index.css', baseStyles + '\n' + extraStyles);
console.log('src/index.css updated successfully with full CSS system!');
