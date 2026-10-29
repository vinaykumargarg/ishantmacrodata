@echo off
echo ========================================================
echo   PUBLISHING WEBSITE TO SURGE.SH (NO GITHUB REQUIRED)
echo ========================================================
echo.
echo Step 1: Building production bundle...
call npm run build
copy /y dist\index.html dist\200.html >nul
echo.
echo Step 2: Deploying dist to Surge...
call npx surge dist
echo.
echo ========================================================
echo   DEPLOYMENT FINISHED!
echo ========================================================
pause
