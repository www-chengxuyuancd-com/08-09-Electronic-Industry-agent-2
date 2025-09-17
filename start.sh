#!/bin/bash

# Electronic Industry Agent Startup Script
# Starts both frontend (Next.js) and backend (Python FastAPI) services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print colored output
print_colored() {
    echo -e "${1}${2}${NC}"
}

# Function to check command availability
check_command() {
    if command -v "$1" &> /dev/null; then
        print_colored "$GREEN" "✅ $1 is installed"
        return 0
    else
        print_colored "$RED" "❌ $1 is not installed"
        return 1
    fi
}

# Function to cleanup processes on exit
cleanup() {
    print_colored "$YELLOW" "\n🛑 Stopping all services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_colored "$GREEN" "✅ Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        print_colored "$GREEN" "✅ Frontend stopped"
    fi
    print_colored "$GREEN" "👋 Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_colored "$BOLD" "🚀 Electronic Industry Agent Startup Script"
print_colored "$BOLD" "=================================================="

# Check prerequisites
print_colored "$BLUE" "🔍 Checking prerequisites..."

# Check Python 3.12+
if python3 --version | grep -q "Python 3.1[2-9]"; then
    PYTHON_VERSION=$(python3 --version)
    print_colored "$GREEN" "✅ $PYTHON_VERSION detected"
    PYTHON_CMD="python3"
elif python --version 2>&1 | grep -q "Python 3.1[2-9]"; then
    PYTHON_VERSION=$(python --version 2>&1)
    print_colored "$GREEN" "✅ $PYTHON_VERSION detected"
    PYTHON_CMD="python"
else
    print_colored "$RED" "❌ Python 3.12+ required"
    print_colored "$YELLOW" "Please install Python 3.12 or higher"
    exit 1
fi

# Check Node.js
if ! check_command "node"; then
    print_colored "$YELLOW" "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check pnpm
if ! check_command "pnpm"; then
    print_colored "$YELLOW" "Installing pnpm..."
    npm install -g pnpm
    if ! check_command "pnpm"; then
        print_colored "$RED" "❌ Failed to install pnpm"
        exit 1
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_colored "$BLUE" "📝 Creating .env file..."
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# LLM Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-3.5-turbo

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF
    print_colored "$GREEN" "✅ .env file created"
    print_colored "$YELLOW" "⚠️  Please update the .env file with your actual configuration"
else
    print_colored "$GREEN" "✅ .env file already exists"
fi

# Python dependencies setup (use existing venv if present; otherwise system Python)
print_colored "$BLUE" "📦 Checking Python virtual environment..."
if [ -d "venv" ]; then
    print_colored "$GREEN" "✅ Virtual environment found"
else
    print_colored "$YELLOW" "ℹ️ No virtual environment found; will use system Python"
fi

# Install Python dependencies
print_colored "$BLUE" "📦 Installing Python dependencies..."
if [ -d "venv" ]; then
    if source venv/bin/activate && pip install -r requirements.txt; then
        print_colored "$GREEN" "✅ Python dependencies installed"
        VENV_PYTHON="./venv/bin/python"
    else
        print_colored "$RED" "❌ Failed to install Python dependencies"
        exit 1
    fi
else
    if $PYTHON_CMD -m pip install -r requirements.txt; then
        print_colored "$GREEN" "✅ Python dependencies installed (system Python)"
    else
        print_colored "$RED" "❌ Failed to install Python dependencies (system Python)"
        exit 1
    fi
fi

# Install Node.js dependencies
print_colored "$BLUE" "📦 Installing Node.js dependencies..."
if pnpm install; then
    print_colored "$GREEN" "✅ Node.js dependencies installed"
else
    print_colored "$RED" "❌ Failed to install Node.js dependencies"
    exit 1
fi

# Start backend
print_colored "$BLUE" "🚀 Starting Python backend on http://localhost:8000"
if [ -n "$VENV_PYTHON" ]; then
    $VENV_PYTHON -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
else
    $PYTHON_CMD -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
fi
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_colored "$RED" "❌ Backend failed to start. Check backend.log for details."
    exit 1
fi

# Start frontend
print_colored "$GREEN" "🚀 Starting Next.js frontend on http://localhost:3000"
pnpm dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is still running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_colored "$RED" "❌ Frontend failed to start. Check frontend.log for details."
    cleanup
    exit 1
fi

print_colored "$BOLD" "\n================================================================"
print_colored "$BOLD" "🎉 Electronic Industry Agent is running!"
print_colored "$GREEN" "Frontend: http://localhost:3000"
print_colored "$BLUE" "Backend:  http://localhost:8000"
print_colored "$BLUE" "API Docs: http://localhost:8000/docs"
print_colored "$BOLD" "================================================================"
print_colored "$YELLOW" "\nLogs:"
print_colored "$YELLOW" "Backend: tail -f backend.log"
print_colored "$YELLOW" "Frontend: tail -f frontend.log"
print_colored "$YELLOW" "\nPress Ctrl+C to stop all services"

# Keep script running and monitor processes
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_colored "$RED" "❌ Backend process died unexpectedly"
        cleanup
        exit 1
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_colored "$RED" "❌ Frontend process died unexpectedly"
        cleanup
        exit 1
    fi
    
    sleep 5
done
