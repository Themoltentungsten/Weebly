@echo off
title Weebly - database browser
cd /d "%~dp0"
echo Opens pgweb at http://127.0.0.1:8081  (requires DATABASE_URL in backend\.env)
call npm run db:web
pause
