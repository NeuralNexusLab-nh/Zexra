@echo off
cd /d "%~dp0"
node tools\serve.mjs --open
if errorlevel 1 pause
