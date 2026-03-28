@echo off
title Weebly - stop site
cd /d "%~dp0"
call npm run stop
pause
