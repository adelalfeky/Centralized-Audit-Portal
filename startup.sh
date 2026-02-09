#!/bin/bash
# Quick Startup Script for KPMG GRC Audit Portal with Server-Side Storage

echo "======================================"
echo "KPMG GRC Audit Portal - Setup & Run"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Start the server
echo "🚀 Starting KPMG GRC Audit Portal Server..."
echo "   Server will run on: http://localhost:5000"
echo ""
echo "📝 Login Credentials:"
echo "   Admin:"
echo "      Username: admin@kpmg.com"
echo "      Password: Admin123"
echo ""
echo "   Director:"
echo "      Username: director@kpmg.com"
echo "      Password: Director123"
echo ""
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

npm start
