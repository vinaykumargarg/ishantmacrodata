@echo off
title IshantMacro.Ai — 24/7 Telegram AI Market Radar
cd /d "%~dp0"
echo ===================================================
echo Starting IshantMacro.Ai 24/7 Telegram AI Radar...
echo - Two-Way Interactive AI Chat
echo - Bitcoin 1,000-Point Move Alerts
echo - Gold 50-Point Move Alerts
echo - Big Liquidation Cascade Tracker
echo - Whale & Institutional Order Flow Tracker
echo - Live Breaking News & Macro Events
echo - Daily 6:00 PM Summary
echo - Morning Bias at 9:00 AM IST
echo - Every 2 Hours Market Pulse
echo ===================================================
python server/telegram_alert_daemon.py
pause
