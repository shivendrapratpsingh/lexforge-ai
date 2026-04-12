@echo off
title LexForge AI — Setup
color 0A

:: Move to the folder where this batch file lives (the project root)
cd /d "%~dp0"

echo.
echo ============================================
echo   LexForge AI — First Time Setup
echo ============================================
echo.
echo Current folder: %CD%
echo.

:: Check package.json exists
if not exist "package.json" (
  echo ERROR: package.json not found.
  echo Make sure this file is in your lexforge-ai project folder.
  pause
  exit /b 1
)

:: Check .env.local exists
if not exist ".env.local" (
  echo ERROR: .env.local not found.
  echo Create it with your DATABASE_URL, AUTH_SECRET, and GROQ_API_KEY.
  pause
  exit /b 1
)

echo [CLEAN] Removing old node_modules and package-lock.json...
if exist "node_modules" (
  rmdir /s /q "node_modules"
  echo    Deleted node_modules
)
if exist "package-lock.json" (
  del /f /q "package-lock.json"
  echo    Deleted package-lock.json
)
echo.

echo [1/4] Installing dependencies (Prisma 5)...
call npm install
if %errorlevel% neq 0 (
  echo ERROR: npm install failed.
  pause
  exit /b 1
)

echo.
echo [ENV]  Copying .env.local to .env so Prisma can read it...
copy /y ".env.local" ".env" >nul
echo    Done.

echo.
echo [2/4] Generating Prisma client...
call npx prisma generate --schema=prisma/schema.prisma
if %errorlevel% neq 0 (
  echo ERROR: prisma generate failed.
  del /f /q ".env" >nul 2>&1
  pause
  exit /b 1
)

echo.
echo [3/4] Pushing database schema to Neon...
call npx prisma db push --schema=prisma/schema.prisma
if %errorlevel% neq 0 (
  echo ERROR: prisma db push failed. Check your DATABASE_URL in .env.local
  del /f /q ".env" >nul 2>&1
  pause
  exit /b 1
)

echo.
echo [ENV]  Cleaning up temporary .env file...
del /f /q ".env" >nul 2>&1

echo.
echo [4/4] Starting LexForge AI...
echo.
echo ============================================
echo   App running at: http://localhost:3000
echo   Press Ctrl+C to stop the server
echo ============================================
echo.
call npm run dev
pause
