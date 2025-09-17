# Creates a Desktop shortcut for start-windows.bat
param(
    [string]$ShortcutName = "Electronic Industry Agent"
)

$ErrorActionPreference = 'Stop'

# Resolve project root (directory of this script)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$batchPath = Join-Path $projectRoot 'start-windows.bat'

if (-not (Test-Path $batchPath)) {
  Write-Error "start-windows.bat not found at $batchPath"
}

# Determine Desktop path for current user
$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop ("$ShortcutName.lnk")

# Create WScript.Shell COM object to build .lnk
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($lnkPath)
$shortcut.TargetPath = 'cmd.exe'
$shortcut.Arguments = "/c \"`"$batchPath`"\""
$shortcut.WorkingDirectory = $projectRoot
$shortcut.IconLocation = "%SystemRoot%\\System32\\SHELL32.dll, 167"
$shortcut.Description = "Start Electronic Industry Agent (backend + frontend)"
$shortcut.Save()

Write-Host "Shortcut created: $lnkPath"
