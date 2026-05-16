@echo off
setlocal
echo Installing LM Studio if it is not already installed...
winget install --id LMStudio.LMStudio -e --accept-source-agreements --accept-package-agreements
echo.
echo After installation:
echo 1. Open LM Studio.
echo 2. Download or import a vision-capable model.
echo 3. Load the model.
echo 4. Return to Local Prompt Studio and click Refresh.
pause
