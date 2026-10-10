import React from 'react';
import { Globe, LineChart, Cpu, Calendar, ShieldCheck, Zap, Activity, PieChart, Layers, Flame, Award, Building2 } from 'lucide-react';

interface GenericModulePageProps {
  moduleId: string;
}

export const GenericModulePage: React.FC<GenericModulePageProps> = ({ moduleId }) => {
  // Details map for each module
  const moduleConfig: Record<string, { title: string; subtitle: string; icon: React.ReactNode; color: string; metrics: { label: string; val: string; change?: string }[] }> = {
    'global-intel': {
      title: 'Global Intelligence & Cross-Asset Risk Matrix',
      subtitle: 'Real-time macro surveillance across G7 central banks, commodity supplies, and bond yield spreads.',
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      color: 'blue',
      metrics: [
        { label: 'G7 Inflation Momentum', val: '2.8% YoY', change: '-0.3%' },
        { label: 'Global Liquidity Index', val: '$104.2 Trillion', change: '+$1.2T' },
        { label: 'Yield Curve Inversion (10Y-2Y)', val: '+0.12 bps', change: 'Uninverted' },
        { label: 'Sovereign Debt Risk', val: 'LOW / STABLE', change: 'Stable' },
      ]
    },
    'crypto-brain': {
      title: 'AI Crypto Brain & Market Sentiment Matrix',
      subtitle: 'Algorithmic composite crypto health score, altcoin rotation gauge, and spot order book imbalance.',
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      color: 'purple',
      metrics: [
        { label: 'Crypto Composite Score', val: '74 / 100', change: 'Bullish' },
        { label: 'Fear & Greed Index', val: '68 (Greed)', change: '+4 pts' },
        { label: 'Retail vs Whales', val: 'Whale Accumulation', change: '+14%' },
        { label: 'Market Temperature', val: 'WARM / EXPANDING', change: 'Optimal' },
      ]
    },
    'macro-engine': {
      title: 'Macro Liquidity & Cross-Asset Correlation Engine',
      subtitle: 'Tracking Federal Reserve balance sheet changes, Reverse Repo (RRP) draws, and Dollar inverse correlation.',
      icon: <LineChart className="w-6 h-6 text-amber-400" />,
      color: 'amber',
      metrics: [
        { label: 'Fed Net Liquidity', val: '$6.18 Trillion', change: '+$84.2B' },
        { label: 'Reverse Repo (RRP) Balance', val: '$240 Billion', change: '-$22B' },
        { label: 'Treasury General Acct (TGA)', val: '$748 Billion', change: '-$14B' },
        { label: 'BTC vs DXY Correlation', val: '-0.84', change: 'Strong Inverse' },
      ]
    },
    'economic-events': {
      title: 'High-Impact Economic Calendar (CPI / FOMC / NFP)',
      subtitle: 'Scheduled central bank interest rate decisions, inflation releases, and market impact forecasts.',
      icon: <Calendar className="w-6 h-6 text-green-400" />,
      color: 'green',
      metrics: [
        { label: 'Next FOMC Rate Decision', val: 'Oct 29, 2026', change: '50bps Cut Expected' },
        { label: 'US CPI Release', val: '2.4% Actual', change: '-0.2% vs forecast' },
        { label: 'US Non-Farm Payrolls', val: '223K Jobs', change: '+43K vs forecast' },
        { label: 'Fed Funds Target', val: '4.75% - 5.00%', change: 'Easing Phase' },
      ]
    },
    'whales': {
      title: 'Whale Wallet Tracking & Exchange Reserve Engine',
      subtitle: 'Live monitoring of massive on-chain wallet movements (>1,000 BTC) and exchange inflow/outflow balance.',
      icon: <Activity className="w-6 h-6 text-cyan-400" />,
      color: 'cyan',
      metrics: [
        { label: 'Whale Cohort Balance (>1k BTC)', val: '4.28 Million BTC', change: '+18,400 BTC (7d)' },
        { label: 'Exchange Netflow (24h)', val: '-14,250 BTC', change: 'Outflow (Bullish)' },
        { label: 'Miners Outflow Pressure', val: 'LOW', change: '-12%' },
        { label: 'Top Exchange Deposit Alert', val: '0 Suspicious', change: 'Clean' },
      ]
    },
    'derivatives-engine': {
      title: 'Derivatives, Open Interest & Funding Rates Engine',
      subtitle: 'Futures open interest across Binance, Bybit, OKX, and perpetual swap funding rate heatmap.',
      icon: <PieChart className="w-6 h-6 text-red-400" />,
      color: 'red',
      metrics: [
        { label: 'Total BTC Open Interest', val: '$38.4 Billion', change: '+$1.4B (24h)' },
        { label: 'Average Funding Rate', val: '+0.0084%', change: 'Neutral / Health' },
        { label: 'Binance Long/Short Ratio', val: '1.42 (58.6% Long)', change: 'Long Skew' },
        { label: 'Estimated Leverage Ratio', val: '0.245', change: 'Elevated' },
      ]
    },
    'options': {
      title: 'Options Engine & Max Pain Strikes',
      subtitle: 'Deribit & CME Options Open Interest distribution, Max Pain strike price, and Volatility Skew.',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      color: 'amber',
      metrics: [
        { label: 'BTC Max Pain Price', val: '$66,000', change: 'Expiration Oct 31' },
        { label: 'Put/Call Volume Ratio', val: '0.62', change: 'Bullish Call Dominance' },
        { label: 'Implied Volatility (IV) Rank', val: '44%', change: 'Moderate' },
        { label: 'Total Options Open Interest', val: '$22.1 Billion', change: 'Deribit 74%' },
      ]
    },
    'eth-engine': {
      title: 'Ethereum & Dominance Engine',
      subtitle: 'ETH/BTC ratio momentum, Staking yields, Layer 2 Total Value Locked (TVL), and BTC Dominance.',
      icon: <Layers className="w-6 h-6 text-indigo-400" />,
      color: 'indigo',
      metrics: [
        { label: 'ETH / BTC Ratio', val: '0.0385', change: '+1.4%' },
        { label: 'Staking Yield (APY)', val: '3.42%', change: '34.8M ETH Staked' },
        { label: 'Layer 2 TVL (Arbitrum/Base)', val: '$42.8 Billion', change: '+$2.1B' },
        { label: 'Bitcoin Dominance (BTC.D)', val: '56.4%', change: '-0.3%' },
      ]
    },
    'altcoins': {
      title: 'Altcoins, Token Unlocks & Season Index',
      subtitle: 'Altcoin Season Score (0-100), upcoming cliff token unlocks, and sector momentum ranks.',
      icon: <Activity className="w-6 h-6 text-pink-400" />,
      color: 'pink',
      metrics: [
        { label: 'Altcoin Season Index', val: '48 / 100', change: 'Bitcoin Season' },
        { label: 'Upcoming Unlock Volume (7d)', val: '$240 Million', change: 'TIA, SUI, APT' },
        { label: 'Top Gainer Sector', val: 'AI Agents & RWA', change: '+18.4%' },
        { label: 'Total Altcoin Market Cap', val: '$1.12 Trillion', change: '+$24B' },
      ]
    },
    'confluence': {
      title: 'Multi-Indicator Confluence Matrix',
      subtitle: 'Aggregating Technicals + On-Chain + Derivatives + Macro Liquidity into single execution confidence.',
      icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
      color: 'green',
      metrics: [
        { label: 'Macro Confluence Score', val: '86 / 100', change: 'STRONG BULLISH' },
        { label: 'Technicals Alignment', val: '4/5 Timeframes Bullish', change: 'High Conviction' },
        { label: 'On-Chain Supply State', val: 'Illiquid Accumulation', change: '74% Unmoved > 1yr' },
        { label: 'Derivatives Risk', val: 'Balanced Funding', change: 'Low Squeeze Risk' },
      ]
    },
    'scanner': {
      title: 'Real-Time Bull / Bear Pattern Scanner',
      subtitle: 'Scanning 100+ global assets across 15m, 1h, 4h, and Daily timeframes for breakouts & breakdown setups.',
      icon: <Flame className="w-6 h-6 text-amber-400" />,
      color: 'amber',
      metrics: [
        { label: 'Active Bullish Breakouts', val: '14 Instruments', change: 'NVDA, BTC, INFY' },
        { label: 'Active Bearish Breakdown', val: '3 Instruments', change: 'DXY, TSLA' },
        { label: 'RSI Oversold (&lt;30)', val: '5 Stocks', change: 'Buying Opps' },
        { label: 'Volume Spike (&gt;2x Avg)', val: '12 Assets', change: 'High Activity' },
      ]
    },
    'regime': {
      title: 'Market-Regime Classification Quadrant',
      subtitle: 'Mapping real economic growth against inflation dynamics to define current investment regime.',
      icon: <Globe className="w-6 h-6 text-indigo-400" />,
      color: 'indigo',
      metrics: [
        { label: 'Current Active Quadrant', val: 'Risk-On Expansion', change: 'Quad 2' },
        { label: 'Growth Direction', val: 'Accelerating (+2.8% GDP)', change: 'Positive' },
        { label: 'Inflation Direction', val: 'Decelerating (2.4% CPI)', change: 'Soft Landing' },
        { label: 'Optimal Asset Allocation', val: 'Equities & Crypto', change: 'Overweight' },
      ]
    },
    'gold': {
      title: 'Gold & Precious Metals Terminal (XAU / XAG)',
      subtitle: 'Spot Gold price analysis, real yield sensitivity, and global Central Bank net gold purchases.',
      icon: <Award className="w-6 h-6 text-amber-400" />,
      color: 'amber',
      metrics: [
        { label: 'Gold Spot (XAU/USD)', val: '$2,652.40', change: '+0.68% (ATH Zone)' },
        { label: 'Silver Spot (XAG/USD)', val: '$31.85', change: '+1.45%' },
        { label: 'Central Bank Purchases (YTD)', val: '840 Tonnes', change: 'China & India buying' },
        { label: 'US 10Y Real Yield', val: '1.82%', change: 'Falling' },
      ]
    },
    'forex': {
      title: 'Forex & Dollar Index Terminal (DXY)',
      subtitle: 'US Dollar Index, EUR/USD, USD/JPY, USD/INR currency strength meter and central bank interest differentials.',
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      color: 'blue',
      metrics: [
        { label: 'US Dollar Index (DXY)', val: '102.45', change: '-0.28%' },
        { label: 'EUR / USD', val: '1.0965', change: '+0.22%' },
        { label: 'USD / JPY', val: '148.20', change: '-0.45%' },
        { label: 'USD / INR', val: '83.92', change: '-0.08%' },
      ]
    }
  };

  const config = moduleConfig[moduleId] || {
    title: `${moduleId.toUpperCase().replace('-', ' ')} Command Module`,
    subtitle: 'Real-time terminal telemetry, analytical charts, and automated quantitative signals.',
    icon: <Building2 className="w-6 h-6 text-amber-400" />,
    color: 'amber',
    metrics: [
      { label: 'Module Status', val: 'ONLINE & ACTIVE', change: 'Live Telemetry' },
      { label: 'Data Feed Refresh', val: 'Real-Time 30s', change: '0 Errors' },
      { label: 'Signal Quality Index', val: '98.4%', change: 'High Precision' },
      { label: 'Active Monitors', val: '124 Telemetry Lines', change: 'Optimal' },
    ]
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="glass-panel p-5 bg-gradient-to-r from-[var(--bg-card)] via-[#161d2d] to-[var(--bg-card)] border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30">
            {config.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-main)]">{config.title}</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{config.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {config.metrics.map((m, idx) => (
          <div key={`mod-m-${idx}`} className="glass-panel p-4 space-y-1.5">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {m.label}
            </div>
            <div className="text-xl font-extrabold text-[var(--text-main)] font-mono">{m.val}</div>
            {m.change && (
              <div className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
                {m.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Feature Content Panel */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" /> Active Quantitative Intelligence Stream
          </h3>
          <span className="text-[10px] font-mono text-[var(--accent-bull)] bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
            ● SYSTEM NOMINAL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)] space-y-2">
            <h4 className="font-bold text-amber-300">Executive Summary Readout</h4>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Automated algorithmic scanner confirms positive macro alignment. Capital flows remain supportive of risk-on assets with low probability of sudden liquidity contraction in the current 30-day window.
            </p>
          </div>

          <div className="p-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)] space-y-2">
            <h4 className="font-bold text-indigo-300">Actionable Terminal Recommendation</h4>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Maintain core exposure to high-beta technology equities (US + NIFTY 100 bluechips) and Bitcoin spot holdings while utilizing tight trailing stops below key 20-day moving average support lines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
