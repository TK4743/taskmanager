@echo off
echo ====================================================
echo   VSBEC IT Task Manager - Local Server (Zero Vercel)
echo ====================================================
echo.
echo [*] PC Local URL:       http://localhost:3000
echo [*] Mobile Phone Wi-Fi: http://192.168.31.20:3000
echo.
echo Leave this window open while using the Mobile APK or Desktop App.
echo ====================================================
echo.
call npm run start
if %ERRORLEVEL% neq 0 (
    echo.
    echo Retrying with tsx directly...
    call npx tsx server.ts
)
pause
