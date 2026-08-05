@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  set "PYTHON_CMD=py"
) else (
  set "PYTHON_CMD=python"
)

if not exist ".venv\Scripts\python.exe" (
  echo Creating the local Python environment...
  %PYTHON_CMD% -m venv .venv || goto :error
)

call ".venv\Scripts\activate.bat" || goto :error
python -m pip install -r requirements.txt || goto :error
echo.
echo Open http://127.0.0.1:8765 in your browser.
echo Keep this window open while playing.
echo.
python server.py
goto :end

:error
echo.
echo Could not start Neon Scramble. Check that Python 3.11 or newer is installed.
pause

:end
endlocal
