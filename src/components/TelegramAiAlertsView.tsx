import React, { useState, useEffect, useCallback } from 'react';
import {
  telegramAlertService,
  TelegramConfigState,
  AlertToggles,
  AssetAlertSetting,
  SupportedAssetKey,
  LiveMarketAssetSnapshot,
  AlertHistoryItem,
  DEFAULT_ALERT_TOGGLES,
  DEFAULT_ASSET_SETTINGS
} from '../services/telegramAlertService';
import { useAuth } from '../context/AuthContext';

export const TelegramAiAlertsView: React.FC = () => {
  const { user } = useAuth();

  // State
  const [chatIdInput, setChatIdInput] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<TelegramConfigState>({
    chatId: '',
    isConnected: false,
    isBackendRunning: false,
    botUsername: 'Researchsomething_bot',
  });
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string; hint?: string } | null>(null);

  // Market Data & Telemetry
  const [marketData, setMarketData] = useState<Record<SupportedAssetKey, LiveMarketAssetSnapshot> | null>(null);
  const [istTime, setIstTime] = useState<string>('');
  const [isLoadingMarket, setIsLoadingMarket] = useState<boolean>(true);

  // Settings
  const [selectedAsset, setSelectedAsset] = useState<SupportedAssetKey>('BTC');
  const [alertToggles, setAlertToggles] = useState<AlertToggles>(DEFAULT_ALERT_TOGGLES);
  const [assetSettings, setAssetSettings] = useState<Record<SupportedAssetKey, AssetAlertSetting>>(DEFAULT_ASSET_SETTINGS);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // History & Preview
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'assets' | 'history' | 'preview'>('alerts');

  // Load Saved State
  useEffect(() => {
    const savedId = telegramAlertService.getSavedChatId();
    if (savedId) {
      setChatIdInput(savedId);
    }
    setAlertToggles(telegramAlertService.getSavedToggles());
    setAssetSettings(telegramAlertService.getSavedAssetSettings());

    // Check backend status
    telegramAlertService.checkBackendStatus().then((res) => {
      const activeId = savedId || (res.subscribers && res.subscribers.length > 0 ? String(res.subscribers[0].chat_id) : '');
      if (activeId && !savedId) {
        setChatIdInput(activeId);
        telegramAlertService.saveSavedChatId(activeId);
      }
      setConnectionStatus((prev) => ({
        ...prev,
        isBackendRunning: res.configured,
        botUsername: res.botUsername,
        botId: res.botInfo?.id,
        isConnected: Boolean(activeId && res.configured),
        chatId: activeId,
      }));
      if (res.istTime) setIstTime(res.istTime);
    });

    // Fetch initial market data
    loadMarketData();
    loadHistory();

    // Polling interval for market prices
    const interval = setInterval(() => {
      loadMarketData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadMarketData = useCallback(async () => {
    const data = await telegramAlertService.fetchLiveMarketData();
    if (data) {
      setMarketData(data);
      setIsLoadingMarket(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const hist = await telegramAlertService.fetchAlertHistory(20);
    setAlertHistory(hist);
  }, []);

  // Handlers
  const handleVerifyConnection = async () => {
    const idToVerify = chatIdInput.trim();
    if (!idToVerify) {
      setVerifyFeedback({
        type: 'error',
        text: 'Please enter a valid Telegram Chat ID.',
        hint: `Open Telegram, search @${connectionStatus.botUsername}, and click Start to get your Chat ID.`,
      });
      return;
    }

    setIsVerifying(true);
    setVerifyFeedback({ type: 'info', text: 'Sending verification handshake to Telegram...' });

    const result = await telegramAlertService.verifyChatId(idToVerify);
    setIsVerifying(false);

    if (result.success) {
      setConnectionStatus((prev) => ({
        ...prev,
        chatId: idToVerify,
        isConnected: true,
        lastVerifiedAt: new Date().toLocaleTimeString(),
      }));
      setVerifyFeedback({
        type: 'success',
        text: `Connected Successfully! Handshake confirmation delivered to Chat ID: ${idToVerify}`,
      });
      loadHistory();
    } else {
      setVerifyFeedback({
        type: 'error',
        text: result.error || 'Verification failed.',
        hint: result.hint,
      });
    }
  };

  const handleSendTestAlert = async (type: string = 'liquidity_sweep') => {
    const targetChatId = connectionStatus.chatId || chatIdInput.trim();
    if (!targetChatId) {
      setVerifyFeedback({
        type: 'error',
        text: 'Configure and verify your Chat ID before triggering alerts.',
      });
      return;
    }

    setIsSendingTest(true);
    const result = await telegramAlertService.sendTestAlert(targetChatId, selectedAsset, type);
    setIsSendingTest(false);

    if (result.success) {
      setVerifyFeedback({
        type: 'success',
        text: `Real Telegram Alert Dispatched! Check your Telegram app (@${connectionStatus.botUsername}).`,
      });
      loadHistory();
    } else {
      setVerifyFeedback({
        type: 'error',
        text: result.error || 'Failed to dispatch alert to Telegram.',
      });
    }
  };

  const handleDailySummary = async () => {
    const targetChatId = connectionStatus.chatId || chatIdInput.trim();
    setIsSendingTest(true);
    const res = await telegramAlertService.triggerDailySummary(targetChatId);
    setIsSendingTest(false);
    if (res.success) {
      setVerifyFeedback({ type: 'success', text: 'Daily Institutional Market Briefing sent to Telegram!' });
      loadHistory();
    } else {
      setVerifyFeedback({ type: 'error', text: res.message || 'Failed to send Daily Briefing.' });
    }
  };

  const handleEmergencyVolatility = async () => {
    const targetChatId = connectionStatus.chatId || chatIdInput.trim();
    setIsSendingTest(true);
    const res = await telegramAlertService.triggerEmergencyVolatility(targetChatId);
    setIsSendingTest(false);
    if (res.success) {
      setVerifyFeedback({ type: 'success', text: 'Emergency Volatility Alert sent to Telegram!' });
      loadHistory();
    } else {
      setVerifyFeedback({ type: 'error', text: res.message || 'Failed to send Volatility Alert.' });
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingConfig(true);
    const targetChatId = connectionStatus.chatId || chatIdInput.trim();
    const ok = await telegramAlertService.saveConfiguration(
      targetChatId,
      alertToggles,
      assetSettings,
      user?.id
    );
    setIsSavingConfig(false);
    if (ok) {
      setSaveFeedback('Preferences saved and synced with backend.');
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const toggleAlert = (key: keyof AlertToggles) => {
    setAlertToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateAssetSetting = (asset: SupportedAssetKey, key: keyof AssetAlertSetting, value: any) => {
    setAssetSettings((prev) => ({
      ...prev,
      [asset]: {
        ...prev[asset],
        [key]: value,
      },
    }));
  };

  // Helper for prices
  const getAssetPriceDisplay = (key: SupportedAssetKey) => {
    if (!marketData || !marketData[key]) return { price: 'Loading...', change: '0.00%', isPos: true };
    const a = marketData[key];
    const priceFormatted = key === 'USDT_D'
      ? `${a.price.toFixed(2)}%`
      : key === 'DXY'
      ? `${a.price.toFixed(2)}`
      : `$${a.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const changeFormatted = `${a.change24h >= 0 ? '+' : ''}${a.change24h.toFixed(2)}%`;
    return {
      price: priceFormatted,
      change: changeFormatted,
      isPos: a.change24h >= 0,
    };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── TOP HEADER & TERMINAL BADGE ── */}
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              OFFICIAL TELEGRAM BOT API • LIVE TELEMETRY
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              IST Time: {istTime || new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans flex items-center gap-2">
            📲 Telegram AI Market Alert System
            <span className="rounded bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold uppercase tracking-wider">
              Institutional
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Automated event-driven alerts directly to your Telegram: Liquidity sweeps, Delta Exchange order flow, liquidation clusters, market structure shifts, and macroeconomic releases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSendTestAlert('liquidity_sweep')}
            disabled={isSendingTest || !chatIdInput}
            className="flex items-center gap-2 rounded-lg bg-gold hover:bg-gold/90 text-primary-foreground px-3.5 py-2 text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isSendingTest ? 'Dispatching...' : '⚡ Test Telegram Alert'}
          </button>
          <button
            onClick={handleDailySummary}
            disabled={isSendingTest || !chatIdInput}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition cursor-pointer"
          >
            🌅 Daily Summary
          </button>
          <button
            onClick={handleEmergencyVolatility}
            disabled={isSendingTest || !chatIdInput}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition cursor-pointer"
          >
            ⚠️ Volatility Trigger
          </button>
        </div>
      </div>

      {/* ── CONNECTION SETUP CARD ── */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-background/95 p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-secondary/50 border border-border/80">
              <div className="relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 font-extrabold text-[11px] shadow-md border-2 border-slate-600 select-none">
                  <span>ishantmacro.ai</span>
                </div>
                {/* Official Telegram Blue Verified Badge on avatar */}
                <div className="absolute -bottom-1 -right-1 rounded-full bg-[#0a0f1d] p-0.5 shadow">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#2AABEE" />
                    <path d="M9.5 16.5l-3.5-3.5 1.41-1.41L9.5 13.67l7.09-7.09L18 8z" fill="#ffffff" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-base font-extrabold text-foreground font-sans tracking-tight">
                    ISHANTMACRO.AI
                  </h3>
                  {/* Blue Verified Badge */}
                  <span title="Verified Official Telegram Bot" className="inline-flex items-center cursor-pointer">
                    <svg className="w-4 h-4 drop-shadow-sm" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#2AABEE" />
                      <path d="M9.5 16.5l-3.5-3.5 1.41-1.41L9.5 13.67l7.09-7.09L18 8z" fill="#ffffff" />
                    </svg>
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-background/80 border border-border">
                    bot
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-sky-400">
                  <a
                    href="https://t.me/Researchsomething_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1 font-semibold"
                  >
                    @{connectionStatus.botUsername}
                    <span className="text-[10px] text-muted-foreground font-sans">↗</span>
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  ISHANTMACRO.AI — 24/7 Market Radar &amp; AI Trading Assistant
                </p>
              </div>
            </div>

            {/* Step-by-step instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-2.5">
                <span className="font-bold text-gold">Step 1:</span> Open Bot
                <p className="text-muted-foreground mt-0.5">
                  Click below or search <span className="text-foreground font-semibold">@{connectionStatus.botUsername}</span>
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-2.5">
                <span className="font-bold text-gold">Step 2:</span> Click /start
                <p className="text-muted-foreground mt-0.5">
                  Send <span className="text-foreground font-semibold">/start</span> to get your numeric Chat ID.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-2.5">
                <span className="font-bold text-gold">Step 3:</span> Connect & Verify
                <p className="text-muted-foreground mt-0.5">
                  Paste Chat ID and click Verify to start receiving alerts.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={`https://t.me/${connectionStatus.botUsername}?start=ishant_terminal`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#229ED9] hover:bg-[#1e8ec3] text-white px-3.5 py-2 text-xs font-bold transition shadow-md"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.74-.56 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.15 3.35-1.35 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.19-.03.36z" />
                </svg>
                Connect Telegram Bot
              </a>

              <button
                onClick={() => setShowQrModal(!showQrModal)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-secondary px-3 py-2 text-xs font-medium text-foreground transition cursor-pointer"
              >
                📱 View Bot QR Code
              </button>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="w-full lg:w-96 rounded-xl border border-border bg-card/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Telegram Chat ID
              </label>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  connectionStatus.isConnected
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${connectionStatus.isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {connectionStatus.isConnected ? 'Connected ✅' : 'Pending Verification'}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Enter your Telegram Chat ID (e.g. 562910481)"
                value={chatIdInput}
                onChange={(e) => setChatIdInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyConnection}
                disabled={isVerifying || !chatIdInput.trim()}
                className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground py-2 text-xs font-bold transition disabled:opacity-50 cursor-pointer text-center"
              >
                {isVerifying ? 'Verifying with Telegram...' : 'Verify & Connect'}
              </button>
            </div>

            {verifyFeedback && (
              <div
                className={`rounded-lg p-2.5 text-xs border ${
                  verifyFeedback.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : verifyFeedback.type === 'error'
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                }`}
              >
                <p className="font-semibold">{verifyFeedback.text}</p>
                {verifyFeedback.hint && (
                  <p className="text-[11px] opacity-90 mt-1">{verifyFeedback.hint}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* QR Code Modal Drawer */}
        {showQrModal && (
          <div className="mt-4 border-t border-border pt-4 flex flex-col sm:flex-row items-center gap-5 bg-card/80 p-4 rounded-lg">
            <div className="p-3 bg-white rounded-lg shadow-md shrink-0">
              {/* Generated QR visual */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://t.me/${connectionStatus.botUsername}`}
                alt="Telegram Bot QR Code"
                className="w-32 h-32"
              />
            </div>
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-foreground">Scan with Mobile Telegram App</h4>
              <p className="text-muted-foreground">
                Point your mobile phone camera or Telegram QR scanner to connect with <span className="text-gold font-semibold">@{connectionStatus.botUsername}</span>.
              </p>
              <p className="text-muted-foreground">
                Once opened, tap <span className="text-foreground font-semibold">START</span>. The bot will automatically reply with your Chat ID, or tap Verify above!
              </p>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground underline pt-1 cursor-pointer"
              >
                Close QR Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── LIVE MARKETS OVERVIEW (7 SUPPORTED MARKETS) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>📊</span> Supported Institutional Markets & Feeds
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            Direct Binance + Delta Exchange India APIs
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {(['BTC', 'ETH', 'SOL', 'XAUUSD', 'XAGUSD', 'DXY', 'USDT_D'] as SupportedAssetKey[]).map((assetKey) => {
            const p = getAssetPriceDisplay(assetKey);
            const isSelected = selectedAsset === assetKey;
            const labels: Record<SupportedAssetKey, { name: string; icon: string; sub: string }> = {
              BTC: { name: 'Bitcoin', icon: '₿', sub: 'Binance & Delta' },
              ETH: { name: 'Ethereum', icon: 'Ξ', sub: 'Binance & Delta' },
              SOL: { name: 'Solana', icon: '◎', sub: 'Binance & Delta' },
              XAUUSD: { name: 'Gold Spot', icon: '🥇', sub: 'LBMA & XAUTUSD' },
              XAGUSD: { name: 'Silver Spot', icon: '🥈', sub: 'COMEX Spot' },
              DXY: { name: 'US Dollar', icon: '💵', sub: 'ICE DXY Index' },
              USDT_D: { name: 'USDT.D', icon: '📊', sub: 'Dominance' },
            };
            const meta = labels[assetKey];

            return (
              <button
                key={assetKey}
                onClick={() => setSelectedAsset(assetKey)}
                className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-gold/60 bg-gold/10 shadow-glow ring-1 ring-gold/40'
                    : 'border-border bg-card/60 hover:bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{meta.icon}</span>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      p.isPos ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {p.change}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-foreground truncate">{assetKey}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{meta.sub}</p>
                </div>
                <p className="mt-1.5 text-xs font-bold font-mono text-foreground">{p.price}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex border-b border-border text-xs font-semibold">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'border-gold text-gold font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          ⚙️ Alert Types (10 Toggles)
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'assets'
              ? 'border-gold text-gold font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          🎯 Asset Thresholds & Frequency ({selectedAsset})
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'border-gold text-gold font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          👁️ Telegram Message Preview
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-gold text-gold font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📜 Alert Delivery History ({alertHistory.length})
        </button>
      </div>

      {/* ── TAB 1: 10 ALERT TOGGLES ── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Configure individual event triggers. When market criteria are verified, alerts are dispatched directly to your Telegram chat.
            </p>
            <button
              onClick={handleSavePreferences}
              disabled={isSavingConfig}
              className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 text-xs font-bold transition cursor-pointer"
            >
              {isSavingConfig ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[
              {
                id: 'priceCrossing',
                title: 'Live Price Crossing Level',
                desc: 'Alert when live market price crosses configured upper or lower resistance/support boundaries.',
                icon: '🎯',
                tag: 'Price Action',
              },
              {
                id: 'supportResistanceBreakout',
                title: 'Support & Resistance Breakout',
                desc: 'Institutional 4H/1D key level breaks with multi-candle acceptance and volume confirmation.',
                icon: '⚡',
                tag: 'Breakout',
              },
              {
                id: 'liquiditySweep',
                title: 'Liquidity Sweep & Stop-Hunt Detection',
                desc: 'Detection of wicks clearing resting BSL/SSL stops followed by rapid CVD delta absorption.',
                icon: '🌊',
                tag: 'Smart Money',
              },
              {
                id: 'liquidationClusters',
                title: 'Liquidation Clusters & Magnets',
                desc: 'Unusual liquidation events and high-density 50x–100x liquidation pools on centralized exchanges.',
                icon: '🔥',
                tag: 'Derivatives',
              },
              {
                id: 'volumeFundingSpikes',
                title: 'Volume Spikes & Funding Rate Shifts',
                desc: 'Volume exceeding 1.8x 20-period moving average with perpetual funding rate divergence.',
                icon: '📊',
                tag: 'Order Flow',
              },
              {
                id: 'marketStructureShifts',
                title: 'Bullish & Bearish Structure Shifts (BOS / CHoCH)',
                desc: 'Change of Character (CHoCH) on 15m/1H/4H timeframes indicating trend rotation.',
                icon: '🔄',
                tag: 'SMC Structure',
              },
              {
                id: 'btcUsdtMomentum',
                title: 'BTC vs USDT Momentum & DXY Correlation',
                desc: 'Inverse correlation shifts between Tether Dominance (USDT.D), DXY index, and Bitcoin trajectory.',
                icon: '🧭',
                tag: 'Macro Correlation',
              },
              {
                id: 'longShortWaitSetups',
                title: 'LONG, SHORT and WAIT Setups',
                desc: 'Quantitative multi-pillar confluence signals labeling clear regime status with bias.',
                icon: '🎯',
                tag: 'Sniper Signals',
              },
              {
                id: 'entryTpSlRiskReward',
                title: 'Entry Zone, Stop-Loss, Take-Profit & R:R',
                desc: 'Calculated entry, invalidation, take-profit levels with minimum 1:2.0 risk-reward threshold.',
                icon: '📐',
                tag: 'Risk Management',
              },
              {
                id: 'macroEconomicNews',
                title: 'High-Impact Economic News Releases',
                desc: 'Pre-event warnings and post-release analysis for US CPI, FOMC, NFP, GDP, and central bank decisions.',
                icon: '📰',
                tag: 'Macroeconomics',
              },
              {
                id: 'dailySummary',
                title: 'Daily Market Briefing (Morning IST)',
                desc: 'Scheduled morning digest covering key levels, Delta India metrics, and overall macro bias.',
                icon: '🌅',
                tag: 'Daily Digest',
              },
              {
                id: 'emergencyVolatility',
                title: 'Emergency Volatility Alert',
                desc: 'Rapid flush warnings triggered when high-frequency spread and volatility index exceed 85th percentile.',
                icon: '⚠️',
                tag: 'Risk Protocol',
              },
            ].map((item) => {
              const isEnabled = alertToggles[item.id as keyof AlertToggles];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleAlert(item.id as keyof AlertToggles)}
                  className={`rounded-xl border p-4 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    isEnabled
                      ? 'border-primary/50 bg-card shadow-sm'
                      : 'border-border/60 bg-secondary/20 opacity-75'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                      <span className="text-[10px] rounded bg-secondary px-1.5 py-0.5 text-muted-foreground font-mono">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-0.5 shrink-0">
                    <div
                      className={`h-5 w-9 rounded-full transition-colors relative ${
                        isEnabled ? 'bg-gold' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
                          isEnabled ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: ASSET-SPECIFIC THRESHOLDS & TIMEFRAME ── */}
      {activeTab === 'assets' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>⚙️</span> Fine-Tune Alert Engine for {selectedAsset}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Individual price triggers, execution timeframe, and notification cooldowns.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">Current Live:</span>
                <span className="text-xs font-bold font-mono text-gold">
                  {getAssetPriceDisplay(selectedAsset).price}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Upper threshold */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Upper Resistance Trigger
                </label>
                <input
                  type="number"
                  value={assetSettings[selectedAsset]?.upperThreshold || ''}
                  onChange={(e) =>
                    updateAssetSetting(selectedAsset, 'upperThreshold', parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-gold focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground">Alerts when price crosses above this level.</p>
              </div>

              {/* Lower threshold */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Lower Support Trigger
                </label>
                <input
                  type="number"
                  value={assetSettings[selectedAsset]?.lowerThreshold || ''}
                  onChange={(e) =>
                    updateAssetSetting(selectedAsset, 'lowerThreshold', parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-gold focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground">Alerts when price crosses below this level.</p>
              </div>

              {/* Timeframe */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Analysis Timeframe
                </label>
                <select
                  value={assetSettings[selectedAsset]?.timeframe || '15m'}
                  onChange={(e) => updateAssetSetting(selectedAsset, 'timeframe', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-gold focus:outline-none"
                >
                  <option value="1m">1m — Ultra Scalp</option>
                  <option value="5m">5m — High Frequency</option>
                  <option value="15m">15m — Intraday Structure (Recommended)</option>
                  <option value="1h">1h — Swing Framework</option>
                  <option value="4h">4h — Macro Structure</option>
                  <option value="1D">1D — Daily Value Area</option>
                </select>
                <p className="text-[10px] text-muted-foreground">Structure and candle evaluation timeframe.</p>
              </div>

              {/* Frequency / Cooldown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Alert Frequency & Cooldown
                </label>
                <select
                  value={assetSettings[selectedAsset]?.frequency || '5m'}
                  onChange={(e) => updateAssetSetting(selectedAsset, 'frequency', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-gold focus:outline-none"
                >
                  <option value="instant">Instant (Every valid event)</option>
                  <option value="5m">5 Minutes (Anti-spam cooldown)</option>
                  <option value="15m">15 Minutes</option>
                  <option value="30m">30 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="daily">Daily Digest Only</option>
                </select>
                <p className="text-[10px] text-muted-foreground">Suppresses duplicate alerts within window.</p>
              </div>
            </div>

            {/* Confidence Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Minimum Confidence Score Threshold
                </label>
                <span className="text-xs font-bold font-mono text-gold">
                  {assetSettings[selectedAsset]?.minConfidence || 80}/100
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                step="5"
                value={assetSettings[selectedAsset]?.minConfidence || 80}
                onChange={(e) =>
                  updateAssetSetting(selectedAsset, 'minConfidence', parseInt(e.target.value, 10))
                }
                className="w-full accent-gold cursor-pointer"
              />
              <p className="text-[10px] text-muted-foreground">
                Signals below this quantitative confluence rating will be filtered to maintain high accuracy.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              {saveFeedback && (
                <span className="text-xs text-emerald-400 font-mono">{saveFeedback}</span>
              )}
              <button
                onClick={handleSavePreferences}
                disabled={isSavingConfig}
                className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-bold transition cursor-pointer"
              >
                {isSavingConfig ? 'Saving...' : '💾 Save Asset Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MESSAGE PREVIEW ── */}
      {activeTab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Telegram Message Layout Specification
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every dispatched alert follows strict institutional standards: verified data feeds, timestamp in Indian Standard Time (IST), precise setup parameters with justification, and quantitative confidence scores.
            </p>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Asset & Exchange</span>
                <span className="text-foreground font-semibold">{selectedAsset} (Binance & Delta India)</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Timestamp Format</span>
                <span className="text-foreground font-semibold">DD-MMM-YYYY, hh:mm:ss IST</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Market Bias</span>
                <span className="text-emerald-400 font-semibold">BULLISH / BEARISH / WAIT</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Risk/Reward Guardrail</span>
                <span className="text-gold font-semibold">Minimum 1:2.0 Justified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Data Integrity</span>
                <span className="text-emerald-400 font-semibold">100% Live Telemetry (No Fakes)</span>
              </div>
            </div>

            <button
              onClick={() => handleSendTestAlert('liquidity_sweep')}
              disabled={isSendingTest || !chatIdInput}
              className="w-full rounded-lg bg-gold hover:bg-gold/90 text-primary-foreground py-2.5 text-xs font-bold transition shadow cursor-pointer text-center"
            >
              Dispatch This Preview to Your Telegram Now
            </button>
          </div>

          {/* Simulated Telegram Chat Bubble */}
          <div className="rounded-xl border border-border bg-[#0e1621] p-4 text-[#e1e3e6] shadow-xl font-sans relative">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2.5 mb-3 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Telegram Message Preview • @{connectionStatus.botUsername}</span>
            </div>

            <div className="bg-[#182533] p-3.5 rounded-lg border border-white/5 space-y-2 text-xs font-mono">
              <p className="text-amber-400 font-bold">
                🚨 {selectedAsset}/USDT — LIQUIDITY SWEEP DETECTED
              </p>
              <div className="border-t border-white/10 pt-1.5 space-y-1 text-[11px] text-white/90">
                <p><span className="text-white/60">Asset & Exchange:</span> {selectedAsset} (Binance Spot & Delta India)</p>
                <p><span className="text-white/60">Current Price:</span> <span className="text-amber-300 font-bold">{getAssetPriceDisplay(selectedAsset).price}</span></p>
                <p><span className="text-white/60">Timestamp:</span> {istTime || '13-Oct-2026, 08:15:20 PM IST'}</p>
                <p><span className="text-white/60">Detected Condition:</span> Buy-side sweep of 4H resistance followed by delta absorption.</p>
                <p><span className="text-white/60">Market Bias:</span> <span className="text-emerald-400 font-bold">🟢 BULLISH REVERSAL (Confirmed)</span></p>
              </div>

              <div className="bg-black/30 rounded p-2 text-[11px] space-y-1 text-white/90 border border-white/5">
                <p className="font-bold text-gold">Institutional Execution Setup (R:R 1:2.65):</p>
                <p>• Entry Zone: Pullback within prior candle range</p>
                <p>• Invalidation Level: Below sweep low (-0.85%)</p>
                <p>• Take Profit 1 (TP1): +1.50%</p>
                <p>• Take Profit 2 (TP2): +2.80%</p>
              </div>

              <div className="text-[10px] text-white/60 space-y-0.5 pt-1">
                <p>Confidence Score: <span className="text-white font-bold">89/100</span> (Volume + SMC + DXY Confluence)</p>
                <p>Data Freshness: Live WebSocket & REST (Signal Confirmed ✅)</p>
              </div>

              <div className="border-t border-white/10 pt-1 text-[10px] text-white/40 italic">
                IshantMacro.Ai — “See the Flow. Read the Market. Trade with Clarity.”
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: ALERT DELIVERY HISTORY ── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Real-time Alert Audit Log
            </h3>
            <button
              onClick={loadHistory}
              className="text-xs text-gold hover:underline cursor-pointer"
            >
              🔄 Refresh Log
            </button>
          </div>

          {alertHistory.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
              No alerts logged yet. Click <span className="text-gold font-semibold">Test Telegram Alert</span> to verify the delivery pipeline.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Event / Alert Type</th>
                    <th className="py-2.5 px-3">IST Timestamp</th>
                    <th className="py-2.5 px-3">Bias</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {alertHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-secondary/20">
                      <td className="py-2 px-3 font-bold text-foreground">{h.asset}</td>
                      <td className="py-2 px-3 text-muted-foreground">{h.alert_type}</td>
                      <td className="py-2 px-3 text-muted-foreground">{h.ist_timestamp}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            h.bias?.includes('BULL')
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : h.bias?.includes('BEAR')
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {h.bias?.split(' ')[0] || 'NEUTRAL'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gold font-bold">{h.confidence}/100</td>
                      <td className="py-2 px-3">
                        <span className="text-emerald-400 font-bold">
                          {h.status === 'DELIVERED' ? 'Delivered ✅' : h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── BOT PROFILE & QR CODE MODAL ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-sky-500/40 bg-[#080d1a] p-6 shadow-2xl text-center space-y-4">
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary cursor-pointer"
            >
              ✕
            </button>

            {/* Profile Avatar with Verified Badge */}
            <div className="relative inline-block mx-auto mt-2">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-900 font-extrabold text-xs shadow-xl border-2 border-slate-600">
                <span className="text-[12px] font-bold">ishantmacro.ai</span>
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full bg-[#080d1a] p-0.5">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#2AABEE" />
                  <path d="M9.5 16.5l-3.5-3.5 1.41-1.41L9.5 13.67l7.09-7.09L18 8z" fill="#ffffff" />
                </svg>
              </div>
            </div>

            {/* Bot Title & Verified Checkmark */}
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  ISHANTMACRO.AI
                </h3>
                {/* Official Telegram Blue Checkmark */}
                <svg className="w-5 h-5 drop-shadow" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#2AABEE" />
                  <path d="M9.5 16.5l-3.5-3.5 1.41-1.41L9.5 13.67l7.09-7.09L18 8z" fill="#ffffff" />
                </svg>
              </div>
              <p className="text-xs text-sky-400 font-mono mt-0.5">
                @{connectionStatus.botUsername}
              </p>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                ISHANTMACRO.AI — 24/7 Market Radar &amp; AI Trading Assistant
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-xl inline-block shadow-inner mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://t.me/${connectionStatus.botUsername}?start=ishant_terminal`)}`}
                alt="Telegram Bot QR Code"
                className="w-44 h-44 mx-auto rounded"
              />
            </div>

            <p className="text-[11px] text-muted-foreground font-mono">
              Scan with Telegram or camera to open bot instantly
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`https://t.me/${connectionStatus.botUsername}?start=ishant_terminal`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] hover:bg-[#1e8ec3] text-white py-2.5 px-4 text-xs font-bold transition shadow-md"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.74-.56 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.15 3.35-1.35 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.19-.03.36z" />
                </svg>
                Open in Telegram App
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground py-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramAiAlertsView;
