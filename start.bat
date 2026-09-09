@echo off
title Ganpati Bappa Booking System
echo.
echo ==================================================
echo   🌺 सदिच्छा कला केंद्र - गणपती बुकिंग सिस्टीम
echo ==================================================
echo.

REM Set PATH for Node.js
if exist "C:\nodejs\node.exe" (
    set "PATH=C:\nodejs;%PATH%"
    echo [OK] Using Node.js from C:\nodejs
)

REM --- Start Backend Server ---
echo [1/2] Starting FastAPI Backend (Port 8000)...
cd /d "%~dp0backend"
start "Ganpati Backend Server" cmd /k "python run.py"

REM --- Start Frontend Server ---
echo [2/2] Starting React Frontend (Port 5173)...
cd /d "%~dp0frontend"
start "Ganpati Frontend Server" cmd /k "set PATH=C:\nodejs;%%PATH%% && npm run dev"

REM Wait 3 seconds then open Browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ==================================================
echo  ✅ Application started successfully!
echo.
echo  App URL    : http://localhost:5173
echo  Admin URL  : http://localhost:5173/admin/login
echo  API Docs   : http://localhost:8000/docs
echo ==================================================
echo.
pause
