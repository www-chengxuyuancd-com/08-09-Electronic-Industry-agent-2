@echo off
setlocal enableextensions

title Electronic Industry Agent - Launcher

REM Change to the directory of this script (project root)
pushd "%~dp0"

echo ================================================================
echo  Electronic Industry Agent - Windows Launcher
echo ================================================================

REM --- Check Python 3.12+ (prefer Windows launcher: py -3.13 or -3.12) ---
set "PY_CMD="
py -3.13 -V >nul 2>&1 && set "PY_CMD=py -3.13"
if "%PY_CMD%"=="" py -3.12 -V >nul 2>&1 && set "PY_CMD=py -3.12"
if "%PY_CMD%"=="" (
  echo [ERROR] Python 3.12+ is required (3.12 or 3.13).
  echo         Please install from https://www.python.org/downloads/
  echo         Tip: Install the Windows Python launcher and Python 3.13.x or 3.12.x
  pause
  exit /b 1
)

echo [OK] Using Python via: %PY_CMD%

REM --- Check Node.js ---
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is required. Please install from https://nodejs.org/
  pause
  exit /b 1
)
echo [OK] Node.js found

REM --- Check pnpm, install if missing ---
where pnpm >nul 2>&1
if errorlevel 1 (
  echo [INFO] pnpm not found. Installing globally via npm...
  where npm >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] npm not found. Please ensure Node.js (with npm) is installed.
    pause
    exit /b 1
  )
  call npm install -g pnpm
  where pnpm >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] Failed to install pnpm. Please install manually: npm i -g pnpm
    pause
    exit /b 1
  )
)
echo [OK] pnpm available

REM --- Create .env if missing ---
if not exist ".env" (
  echo [INFO] Creating default .env file ...
  > ".env" echo # Database Configuration
  >> ".env" echo DATABASE_URL=postgresql://username:password@localhost:5432/dbname
  >> ".env" echo.
  >> ".env" echo # LLM Configuration
  >> ".env" echo LLM_PROVIDER=openai
  >> ".env" echo OPENAI_API_KEY=your_openai_api_key_here
  >> ".env" echo OPENAI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
  >> ".env" echo OPENAI_MODEL=gpt-3.5-turbo
  >> ".env" echo.
  >> ".env" echo GEMINI_API_KEY=your_gemini_api_key_here
  >> ".env" echo GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
  >> ".env" echo.
  >> ".env" echo # Frontend Configuration
  >> ".env" echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
  echo [OK] .env created. Please update values if needed.
) else (
  echo [OK] .env already exists
)

REM --- Setup Python virtual environment ---
if not exist "venv\Scripts\python.exe" (
  echo [INFO] Creating Python virtual environment ...
  %PY_CMD% -m venv venv
  if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment.
    pause
    exit /b 1
  )
) else (
  echo [OK] Python virtual environment exists
)

REM --- Install Python dependencies ---
echo [INFO] Installing Python dependencies ...
"venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
  echo [ERROR] Failed to install Python dependencies.
  pause
  exit /b 1
)
echo [OK] Python dependencies installed

REM --- Install Node.js dependencies ---
echo [INFO] Installing Node.js dependencies (pnpm install) ...
pnpm install
if errorlevel 1 (
  echo [ERROR] Failed to install Node.js dependencies.
  pause
  exit /b 1
)
echo [OK] Node.js dependencies installed

REM --- Start backend in a new terminal window ---
echo [INFO] Starting backend (http://localhost:8000) ...
start "Electronic Industry Agent - Backend" cmd /k "cd /d \"%cd%\" ^&^& \"venv\Scripts\python.exe\" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

REM --- Small delay ---
ping 127.0.0.1 -n 3 >nul

REM --- Start frontend in a new terminal window ---
echo [INFO] Starting frontend (http://localhost:3000) ...
start "Electronic Industry Agent - Frontend" cmd /k "cd /d \"%cd%\" ^&^& pnpm dev"

REM --- Open default browser to frontend ---
start "" http://localhost:3000


echo.
echo ================================================================
echo  Electronic Industry Agent is starting.
echo  Frontend: http://localhost:3000
echo  Backend : http://localhost:8000  (API Docs: http://localhost:8000/docs)
echo ================================================================
echo.
echo This launcher window can be closed. The two service windows will stay open.
echo Press any key to exit this launcher...
pause >nul

popd
endlocal
exit /b 0
