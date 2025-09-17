#!/bin/bash

# Simple starter: just run backend and frontend. No installs, no venv.

set -e

PYTHON_CMD="python3"
if ! command -v "$PYTHON_CMD" >/dev/null 2>&1; then
    PYTHON_CMD="python"
fi

echo "Starting backend on http://localhost:8000 ..."
$PYTHON_CMD -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:3000 ..."
pnpm dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend logs: tail -f backend.log"
echo "Frontend logs: tail -f frontend.log"
