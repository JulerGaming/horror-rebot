@echo off
cd /d %~dp0

echo Adding changes...
git add .

set /p msg=Enter commit message: 

echo Committing...
git commit -m "%msg%"

echo Pushing to GitHub...
git push

echo Done!
pause