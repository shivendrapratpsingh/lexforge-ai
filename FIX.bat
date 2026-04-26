@echo off
title LexForge AI — Fix & Restart
color 0A
cd /d "%~dp0"

echo.
echo ============================================
echo   LexForge AI — Fix Script v2
echo   Fixes: Prisma version + DB setup
echo ============================================
echo.

if not exist "package.json" (
  echo ERROR: package.json not found.
  pause
  exit /b 1
)

if not exist ".env.local" (
  echo ERROR: .env.local not found.
  pause
  exit /b 1
)

:: Step 1 — Remove old incompatible node_modules
echo [1/5] Removing old node_modules (Prisma 7 was incompatible)...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del /f /q "package-lock.json"
echo    Done.
echo.

:: Step 2 — Fresh install with Prisma 5
echo [2/5] Installing dependencies (Prisma 5)...
call npm install
if %errorlevel% neq 0 (
  echo ERROR: npm install failed. Check your internet connection.
  pause
  exit /b 1
)
echo    Done.
echo.

:: Step 3 — Copy env for Prisma CLI
echo [3/5] Setting up environment for Prisma...
copy /y ".env.local" ".env" >nul
echo    Done.
echo.

:: Step 4 — Generate Prisma client
echo [4/5] Generating Prisma client...
call npx prisma generate --schema=prisma/schema.prisma
if %errorlevel% neq 0 (
  echo ERROR: prisma generate failed.
  del /f /q ".env" >nul 2>&1
  pause
  exit /b 1
)
echo    Prisma client generated!
echo.

:: Step 5 — Push schema to database
echo [5/5] Pushing schema to database...
call npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
if %errorlevel% neq 0 (
  echo WARNING: db push failed. Check DATABASE_URL and internet connection.
) else (
  echo    Database ready!
)
echo.

:: Clean up
del /f /q ".env" >nul 2>&1

:: Clear Next.js cache
if exist ".next\cache" rmdir /s /q ".next\cache" >nul 2>&1

echo ============================================
echo   FIXED! Starting LexForge AI...
echo   Open browser: http://localhost:3000
echo   Press Ctrl+C to stop
echo ============================================
echo.
call npm run dev
pause
