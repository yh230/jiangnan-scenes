@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20.19+ is required. Please install Node.js first.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

echo.
echo Starting Jiangnan Scenes. Vite will print the local address and open the browser.
echo Press Ctrl+C to stop the server.
echo.
call npm run dev -- --open
