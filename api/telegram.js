/**
 * Vercel Serverless Function: /api/telegram
 */

const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Researchsomething_bot';

function getIstTime() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  return istDate.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  }) + ' IST';
}

function telegramRequest(method, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload || {});
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload ? Buffer.byteLength(data) : 0,
        'User-Agent': 'IshantMacro-Vercel/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ ok: false, description: body });
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, description: err.message }));
    if (payload) req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { action } = req.query;

  if (req.method === 'GET') {
    const me = await telegramRequest('getMe');
    return res.status(200).json({
      ok: true,
      configured: Boolean(BOT_TOKEN),
      bot_info: me.result || {},
      bot_username: BOT_USERNAME,
      ist_time: getIstTime(),
      service_status: 'ONLINE'
    });
  }

  if (req.method === 'POST') {
    const { chat_id, asset, alert_type } = req.body || {};

    if (action === 'verify' || req.url.includes('verify')) {
      if (!chat_id) return res.status(400).json({ ok: false, error: 'Chat ID required' });
      const testMsg = `🤖 *IshantMacro.Ai — Connection Verified!*
━━━━━━━━━━━━━━━━━━━━━━━━━
Your terminal session has successfully connected to @${BOT_USERNAME}.
• *Chat ID:* \`${chat_id}\`
• *Time:* \`${getIstTime()}\`
• *Feeds:* Delta Exchange India & Binance LIVE

You will receive real-time institutional market alerts.
━━━━━━━━━━━━━━━━━━━━━━━━━
_“See the Flow. Read the Market. Trade with Clarity.”_`;

      const tgRes = await telegramRequest('sendMessage', {
        chat_id: String(chat_id),
        text: testMsg,
        parse_mode: 'Markdown'
      });

      if (tgRes.ok) {
        return res.status(200).json({ ok: true, verified: true, chat_id });
      } else {
        return res.status(400).json({ ok: false, error: tgRes.description, hint: `Open https://t.me/${BOT_USERNAME} and send /start first.` });
      }
    }

    if (action === 'test-alert' || req.url.includes('test-alert')) {
      if (!chat_id) return res.status(400).json({ ok: false, error: 'Chat ID required' });
      const currentAsset = asset || 'BTC';
      const msg = `🚨 *${currentAsset}/USDT — LIQUIDITY SWEEP DETECTED*
━━━━━━━━━━━━━━━━━━━━━━━━━
*Asset & Exchange:* ${currentAsset} (Binance & Delta Exchange India)
*Price:* Live Market Price
*Timestamp:* \`${getIstTime()}\`
*Event:* Buy-Side Liquidity (BSL) Sweep & Rapid Absorption
*Bias:* 🟢 BULLISH REVERSAL (Confirmed via delta absorption)
*Execution Setup (R:R 1:2.65):*
• Entry Zone: Pullback within prior candle range
• Invalidation / SL: Below sweep low (-0.85%)
• Target TP1: +1.50% | TP2: +2.80%
*Confidence Score:* \`89/100\`
*Data Freshness:* Live REST & WebSocket Telemetry
━━━━━━━━━━━━━━━━━━━━━━━━━
*IshantMacro.Ai — Institutional Intelligence*`;

      const tgRes = await telegramRequest('sendMessage', {
        chat_id: String(chat_id),
        text: msg,
        parse_mode: 'Markdown'
      });

      if (tgRes.ok) {
        return res.status(200).json({ ok: true, delivered: true });
      } else {
        return res.status(400).json({ ok: false, error: tgRes.description });
      }
    }
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
};
