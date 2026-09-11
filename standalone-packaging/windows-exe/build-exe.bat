@echo off
echo ====================================================
echo  Building VSBEC IT Task Manager Windows EXE
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/2] Installing Desktop Packaging Dependencies...
call npm install --no-audit --prefer-offline

echo.
echo [2/2] Packaging Standalone Windows Executable (.exe)...
call npm run build

echo.
echo ====================================================
echo  Build complete! Check dist-electron folder for:
echo   - VSBEC IT Task Manager.exe (Portable)
echo   - VSBEC IT Task Manager Setup.exe (Installer)
echo ====================================================
pause
