@echo off
echo ========================================================
echo   PUBLISHING WEBSITE TO VERCEL (NO GITHUB REQUIRED)
echo ========================================================
echo.
echo Step 1: Building latest production bundle...
call npm run build
echo.
echo Step 2: Deploying to Vercel...
echo (If prompted, log in with your email/Google in the browser)
call npx vercel --prod
echo.
echo ========================================================
echo   DEPLOYMENT FINISHED! Your site is live.
echo ========================================================
pause
