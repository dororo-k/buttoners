@echo off
setlocal ENABLEDELAYEDEXPANSION

rem Default to DEV mode when no args are provided
set MODE=%*
if "%MODE%"=="" set MODE=dev

powershell -NoLogo -NoExit -ExecutionPolicy Bypass -File "%~dp0start.ps1" %MODE%
exit /b %ERRORLEVEL%
