const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// Replace import of DeeeprAiChartView with AiChartView
code = code.replace(
  "import DeeeprAiChartView from './components/DeeeprAiChartView';",
  "import AiChartView from './components/AiChartView';"
);

// Replace function AiChartView() { return <DeeeprAiChartView />; }
code = code.replace(
  /function AiChartView\(\)\s*\{\s*return <DeeeprAiChartView \/>;\s*\}/,
  "// AiChartView is imported directly from ./components/AiChartView"
);

// Mapping of hardcoded dark classes to Lovable semantic tokens
const replacements = [
  // Backgrounds
  { from: /bg-\[#13192a\]/g, to: 'bg-card' },
  { from: /bg-\[#0d1117\]\/60/g, to: 'bg-secondary/60' },
  { from: /bg-\[#0d1117\]\/40/g, to: 'bg-secondary/40' },
  { from: /bg-\[#0d1117\]/g, to: 'bg-secondary' },
  { from: /bg-\[#0c1426\]/g, to: 'bg-card' },
  { from: /bg-\[#575ecf\]\/15/g, to: 'bg-primary/10' },
  { from: /bg-\[#58a6ff\]\/15/g, to: 'bg-primary/15' },
  { from: /bg-\[#58a6ff\]\/20/g, to: 'bg-primary/20' },
  { from: /bg-\[#58a6ff\]/g, to: 'bg-primary' },
  { from: /bg-\[#3fb950\]\/15/g, to: 'bg-bull/15' },
  { from: /bg-\[#3fb950\]\/20/g, to: 'bg-bull/20' },
  { from: /bg-\[#3fb950\]/g, to: 'bg-bull' },
  { from: /bg-\[#f85149\]\/15/g, to: 'bg-bear/15' },
  { from: /bg-\[#f85149\]\/20/g, to: 'bg-bear/20' },
  { from: /bg-\[#f85149\]/g, to: 'bg-bear' },
  { from: /bg-\[#d29922\]\/15/g, to: 'bg-gold/15' },
  { from: /bg-\[#d29922\]/g, to: 'bg-gold' },

  // Borders
  { from: /border-\[#1e2a42\]\/60/g, to: 'border-border/60' },
  { from: /border-\[#1e2a42\]/g, to: 'border-border' },
  { from: /border-t-\[#d29922\]/g, to: 'border-t-gold' },
  { from: /border-\[#d29922\]\/50/g, to: 'border-gold/50' },
  { from: /border-\[#d29922\]/g, to: 'border-gold' },
  { from: /border-\[#58a6ff\]/g, to: 'border-primary' },
  { from: /border-\[#3fb950\]\/50/g, to: 'border-bull/50' },
  { from: /border-\[#3fb950\]/g, to: 'border-bull' },
  { from: /border-\[#f85149\]\/50/g, to: 'border-bear/50' },
  { from: /border-\[#f85149\]/g, to: 'border-bear' },
  { from: /divide-\[#1e2a42\]\/60/g, to: 'divide-border/60' },
  { from: /divide-\[#1e2a42\]/g, to: 'divide-border' },

  // Texts
  { from: /text-\[#8b949e\]/g, to: 'text-muted-foreground' },
  { from: /text-\[#c9d1d9\]/g, to: 'text-foreground' },
  { from: /text-\[#58a6ff\]/g, to: 'text-primary' },
  { from: /text-\[#3fb950\]/g, to: 'text-bull' },
  { from: /text-\[#f85149\]/g, to: 'text-bear' },
  { from: /text-\[#d29922\]/g, to: 'text-gold' },
  { from: /hover:text-white/g, to: 'hover:text-foreground' },
  { from: /text-white font-mono/g, to: 'text-foreground font-mono' },
  { from: /text-white font-sans/g, to: 'text-foreground font-sans' },
  { from: /text-white font-bold/g, to: 'text-foreground font-bold' },
  { from: /text-white font-semibold/g, to: 'text-foreground font-semibold' },
  { from: /text-white/g, to: 'text-foreground' },

  // Slate / Gray overrides that interfere with light mode
  { from: /bg-slate-900/g, to: 'bg-card' },
  { from: /border-slate-800/g, to: 'border-border' },
  { from: /text-slate-400/g, to: 'text-muted-foreground' },
  { from: /text-slate-300/g, to: 'text-foreground' }
];

for (const { from, to } of replacements) {
  code = code.replace(from, to);
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx semantic theme tokens replacement complete!');
