@echo off
echo Starting MEAN Citizen Voice Application...

echo Starting Express backend...
start cmd /k "cd %~dp0 && npm start"

echo Starting Angular frontend...
start cmd /k "cd %~dp0angular-client && ng serve --open --port 4200"

echo MEAN Citizen Voice Application started!
echo Backend: http://localhost:4001
echo Frontend: http://localhost:4200