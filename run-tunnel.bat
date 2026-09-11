@echo off
echo ====================================================
echo   VSBEC IT Task Manager - Cloudflare Public Tunnel
echo ====================================================
echo.
echo [*] Make sure your local server is running (run.bat).
echo [*] Establishing secure worldwide tunnel to http://localhost:3000...
echo.
echo Look for the link ending in .trycloudflare.com below!
echo Anyone in the world on mobile data can use that URL.
echo ====================================================
echo.
if not exist "cloudflared.exe" (
    echo [*] Downloading cloudflared helper...
    curl.exe -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -o cloudflared.exe
)

.\cloudflared.exe tunnel --url http://localhost:3000
pause
