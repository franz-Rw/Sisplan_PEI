@echo off
echo "Iniciando Sisplan PEI - Desarrollo"
echo "=================================="

echo "Matando procesos existentes..."
taskkill /F /IM node.exe 2>nul

echo "Iniciando backend..."
cd /d "d:\Sisplan_PEI\backend"
start cmd /k "npm start"

echo "Esperando 5 segundos para que backend inicie..."
timeout /t 5 /nobreak >nul

echo "Iniciando frontend..."
cd /d "d:\Sisplan_PEI\frontend"
start cmd /k "npm run dev"

echo "Verificando puertos..."
timeout /t 3 /nobreak >nul
netstat -ano | findstr ":3000\|:5173"

echo "=================================="
echo "Sistema listo!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo "=================================="
pause
