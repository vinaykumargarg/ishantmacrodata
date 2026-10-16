@echo off
chcp 65001 > nul
set PYTHONIOENCODING=utf-8
title IshantMacro.Ai — 24/7 Telegram AI Market Radar
cd /d "%~dp0"
echo ===================================================
echo Starting IshantMacro.Ai 24/7 Telegram AI Radar...
echo - Two-Way Interactive AI Chat (Instant replies to ANY question)
echo - Pre-6:00 AM Morning Full Market Overview (Daily 5:45 AM IST)
echo - Daily 6:00 PM Complete Market Summary (Daily 18:00 IST)
echo - Morning Market Bias at 9:00 AM IST
echo - Bitcoin 1,000-Point Move Alerts
echo - Gold 50-Point Move Alerts
echo - Big Liquidation Cascade Tracker
echo - Whale & Institutional Order Flow Tracker
echo - Live Breaking News & Macro Events
echo - Every 2 Hours Market Pulse
echo ===================================================
python server/telegram_alert_daemon.py
pause
