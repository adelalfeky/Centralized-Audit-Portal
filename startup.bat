@echo off
REM Quick Startup Script for KPMG GRC Audit Portal with Server-Side Storage (Windows)

echo ======================================
echo KPMG GRC Audit Portal - Setup ^& Run
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] Node.js is not installed. 
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo [OK] Node.js version: %NODE_VERSION%
echo [OK] npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo [INFO] Installing dependencies...
call npm install >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Dependencies installed successfully
) else (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo.

REM Start the server
echo [INFO] Starting KPMG GRC Audit Portal Server...
echo Server will run on: http://localhost:5000
echo.
echo Login Credentials:
echo [ADMIN]
echo    Username: admin@kpmg.com
echo    Password: Admin123
echo.
echo [DIRECTOR]
echo    Username: director@kpmg.com
echo    Password: Director123
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start
pause
