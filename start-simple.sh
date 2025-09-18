#!/bin/bash

# Simple starter: just run backend and frontend. No installs, no venv.

set -e

PYTHON_CMD="python3"
if ! command -v "$PYTHON_CMD" >/dev/null 2>&1; then
    PYTHON_CMD="python"
fi

# Ensure Python prints logs unbuffered so output appears immediately in Git Bash/TTY
export PYTHONUNBUFFERED=1

echo "Starting backend on http://localhost:8000 ..."
(cd backend && $PYTHON_CMD -u main.py) &

echo "Starting frontend on http://localhost:3000 ..."
pnpm dev

echo "(Frontend exited. Backend keeps running in background; press Ctrl+C to stop frontend, then kill backend if needed.)"
