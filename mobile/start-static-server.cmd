@echo off
setlocal
set "USERPROFILE=%~dp0.expo-user"
set "HOME=%USERPROFILE%"
set "NODE_OPTIONS=--use-system-ca"
cd /d "%~dp0"
start "" /b "C:\Program Files\nodejs\node.exe" "serve-dist.js"
