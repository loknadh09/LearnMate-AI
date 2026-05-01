@echo off
echo Starting LearnMate AI Backend...
cd /d "%~dp0app"
call .\..\venv\Scripts\activate 2>nul || call .\..\\.venv\Scripts\activate 2>nul
echo.
echo Backend running at http://localhost:8000
echo Open frontend\index.html in your browser
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
