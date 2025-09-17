@echo off
setlocal enableextensions

pushd "%~dp0"

echo Creating Desktop shortcut for Electronic Industry Agent ...

set "PS=PowerShell -NoProfile -ExecutionPolicy Bypass -File"
%PS% "%cd%\create-windows-shortcut.ps1" "Electronic Industry Agent"
if errorlevel 1 (
  echo [ERROR] Failed to create shortcut. You may run PowerShell manually:
  echo   PowerShell -NoProfile -ExecutionPolicy Bypass -File "%cd%\create-windows-shortcut.ps1"
  pause
  popd
  endlocal
  exit /b 1
)

echo [OK] Shortcut created on your Desktop.
echo You can now double-click the shortcut to start the app.

pause
popd
endlocal
exit /b 0
