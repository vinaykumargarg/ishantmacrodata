import React, { useState, useEffect } from 'react';

interface IshantMacroPortalViewProps {
  onLaunchTerminal: (tabId?: string) => void;
}

export const IshantMacroPortalView: React.FC<IshantMacroPortalViewProps> = ({
  onLaunchTerminal
}) => {
  // Rotating typewriter prompt
  const typewriterPhrases = [
    'why is gold bullish today?',
    'is bitcoin breaking out of its 4H range?',
    'what is the Fed doing with net liquidity?',
    'how to capture 2,000–3,000 points on BTC swings?',
    'is the banking system under credit stress?'
  ];

  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSignalTab, setActiveSignalTab] = useState<'gold' | 'btc'>('gold');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Typewriter effect
  useEffect(() => {
    const current = typewriterPhrases[phraseIdx];
    let timer: any;

    if (!isDeleting && displayText.length < current.length) {
      timer = setTimeout(() => {
        setDisplayText(current.substring(0, displayText.length + 1));
      }, 55);
    } else if (!isDeleting && displayText.length === current.length) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2200);
    } else if (isDeleting && displayText.length > 0) {
      timer = setTimeout(() => {
        setDisplayText(current.substring(0, displayText.length - 1));
      }, 30);
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setPhraseIdx((prev) => (prev + 1) % typewriterPhrases.length);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIdx]);

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 font-sans selection:bg-rose-500 selection:text-white relative overflow-x-hidden">
      {/* ── BACKGROUND AURA GLOWS ── */}
      <div className="fixed top-[-100px] left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-[30%] right-[-100px] w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-[10%] left-[-100px] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* ────────────────── TOP NAVIGATION ────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#06080e]/85 border-b border-[#172036] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => onLaunchTerminal('global-score')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white font-black text-xs shadow-md shadow-rose-500/30 group-hover:scale-105 transition-transform">
              IM
            </div>
            <span className="text-lg font-black tracking-tight text-white flex items-center">
              IshantMacro<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">.Ai</span>
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-300">
            <a href="#features" className="hover:text-cyan-300 transition-colors">AI Features</a>
            <a href="#tradeai" className="hover:text-cyan-300 transition-colors">TradeAI</a>
            <a href="#explore" className="hover:text-cyan-300 transition-colors">Explore</a>
            <a href="#how" className="hover:text-cyan-300 transition-colors">How it works</a>
            <a href="#access" className="hover:text-cyan-300 transition-colors">Access</a>
            <a href="#faq" className="hover:text-cyan-300 transition-colors">FAQ</a>
          </div>

          {/* Action CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchTerminal('global-score')}
              className="px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🚀</span>
              <span>Launch Terminal</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ────────────────── 1. HERO SECTION (PHOTO 1) ────────────────── */}
      <header className="relative pt-16 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-7">
        {/* Eyebrow Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#11192e] border border-cyan-500/30 text-[11px] font-extrabold uppercase tracking-widest text-cyan-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>AI-POWERED GLOBAL MACRO COMMAND CENTRE</span>
        </div>

        {/* Big Bold Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08]">
          Trade the world's macro story,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300">
            decoded by AI.
          </span>
        </h1>

        {/* Typewriter Rotator */}
        <div className="h-7 flex items-center justify-center font-mono text-xs sm:text-sm font-bold text-cyan-400">
          <span>&gt; {displayText}</span>
          <span className="w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          IshantMacro.Ai fuses live markets, central-bank intelligence, liquidity plumbing and geopolitics into one engine — then tells you, in plain language, what's bullish, what's bearish, and <strong className="text-white">why</strong>.
        </p>

        {/* Dual Call To Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={() => onLaunchTerminal('global-score')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>Explore the Terminal — Free</span>
          </button>
          <button
            onClick={() => onLaunchTerminal('ultra-ai')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-extrabold text-slate-200 bg-[#0f172a]/80 hover:bg-[#1e293b] border border-[#2e3e5c] hover:border-slate-400 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>⚡</span>
            <span>Unlock TradeAI Signals</span>
          </button>
        </div>

        {/* 5 Trust Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 text-[11px] font-bold text-slate-400">
          <span className="px-3 py-1 rounded-full bg-[#0d1527] border border-[#1d2b48]">📊 18 intelligence dashboards</span>
          <span className="px-3 py-1 rounded-full bg-[#0d1527] border border-[#1d2b48]">🧠 31-factor confluence engine</span>
          <span className="px-3 py-1 rounded-full bg-[#0d1527] border border-[#1d2b48]">📡 Live Binance & metals feeds</span>
          <span className="px-3 py-1 rounded-full bg-[#0d1527] border border-[#1d2b48]">📈 Free TradingView charts</span>
          <span className="px-3 py-1 rounded-full bg-[#0d1527] border border-[#1d2b48]">🇮🇳 Built for High-Performance Traders</span>
        </div>

        {/* Live Market Pulse Bottom Ticker (Photo 1 bottom) */}
        <div className="mt-8 rounded-2xl bg-[#090f20] border border-[#192748] p-3 text-left shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-[#192748] text-[10px] font-mono text-slate-400 px-1">
            <span className="uppercase font-extrabold text-cyan-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              LIVE MARKET PULSE
            </span>
            <span className="text-emerald-400 font-bold">● LIVE · BINANCE &amp; METALS</span>
          </div>

          <div className="overflow-x-auto no-scrollbar py-2 flex items-center gap-3">
            {[
              { sym: 'BTC', px: '$81,126', chg: '-0.47%', up: false },
              { sym: 'ETH', px: '$2,535', chg: '+3.45%', up: true },
              { sym: 'SOL', px: '$112.99', chg: '+2.88%', up: true },
              { sym: 'GOLD', px: '$4,125.4', chg: '+0.77%', up: true },
              { sym: 'SILVER', px: '$64.39', chg: '+1.46%', up: true },
              { sym: 'BNB', px: '$761.5', chg: '+1.35%', up: true },
              { sym: 'WTI', px: '$99.66', chg: '-2.40%', up: false },
              { sym: 'S&P 500', px: '5,782', chg: '+0.42%', up: true },
              { sym: 'NIFTY 50', px: '25,014', chg: '+0.35%', up: true },
              { sym: 'DXY', px: '102.45', chg: '-0.28%', up: false },
              { sym: 'US10Y', px: '4.972%', chg: '+0.44%', up: true }
            ].map((t, idx) => (
              <div
                key={idx}
                onClick={() => onLaunchTerminal('global-score')}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e172e] border border-[#1f2f55] hover:border-cyan-400 text-xs font-mono cursor-pointer transition-colors"
              >
                <span className="font-extrabold text-white">{t.sym}</span>
                <span className="text-slate-300 font-bold tabular-nums">{t.px}</span>
                <span className={`text-[10px] font-extrabold ${t.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.up ? '▲' : '▼'} {t.chg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ────────────────── 2. STATS ROW (PHOTO 2 TOP) ────────────────── */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
          {[
            { num: '18+', label: 'DASHBOARDS', sub: 'Macro, Fed, Flow, Liquidity' },
            { num: '31+', label: 'MACRO FACTORS', sub: 'Fused into Per-Asset Bias' },
            { num: '40+', label: 'INSTRUMENTS COVERED', sub: 'Crypto, Bullion, US & Nifty' },
            { num: '24×7', label: 'LIVE CRYPTO STREAM', sub: 'Tick-by-Tick WebSocket' }
          ].map((s, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-[#090f20]/90 border border-[#1c2948] text-center space-y-1 shadow-lg hover:border-rose-500/40 transition-colors"
            >
              <div className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300 tracking-tight">
                {s.num}
              </div>
              <div className="text-[11px] sm:text-xs font-black tracking-wider text-white uppercase">
                {s.label}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 3. AI FEATURES SECTION (PHOTO 2) ────────────────── */}
      <section id="features" className="py-16 px-4 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-black tracking-[2.5px] uppercase text-purple-400">
            AI FEATURES
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Not another data feed.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              An analyst that never sleeps.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Every module converts raw numbers into direction, confidence and reasoning — with the evidence on both sides, always shown.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: '⚡',
              title: 'TradeAI Signal Engine',
              desc: 'Strategy per instrument across crypto (BTC, ETH, SOL), gold, silver, US oil, US stocks & indices: LONG / SHORT / honest WAIT, entry zone, stop, 2k–3k pt swing targets, confidence and 1%-risk sizing.',
              tag: 'Premium · verified members',
              tab: 'ultra-ai'
            },
            {
              icon: '🤖',
              title: 'Macro AI Assistant',
              desc: 'Ask "Why is gold bullish today?" or "Is the banking system under stress?" — it answers from the live dashboard state and cites every indicator it used. No black box.',
              tag: 'Built-in',
              tab: 'jarvis-voice-ai'
            },
            {
              icon: '◈',
              title: 'Confluence Engine',
              desc: '31+ weighted factors — inflation, Fed stance, liquidity, credit, geopolitics, positioning — fused into per-asset bias scores with supporting AND opposing evidence.',
              tag: 'The analytical core',
              tab: 'confluence'
            },
            {
              icon: '🏛',
              title: 'Fed Hawk–Dove AI Meter',
              desc: 'Statement word-diffs, speech scoring and meeting probabilities distilled into one dial — plus what the stance means for gold, Nasdaq, the dollar and Nifty.',
              tag: 'Central-bank NLP',
              tab: 'fed'
            },
            {
              icon: '▩',
              title: 'Regime Classifier',
              desc: 'Growth × inflation quadrant tracking with a 6-month trail, recession/stagflation probabilities, and which assets each regime historically favours.',
              tag: 'Macro map',
              tab: 'regime'
            },
            {
              icon: '💧',
              title: 'Liquidity & Risk Console',
              desc: 'Net-liquidity engine (Fed balance sheet − TGA − RRP), banking-stress index, event-risk warnings before FOMC & CPI, and smart alerts.',
              tag: 'The plumbing',
              tab: 'banking'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => onLaunchTerminal(item.tab)}
              className="p-6 rounded-2xl bg-[#090f20] border border-[#1a2746] hover:border-cyan-500/50 hover:bg-[#0c142b] transition-all flex flex-col justify-between space-y-4 shadow-xl cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#131d38] border border-[#233560] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase font-bold">
                  {item.tag}
                </span>
                <span className="text-xs text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                  Explore →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 4. TRADEAI TERMINAL (PHOTO 3) ────────────────── */}
      <section id="tradeai" className="py-16 px-4 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-black tracking-[2.5px] uppercase text-purple-400">
            TRADEAI TERMINAL
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Signals with reasons.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-300">
              Risk before reward.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            A full trading terminal for verified members — every signal carries its logic, its invalidation, and its position size.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: 5 Benefit Checkmarks (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {[
              {
                title: 'Entry · Stop · 3 Targets · R:R',
                desc: 'Levels computed from live prices and volatility bands — never a bare "buy now".'
              },
              {
                title: '1%-risk position sizing',
                desc: 'Exact quantity for a $100,000 practice account, so a stopped trade costs 1%, not a blow-up.'
              },
              {
                title: 'Paper-trading blotter',
                desc: 'Fill signals at live quotes, watch P&L stream, keep a journal — zero real-money risk while you learn.'
              },
              {
                title: 'Docked TradingView charts',
                desc: 'Free real-data charts beside every signal, and on every instrument in the platform.'
              },
              {
                title: 'Verified-member access',
                desc: 'Apply with your Delta Exchange, Elefin, Lemonn UCC or CoinDCX ID — the desk approves within 24–48 hours.'
              }
            ].map((b, idx) => (
              <div key={idx} className="flex items-start gap-3.5 p-3 rounded-xl bg-[#080e1e] border border-[#17233e]">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-extrabold text-white">{b.title}</div>
                  <div className="text-xs text-slate-300 leading-relaxed">{b.desc}</div>
                </div>
              </div>
            ))}

            <div className="pt-3">
              <button
                onClick={() => onLaunchTerminal('ultra-ai')}
                className="px-6 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>⚡</span>
                <span>Request TradeAI Access</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Signal Card (5 Cols) (PHOTO 3 RIGHT) */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setActiveSignalTab('gold')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeSignalTab === 'gold' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#0f172a] text-slate-400'
                }`}
              >
                XAU Gold Live
              </button>
              <button
                onClick={() => setActiveSignalTab('btc')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeSignalTab === 'btc' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-[#0f172a] text-slate-400'
                }`}
              >
                BTC / USD Live
              </button>
            </div>

            {/* The Famous Signal Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#0b1328] to-[#070c1a] border border-cyan-500/40 shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white font-mono">
                    {activeSignalTab === 'gold' ? 'XAU' : 'BTC'}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {activeSignalTab === 'gold' ? 'Gold' : 'Bitcoin'}
                  </span>
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                    LIVE
                  </span>
                </div>
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-emerald-400 text-slate-950">
                  {activeSignalTab === 'gold' ? 'LONG' : 'SWING ROADMAP'}
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
                  {activeSignalTab === 'gold' ? '4,125.4' : '81,126.0'}{' '}
                  <span className="text-sm font-bold text-emerald-400">
                    {activeSignalTab === 'gold' ? '▲ +0.77%' : '▲ +2.84%'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-semibold block mt-0.5">
                  {activeSignalTab === 'gold'
                    ? 'Macro-Trend Continuation · D1 pullback entry'
                    : '4H Liquidity Sweep · 2,000 / 2,500 / 3,000 Pts Targets'}
                </span>
              </div>

              {/* Data Rows */}
              <div className="space-y-2 text-xs font-mono pt-1">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Confidence</span>
                  <strong className="text-emerald-400">{activeSignalTab === 'gold' ? '68%' : '86%'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Entry zone</span>
                  <strong className="text-white">{activeSignalTab === 'gold' ? '$4,110 – $4,128' : '$81,037 – $82,460'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Stop loss</span>
                  <strong className="text-rose-400">{activeSignalTab === 'gold' ? '$4,082 (-$28)' : '$80,506 (-680 pts)'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Target 1 · TP1</span>
                  <strong className="text-emerald-400">{activeSignalTab === 'gold' ? '$4,180 (+$55)' : '$83,186 (+2,000 pts)'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Target 2 · TP2</span>
                  <strong className="text-emerald-400">{activeSignalTab === 'gold' ? '$4,240 (+$115)' : '$83,686 (+2,500 pts)'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Target 3 · TP3</span>
                  <strong className="text-emerald-400">{activeSignalTab === 'gold' ? '$4,320 (+$195)' : '$84,186 (+3,000 pts)'}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">1% risk sizing</span>
                  <strong className="text-cyan-300">{activeSignalTab === 'gold' ? '13.6 oz' : '1.47 BTC'}</strong>
                </div>
              </div>

              {/* Why & Invalidation Box */}
              <div className="p-3 rounded-xl bg-[#060a16] border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                <span className="font-extrabold text-amber-300">Why: </span>
                {activeSignalTab === 'gold'
                  ? 'Hormuz war premium + ~95t/month central-bank demand vs a 2.55% real yield. '
                  : '4H structural order block sweep with CVD divergence. +2k, +2.5k, +3k pt expansion roadmap. '}
                <span className="font-extrabold text-rose-300">Invalidation: </span>
                {activeSignalTab === 'gold' ? 'Daily close below $4,082.' : '4H close below $80,506.'}
              </div>

              <button
                onClick={() => onLaunchTerminal(activeSignalTab === 'gold' ? 'gold-signal-panel' : 'deeepr-ai')}
                className="w-full py-2.5 rounded-xl text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>📈</span>
                <span>Open Full Interactive Chart &amp; Terminal</span>
              </button>
            </div>
            <div className="text-center text-[11px] text-slate-500 mt-2 font-mono">
              Live signal cards are computed in real-time inside the terminal
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── 5. EXPLORE MODULES GRID (PHOTO 4) ────────────────── */}
      <section id="explore" className="py-16 px-4 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-black tracking-[2.5px] uppercase text-purple-400">
            EXPLORE
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Jump straight into any module
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            The full command centre is free to explore — no signup needed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: 'global-score', icon: '▦', title: 'Macro Dashboard', desc: 'Global bias gauge + 16 summary cards' },
            { id: 'ultra-ai', icon: '⚡', title: 'TradeAI Terminal', desc: 'Signals · paper trading · risk console' },
            { id: 'deeepr-ai', icon: '🔮', title: 'DEEEPR.AI Copilot', desc: '2,000 / 2,500 / 3,000 pts swing roadmap' },
            { id: 'indian-stock-ai', icon: '🎯', title: 'NIFTY Scalper 3m', desc: 'Triple-confluence scalping cockpit + live futures chart' },
            { id: 'scanner', icon: '⇄', title: 'Bull/Bear Scanner', desc: 'Factor-by-factor bias per asset' },
            { id: 'fed', icon: '🏛', title: 'Federal Reserve', desc: 'Odds · dot plot · hawk-dove meter' },
            { id: 'banking', icon: '🏦', title: 'Banking & Liquidity', desc: 'Stress index · net-liquidity engine' },
            { id: 'calendar', icon: '🗓', title: 'Economic Calendar', desc: '10 economies · countdowns · impact' },
            { id: 'confluence', icon: '◈', title: 'Confluence Engine', desc: 'The full macro machine state' },
            { id: 'yields', icon: '📉', title: 'Yield Curve & Bonds', desc: 'Curve shape · inversion history' },
            { id: 'forex', icon: '💱', title: 'Forex Strength Matrix', desc: '10 currencies scored & paired' },
            { id: 'geopolitics', icon: '⚔', title: 'Geopolitical Risk', desc: 'Events scored · emotional vs structural' },
            { id: 'gold-signal-panel', icon: '◎', title: 'Asset Pages & Gold', desc: 'Gold · BTC · Nifty · 11 deep dives' },
            { id: 'liquidity-sweep-map', icon: '🔥', title: 'Liquidation Heatmap Bookmap', desc: 'Stop-hunt clusters & whale walls' },
            { id: 'ai-chart', icon: '🎓', title: 'AI Sniper Chart', desc: 'Real-time LONG / SHORT automated triggers' }
          ].map((mod, idx) => (
            <div
              key={idx}
              onClick={() => onLaunchTerminal(mod.id)}
              className="p-4 rounded-xl bg-[#090f20] border border-[#1a2746] hover:border-cyan-500/50 hover:bg-[#0c152d] transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#111a34] border border-[#203158] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                  {mod.icon}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {mod.desc}
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all text-sm font-bold">
                →
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 6. HOW IT WORKS (PHOTO 5 TOP) ────────────────── */}
      <section id="how" className="py-16 px-4 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-black tracking-[2.5px] uppercase text-purple-400">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            From curious to confident in three steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              num: '1',
              title: 'Explore free',
              desc: 'Open the terminal — every dashboard, the AI assistant, TradingView charts and the education layer are free. No account needed.'
            },
            {
              num: '2',
              title: 'Get verified',
              desc: 'Trading with us on Delta Exchange, Elefin, Lemonn or CoinDCX? Apply for TradeAI with your ID. The desk verifies your mapping within 24–48 hours.'
            },
            {
              num: '3',
              title: 'Trade smarter',
              desc: 'Unlock the signal board, paper-trade with live prices and 1%-risk sizing, and let the risk console warn you before FOMC and CPI.'
            }
          ].map((step, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#090f20] border border-[#1a2746] space-y-3 relative shadow-xl"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-rose-500/20">
                {step.num}
              </div>
              <h3 className="text-lg font-black text-white">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 7. ACCESS TIERS (PHOTO 5 BOTTOM) ────────────────── */}
      <section id="access" className="py-16 px-4 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-black tracking-[2.5px] uppercase text-purple-400">
            ACCESS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Free to explore. Premium when you're mapped.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Explorer Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#090f20] border border-[#1d2c4c] space-y-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-white">Explorer</h3>
                <div className="text-3xl font-black text-white font-mono mt-1">Free</div>
                <div className="text-xs text-slate-400">everyone, forever</div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong className="text-white">All 18 dashboards</strong> — macro, Fed, liquidity, regimes</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong className="text-white">Live feeds</strong> — streaming crypto, gold &amp; silver spot</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong className="text-white">Macro AI assistant</strong> with indicator citations</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong className="text-white">TradingView charts</strong> on every instrument</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong className="text-white">Economic calendar</strong> + education layer</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onLaunchTerminal('global-score')}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-slate-200 bg-[#121c35] hover:bg-[#1a284c] border border-[#273860] transition-colors cursor-pointer"
            >
              Start exploring
            </button>
          </div>

          {/* TradeAI Member Verified Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-[#110e28] via-[#0d122a] to-[#070b1c] border-2 border-rose-500/60 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute top-[-12px] right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-[10px] font-black uppercase text-white shadow-md">
              FOR MAPPED TRADERS
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-white">TradeAI Member</h3>
                <div className="text-3xl font-black text-rose-400 font-mono mt-1">Verified</div>
                <div className="text-xs text-slate-400">Delta / Elefin / Lemonn / CoinDCX mapping · 24–48h approval</div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200 pt-2 border-t border-rose-500/20">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">⚡</span>
                  <span><strong className="text-white">TradeAI signal board</strong> — 30+ instruments daily</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">⚡</span>
                  <span><strong className="text-white">Entry / stop / 3 targets</strong> + confidence &amp; sizing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">⚡</span>
                  <span><strong className="text-white">Paper-trading blotter</strong> at live prices</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">⚡</span>
                  <span><strong className="text-white">Downloadable reports</strong> + unlimited alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">⚡</span>
                  <span><strong className="text-white">Risk console</strong> — event warnings &amp; correlation clusters</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onLaunchTerminal('ultra-ai')}
              className="w-full py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 shadow-lg shadow-rose-500/30 transition-all cursor-pointer"
            >
              Request access
            </button>
          </div>
        </div>
      </section>

      {/* ────────────────── 8. FAQ ACCORDION ────────────────── */}
      <section id="faq" className="py-16 px-4 max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-black tracking-[2.5px] uppercase text-purple-400">
            FAQ
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Questions, answered straight
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Is this financial advice?',
              a: 'No. IshantMacro.Ai provides financial education, macroeconomic telemetry, market structure research and analytical tools. Signals are educational strategy outputs with simulated paper-trading only — zero real orders, zero guaranteed returns. Always conduct independent research and consult a certified financial advisor.'
            },
            {
              q: 'How do I unlock TradeAI signals & 2k-3k pts targets?',
              a: 'Open the terminal → TradeAI tab → Request Access. Submit your name, email, and your Delta Exchange User ID, Elefin User ID, Lemonn UCC, or CoinDCX User ID. The desk verifies mapping under Ishant Macro within 24–48 hours.'
            },
            {
              q: 'Which market data is live on this portal?',
              a: 'Crypto streams tick-by-tick from Binance WebSocket feeds. Gold and silver spot stream live from bullion APIs. US stocks update via Finnhub, and macro releases are maintained through official Federal Reserve St. Louis FRED telemetry.'
            },
            {
              q: 'Does it work smoothly on mobile and tablet?',
              a: 'Yes — the entire portal and command centre are fully responsive with collapsible navigation, horizontal touch tickers, and touch-friendly TradingView charts.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#090f20] border border-[#1b2848] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-sm text-white flex items-center justify-between cursor-pointer hover:text-cyan-300 transition-colors"
              >
                <span>{item.q}</span>
                <span className="text-slate-400 font-mono text-base">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── 9. BIG BOTTOM CTA (PHOTO 5 BOTTOM) ────────────────── */}
      <section className="py-16 px-4 max-w-4xl mx-auto text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#111936] to-[#070b1a] border border-cyan-500/30 shadow-2xl space-y-5">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            The market is telling a story.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300">
              Start reading it today.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Free to explore. AI-decoded. Built by traders, for traders.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => onLaunchTerminal('global-score')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 shadow-xl shadow-rose-500/25 transition-all cursor-pointer"
            >
              🚀 Explore the Terminal
            </button>
            <button
              onClick={() => onLaunchTerminal('ultra-ai')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-extrabold text-slate-200 bg-[#0e162d] hover:bg-[#19264a] border border-[#26375c] transition-all cursor-pointer"
            >
              ⚡ Unlock TradeAI
            </button>
          </div>
        </div>
      </section>

      {/* ────────────────── 10. FOOTER ────────────────── */}
      <footer className="border-t border-[#141e34] py-12 px-4 sm:px-8 bg-[#04060c] text-xs text-slate-400">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="space-y-2 max-w-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white font-black text-[10px]">
                  IM
                </div>
                <span className="text-sm font-black text-white">IshantMacro<span className="text-rose-400">.Ai</span></span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The AI-powered global macro command centre: data + explanation + market impact + bullish/bearish confluence.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-[11px]">
              <div className="space-y-2">
                <span className="font-extrabold text-white uppercase tracking-wider block">Platform</span>
                <button onClick={() => onLaunchTerminal('global-score')} className="block hover:text-cyan-300">Terminal</button>
                <button onClick={() => onLaunchTerminal('ultra-ai')} className="block hover:text-cyan-300">TradeAI</button>
                <button onClick={() => onLaunchTerminal('deeepr-ai')} className="block hover:text-cyan-300">DEEEPR.AI</button>
                <button onClick={() => onLaunchTerminal('scanner')} className="block hover:text-cyan-300">Scanner</button>
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-white uppercase tracking-wider block">Intelligence</span>
                <button onClick={() => onLaunchTerminal('fed')} className="block hover:text-cyan-300">Federal Reserve</button>
                <button onClick={() => onLaunchTerminal('banking')} className="block hover:text-cyan-300">Banking & Liquidity</button>
                <button onClick={() => onLaunchTerminal('geopolitics')} className="block hover:text-cyan-300">Geopolitics</button>
                <button onClick={() => onLaunchTerminal('news')} className="block hover:text-cyan-300">Desk Notes</button>
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-white uppercase tracking-wider block">Learn</span>
                <button onClick={() => onLaunchTerminal('regime')} className="block hover:text-cyan-300">Regime Matrix</button>
                <button onClick={() => onLaunchTerminal('yields')} className="block hover:text-cyan-300">Yield Curve</button>
                <button onClick={() => onLaunchTerminal('gold-signal-panel')} className="block hover:text-cyan-300">Gold Analysis</button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 text-[10px] text-slate-500 space-y-2 leading-relaxed">
            <p>
              <strong className="text-slate-400">Financial Disclaimer:</strong> This platform provides financial education, macroeconomic data, market information, and analytical tools. It does not provide personalised investment advice, guaranteed predictions, buy or sell recommendations, or assured returns. Financial markets involve substantial risk.
            </p>
            <p>
              © {new Date().getFullYear()} IshantMacro.Ai · Ishant Jakhenia Global Macro Command Centre · Charts by TradingView · Live feeds: Binance, gold-api, CoinGecko, Finnhub.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IshantMacroPortalView;
