@echo off
REM KPMG GRC Application - MySQL Quick Start Script

echo Starting KPMG GRC Application with MySQL...
echo.

REM Check if node is installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Checking MySQL connection...
echo Make sure MySQL is running and configured in .env file
echo.

REM Start the application
echo Starting server on http://localhost:5000
echo Login with: admin@kpmg.com / Admin123
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

pause
