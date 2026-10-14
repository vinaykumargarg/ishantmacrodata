/**
 * ISHANT MACRO AI TERMINAL — TELEGRAM ALERT API SERVICE (Node.js)
 * Port: 5055
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...vals] = line.split('=');
      process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Researchsomething_bot';
const PORT = parseInt(process.env.TELEGRAM_SERVER_PORT || '5055', 10);

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
        'User-Agent': 'IshantMacro-Node/1.0'
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

// In-memory subscribers & history store (or fallback file store)
const memoryStore = {
  subscribers: new Map(),
  history: []
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    let payload = {};
    if (body) {
      try { payload = JSON.parse(body); } catch (e) {}
    }

    if (pathname === '/api/telegram/status' && req.method === 'GET') {
      const me = await telegramRequest('getMe');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        configured: Boolean(BOT_TOKEN),
        bot_info: me.result || {},
        bot_username: BOT_USERNAME,
        subscribers_count: memoryStore.subscribers.size,
        ist_time: getIstTime(),
        service_status: 'ONLINE'
      }));
      return;
    }

    if (pathname === '/api/telegram/verify' && req.method === 'POST') {
      const chatId = String(payload.chat_id || '').trim();
      if (!chatId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Chat ID is required' }));
        return;
      }

      const testMsg = `🤖 *IshantMacro.Ai — Connection Verified!*
━━━━━━━━━━━━━━━━━━━━━━━━━
Your terminal session has successfully connected to @${BOT_USERNAME}.
• *Chat ID:* \`${chatId}\`
• *Time:* \`${getIstTime()}\`
• *Feeds:* Delta Exchange India & Binance LIVE

You will receive real-time institutional market alerts.
━━━━━━━━━━━━━━━━━━━━━━━━━
_“See the Flow. Read the Market. Trade with Clarity.”_`;

      const tgRes = await telegramRequest('sendMessage', {
        chat_id: chatId,
        text: testMsg,
        parse_mode: 'Markdown'
      });

      if (tgRes.ok) {
        memoryStore.subscribers.set(chatId, { chatId, connectedAt: new Date().toISOString() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          verified: true,
          chat_id: chatId,
          message: 'Connection verified and test message delivered to Telegram.'
        }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: false,
          verified: false,
          error: tgRes.description || 'Failed to send message to chat_id',
          hint: `Please open https://t.me/${BOT_USERNAME} and press /start first.`
        }));
      }
      return;
    }

    if (pathname === '/api/telegram/test-alert' && req.method === 'POST') {
      const chatId = String(payload.chat_id || '').trim();
      const asset = payload.asset || 'BTC';
      const alertType = payload.alert_type || 'liquidity_sweep';

      if (!chatId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Chat ID required' }));
        return;
      }

      const alertMsg = `🚨 *${asset}/USDT — LIQUIDITY SWEEP DETECTED*
━━━━━━━━━━━━━━━━━━━━━━━━━
*Asset & Exchange:* ${asset} (Binance & Delta Exchange India)
*Price:* Live Market Price
*Timestamp:* \`${getIstTime()}\`
*Event:* Buy-Side Liquidity (BSL) Sweep & Reclaim
*Confirmation:* Spot CVD absorption, 2.1x 20-MA volume, 15m structural CHoCH
*Bias:* 🟢 BULLISH REVERSAL (Confirmed)
*Execution Setup (R:R 1:2.65):*
• Entry Zone: Pullback within prior candle range
• Invalidation / SL: Below sweep low (-0.85%)
• Target TP1: +1.50% | TP2: +2.80%
*Confidence Score:* \`89/100\` (Quantitative Multi-Factor)
*Data Freshness:* Live REST & WebSocket Telemetry
━━━━━━━━━━━━━━━━━━━━━━━━━
*IshantMacro.Ai — Institutional Intelligence*`;

      const tgRes = await telegramRequest('sendMessage', {
        chat_id: chatId,
        text: alertMsg,
        parse_mode: 'Markdown'
      });

      if (tgRes.ok) {
        const item = {
          id: 'ALERT-' + Date.now(),
          chat_id: chatId,
          asset,
          alert_type: alertType,
          bias: '🟢 BULLISH REVERSAL',
          confidence: 89,
          status: 'DELIVERED',
          ist_timestamp: getIstTime()
        };
        memoryStore.history.unshift(item);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, delivered: true, alert: item }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: tgRes.description }));
      }
      return;
    }

    if (pathname === '/api/telegram/history' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, history: memoryStore.history }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Not found' }));
  });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Node Telegram Alert Service listening on http://127.0.0.1:${PORT}`);
  });
}

module.exports = { server, telegramRequest };
