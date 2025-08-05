#!/bin/bash

# Enhanced Jet Lag Recovery Tracker v2.0 Setup Script
# Automates the setup process for the enhanced tracker

echo "🚀 Enhanced Jet Lag Recovery Tracker v2.0 Setup"
echo "=============================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Creating environment configuration..."
    cat > .env << EOL
# Enhanced Jet Lag Recovery Tracker Configuration
PORT=3001
NODE_ENV=development

# Optional: Set these for production deployment
# CORS_ORIGIN=https://yourdomain.com
# LOG_LEVEL=info

# API Rate Limiting (requests per minute)
OURA_RATE_LIMIT=60

# Data Processing
MAX_ANALYSIS_DAYS=14
DEFAULT_BASELINE_HR=52
DEFAULT_BASELINE_SLEEP_EFFICIENCY=88

# Airport Database
AIRPORT_DATABASE_VERSION=2.0
EOL
    echo "✅ Environment file created (.env)"
else
    echo "✅ Environment file already exists"
fi

# Test the setup
echo ""
echo "🧪 Testing setup..."
if npm run start &>/dev/null & then
    SERVER_PID=$!
    sleep 3
    
    if curl -s http://localhost:3001/api/health &>/dev/null; then
        echo "✅ Server started successfully"
        kill $SERVER_PID 2>/dev/null
    else
        echo "❌ Server test failed"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
else
    echo "❌ Failed to start server"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Get your Ōura API token from: https://cloud.ouraring.com/personal-access-tokens"
echo "   2. Start the server: npm run dev"
echo "   3. Open your browser to: http://localhost:3001"
echo "   4. Test your API connection in the app"
echo "   5. Select your travel route using airport codes"
echo "   6. Start your enhanced recovery analysis"
echo ""
echo "✈️  Supported airports include:"
echo "   • UK: LHR, LGW, STN, MAN, EDI"
echo "   • US: LAX, SFO, JFK, ORD, DFW"  
echo "   • Europe: CDG, FRA, AMS, MAD"
echo "   • Asia: NRT, ICN, SIN, HKG"
echo "   • Australia: SYD, MEL, PER"
echo ""
echo "🆕 New in v2.0:"
echo "   • Airport-based route calculation"
echo "   • Activity-adjusted recovery metrics"
echo "   • Component breakdown analysis"
echo "   • Enhanced recommendations engine"
echo ""
echo "Happy tracking! 📊"