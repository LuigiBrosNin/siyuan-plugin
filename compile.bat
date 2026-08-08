@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title SiYuan GitHub Sync - Compilation et Deploiement

set "PLUGIN_NAME=siyuan-github-sync"
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

rem === Chemin de deploiement SiYuan ===
set "DEPLOY_DIR=C:\Users\Cyprien\Documents\siyuan cours\data\plugins\%PLUGIN_NAME%"

set "MODE=%1"
if not "%MODE%"=="" goto :run

echo.
echo  ================================================
echo    SiYuan GitHub Sync - Menu
echo  ================================================
echo.
echo    1) Test    - Compiler + deployer dans SiYuan
echo    2) Publier - Compiler + creer package.zip
echo.
set /p choix="  Choix [1/2] : "
if "%choix%"=="2" ( set "MODE=publish" ) else ( set "MODE=test" )

:run
echo.
echo  ================================================
if "%MODE%"=="publish" (
    echo    SiYuan GitHub Sync  -  Publication
) else (
    echo    SiYuan GitHub Sync  -  Build et Deploiement
)
echo  ================================================
echo.

echo [1/3]  Verification des dependances npm...
if not exist "%SCRIPT_DIR%\node_modules" (
    echo        Installation des modules...
    call npm install
)
echo        OK - Dependances pretes.
echo.

echo [2/3]  Compilation...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo  ERREUR : La compilation a echoue !
    pause
    exit /b 1
)
echo        OK - Compilation reussie.
echo.

if "%MODE%"=="publish" (
    cd /d "%SCRIPT_DIR%"
    if exist "dist\package.zip" del "dist\package.zip"
    cd dist
    ..\node_modules\.bin\bestzip package.zip * 2>nul || powershell -Command "Compress-Archive -Path * -DestinationPath package.zip"
    cd ..
    echo        OK - package.zip cree dans dist\
    echo.
    echo  ================================================
    echo    PRET POUR LA RELEASE
    echo    Upload dist\package.zip sur GitHub Release
    echo  ================================================
    echo.
    echo   Fichier : %SCRIPT_DIR%\dist\package.zip
    echo.
) else (
    echo [3/3]  Deploiement vers :
    echo        !DEPLOY_DIR!
    echo.

    if not exist "!DEPLOY_DIR!" mkdir "!DEPLOY_DIR!" 2>nul
    rd /s /q "!DEPLOY_DIR!" 2>nul
    mkdir "!DEPLOY_DIR!"
    xcopy /s /e /y /q "%SCRIPT_DIR%\dist\*" "!DEPLOY_DIR!\"
    if errorlevel 1 (
        echo.
        echo  ERREUR : Le deploiement a echoue !
        echo  Verifie que le chemin existe :
        echo  !DEPLOY_DIR!
        pause
        exit /b 1
    )
    echo        OK - Plugin deploye.
    echo.
    if exist "%SCRIPT_DIR%\dist" rd /s /q "%SCRIPT_DIR%\dist"
    echo  ================================================
    echo    TERMINE ! Plugin installe dans SiYuan.
    echo    Redemarrage de SiYuan necessaire.
    echo  ================================================
    echo.
    echo   Chemin : !DEPLOY_DIR!
    echo.
)
pause
