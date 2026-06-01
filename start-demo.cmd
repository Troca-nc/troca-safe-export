@echo off
setlocal

cd /d "%~dp0"

if not exist ".env" (
  copy /Y ".env.demo" ".env" >nul
)

call "%ProgramFiles%\nodejs\npm.cmd" run migrate
if errorlevel 1 exit /b %errorlevel%

call "%ProgramFiles%\nodejs\npm.cmd" run seed
if errorlevel 1 exit /b %errorlevel%

call "%ProgramFiles%\nodejs\npm.cmd" run dev
exit /b %errorlevel%
