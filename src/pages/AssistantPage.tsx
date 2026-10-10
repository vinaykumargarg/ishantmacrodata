import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello! I am your AI Global Macro & Crypto Assistant. Ask me anything about BTC cycles, Nifty/US stock setups, FOMC rate cut probabilities, or position sizing!",
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const samplePrompts = [
    "What is the current Global Market Score & Regime?",
    "Analyze NVDA vs RELIANCE AI trade setups",
    "How does the US Liquidity +$84B impact Bitcoin?",
    "Should I go long or short on ETH right now?"
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    // Dynamic AI response simulation
    setTimeout(() => {
      let aiText = `Based on current terminal metrics: The Global Market Score sits at 78/100 (Bullish Expansion). BTC is benefiting from +$420M ETF inflows and US Net Liquidity growth. High conviction setup detected on NVDA ($155 target) and HDFCBANK (breakout wedge). Recommend maintaining strict stop loss risk controls.`;
      
      const lowerQ = q.toLowerCase();
      if (lowerQ.includes('btc') || lowerQ.includes('bitcoin') || lowerQ.includes('eth')) {
        aiText = `Bitcoin ($68,450) is consolidating near key resistance. On-chain SOPR remains reset, MVRV Z-score is 2.14 (fair value), and Spot ETFs logged +$420.5M net inflow led by BlackRock IBIT. Upper liquidation magnet cluster is set at $72,500.`;
      } else if (lowerQ.includes('nvda') || lowerQ.includes('stock') || lowerQ.includes('reliance') || lowerQ.includes('nifty')) {
        aiText = `Stock Market Setup: NVDA is forming a Bullish Flag breakout above $130 with a target of $155 (SL: $122.50). For Nifty 100, RELIANCE is showing higher low structure pointing toward ₹3,050, supported by Jio ARPU expansion.`;
      } else if (lowerQ.includes('liquidity') || lowerQ.includes('fed') || lowerQ.includes('cpi')) {
        aiText = `Macro Liquidity Readout: TGA drawdowns have added +$84.2B net liquidity to the US banking system. FOMC rate cut expectations for Q4 stand at 92% probability of a 25-50bps cut. Risk-On assets (Crypto & Tech) retain strong macro tailwinds.`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 900);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-5 bg-gradient-to-r from-[var(--bg-card)] via-[#191e33] to-[var(--bg-card)] border-indigo-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              AI Macro Trading Assistant <Sparkles className="w-4 h-4 text-amber-400" />
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Powered by real-time terminal indicators, order flow data, and technical setup models.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2 text-xs">
        {samplePrompts.map((p, idx) => (
          <button
            key={`prompt-${idx}`}
            onClick={() => handleSend(p)}
            className="glass-panel px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-amber-300 hover:border-amber-500/40 transition-colors"
          >
            💬 {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="glass-panel p-4 h-[420px] flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl p-3 rounded-xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-black font-semibold rounded-tr-none'
                    : 'bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-tl-none'
                }`}
              >
                <div>{m.text}</div>
                <div className={`text-[9px] mt-1 ${m.sender === 'user' ? 'text-black/70' : 'text-[var(--text-subtle)]'}`}>
                  {m.timestamp}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold p-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing global liquidity & market setups...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-color)] mt-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Assistant about any stock, crypto, or macro indicator..."
            className="flex-1 bg-[var(--bg-main)] text-xs text-[var(--text-main)] px-4 py-2.5 rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleSend()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>
    </div>
  );
};
