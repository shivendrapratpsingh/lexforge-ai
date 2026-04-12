@echo off
title LexForge AI
color 0A
cd /d "%~dp0"

echo.
echo ============================================
echo   LexForge AI — Starting Dev Server
echo   http://localhost:3000
echo   Press Ctrl+C to stop
echo ============================================
echo.

call npm run dev
pause
