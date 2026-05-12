@echo off
setlocal enabledelayedexpansion
title Online Vepar - Flutter Merchant App

echo ============================================
echo   Online Vepar - Flutter Merchant App
echo   Running on Android Emulator...
echo ============================================
echo.

REM ==== Config ====
set "PROJECT_DIR=K:\New folder (2)\online vepar\merchant_app"
set "FLUTTER_BIN=K:\flutter\bin\flutter.bat"
set "DEVICE_ID=emulator-5554"
set "LOG_FILE=flutter_run.log"

REM ==== Check Flutter exists ====
if not exist "%FLUTTER_BIN%" (
    echo [ERROR] Flutter not found at: %FLUTTER_BIN%
    echo Check your Flutter installation path.
    pause
    exit /b 1
)

REM ==== Check project directory ====
if not exist "%PROJECT_DIR%" (
    echo [ERROR] Project directory not found:
    echo   %PROJECT_DIR%
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%"

REM ==== Check pubspec.yaml exists ====
if not exist "pubspec.yaml" (
    echo [ERROR] pubspec.yaml not found. Are you sure this is a Flutter project?
    pause
    exit /b 1
)

REM ==== Ask user if they want clean build ====
set /p CLEAN_BUILD="Run 'flutter clean' first? (y/N): "
if /i "!CLEAN_BUILD!"=="y" (
    echo.
    echo [*] Cleaning previous build...
    call "%FLUTTER_BIN%" clean
    if !errorlevel! neq 0 (
        echo [ERROR] flutter clean failed.
        pause
        exit /b 1
    )
)

REM ==== Step 1: Get dependencies ====
echo.
echo [1/3] Getting dependencies...
echo --------------------------------------------
call "%FLUTTER_BIN%" pub get
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] flutter pub get failed!
    echo Check pubspec.yaml for issues.
    pause
    exit /b 1
)

REM ==== Step 2: Check emulator is running ====
echo.
echo [2/3] Checking for device %DEVICE_ID%...
echo --------------------------------------------
call "%FLUTTER_BIN%" devices | findstr /C:"%DEVICE_ID%" >nul
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Device "%DEVICE_ID%" not found.
    echo.
    echo Available devices:
    call "%FLUTTER_BIN%" devices
    echo.
    echo Please start the emulator from Android Studio
    echo or run: emulator -avd ^<your_avd_name^>
    pause
    exit /b 1
)
echo [OK] Device found.

REM ==== Step 3: Launch app ====
echo.
echo [3/3] Launching app on %DEVICE_ID%...
echo --------------------------------------------
echo (Logs will also be saved to %LOG_FILE%)
echo.
echo Hot reload: r  ^|  Hot restart: R  ^|  Quit: q
echo.

call "%FLUTTER_BIN%" run -d %DEVICE_ID%

REM ==== Done ====
echo.
echo ============================================
echo   App session ended.
echo ============================================
pause
endlocal