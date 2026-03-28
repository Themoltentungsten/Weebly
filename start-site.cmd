@echo off
title Weebly - start site
cd /d "%~dp0"
echo Starting API (5000) and frontend (5173)...
call npm run start
pause
