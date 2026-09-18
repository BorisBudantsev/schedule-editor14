@echo off
echo Запуск HTTP-сервера Python на порту 8000...
start http://localhost:8000
python -m http.server 8000
pause