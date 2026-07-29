@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title SiYuan GitHub Sync - Compilation et Déploiement

set "PLUGIN_NAME=siyuan-github-sync"
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "MODE=%1"
if not "%MODE%"=="" goto :run

echo.
echo ┌──────────────────────────────────────────────────┐
echo │        SiYuan GitHub Sync - Menu                 │
echo └──────────────────────────────────────────────────┘
echo.
echo   1) Test       - Compiler + dployer dans SiYuan
echo   2) Publier    - Compiler + crer package.zip
echo.
set /p choix="  Choix [1/2] : "
if "%choix%"=="2" ( set "MODE=publish" ) else ( set "MODE=test" )

:run
echo.
echo ┌──────────────────────────────────────────────────┐
if "%MODE%"=="publish" (
    echo │   SiYuan GitHub Sync  -  Publication (release)  │
) else (
    echo │     SiYuan GitHub Sync  -  Build ^& Deploy       │
)
echo └──────────────────────────────────────────────────┘
echo.

echo [1/3]  Vrification des dpendances npm...
if not exist "%SCRIPT_DIR%\node_modules" (
    echo        Installation des modules...
    call npm install
)
echo        OK - Dpendances prtes.
echo.

echo [2/3]  Compilation...
echo.
call npm run build
echo        OK - Compilation russie.
echo.

if "%MODE%"=="publish" (
    cd /d "%SCRIPT_DIR%"
    if exist "dist\package.zip" del "dist\package.zip"
    cd dist
    ..\node_modules\.bin\bestzip package.zip * 2>nul || powershell Compress-Archive -Path * -DestinationPath package.zip
    cd ..
    echo        OK - package.zip cr dans dist\
    echo.
    echo ┌──────────────────────────────────────────────────┐
    echo │   PRET POUR LA RELEASE                           │
    echo │                                                  │
    echo │   Upload dist\package.zip sur GitHub Release     │
    echo └──────────────────────────────────────────────────┘
    echo.
    echo   Fichier : %SCRIPT_DIR%\dist\package.zip
    echo.
) else (
    set "DEPLOY_DIR=%USERPROFILE%\Documents\siyuan\data\plugins\%PLUGIN_NAME%"
    echo [3/3]  Dploiement vers : !DEPLOY_DIR!
    echo.
    if not exist "!DEPLOY_DIR!" mkdir "!DEPLOY_DIR!" 2>nul
    rd /s /q "!DEPLOY_DIR!" 2>nul
    mkdir "!DEPLOY_DIR!"
    xcopy /s /e /y /q "%SCRIPT_DIR%\dist\*" "!DEPLOY_DIR!\"
    echo        OK - Plugin dploy.
    echo.
    if exist "%SCRIPT_DIR%\dist" rd /s /q "%SCRIPT_DIR%\dist"
    echo ┌──────────────────────────────────────────────────┐
    echo │   TERMINE ! Plugin install dans SiYuan.         │
    echo │                                                  │
    echo │   Redmarre SiYuan pour charger le plugin.       │
    echo └──────────────────────────────────────────────────┘
    echo.
    echo   Chemin : !DEPLOY_DIR!
    echo.
)
pause
