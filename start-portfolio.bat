
@echo off
title Yash Portfolio Launcher

cd /d "%~dp0"

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check if portfolio is already running
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000 -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"

if not errorlevel 1 (
    start "" http://localhost:3000
    exit /b
)

:: Start portfolio server in background
start "Yash Portfolio Server" /min cmd /c "cd /d ""%~dp0"" && node server.js >> ""%~dp0portfolio.log"" 2>&1"

:: Wait for server to become ready
echo Starting Yash Portfolio...

for /L %%i in (1,1,60) do (
    powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000 -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

    if not errorlevel 1 goto OPEN_SITE

    timeout /t 1 /nobreak >nul
)

echo Portfolio failed to start.
echo Check portfolio.log in your project folder.
pause
exit /b 1

:OPEN_SITE
start "" http://localhost:3000
exit /b
