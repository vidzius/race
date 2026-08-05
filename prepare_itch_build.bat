@echo off
setlocal
cd /d "%~dp0"

set /p "RENDER_URL=Paste your public Render URL (https://...onrender.com): "

where py >nul 2>nul
if %errorlevel%==0 (
  py prepare_itch_build.py "%RENDER_URL%"
) else (
  python prepare_itch_build.py "%RENDER_URL%"
)

echo.
pause
endlocal
