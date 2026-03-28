@echo off
title Weebly - PostgreSQL shell
cd /d "%~dp0"
call npm run db:shell
