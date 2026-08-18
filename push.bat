@echo off
setlocal

REM Push Connect4 code to the git repository (origin/main).
REM Run from the project root (where this file lives).
REM Usage:
REM   push.bat            -- build, commit all changes, push to origin/main
REM   push.bat --no-build -- commit + push without running build/lint
REM   push.bat --amend    -- add changes to the last commit instead of a new one

cd /d "%~dp0"

REM ------------------------------------------------------------------
REM Optional flags
REM ------------------------------------------------------------------
set "RUN_BUILD=1"
set "AMEND=0"

:parse
if "%~1"=="" goto :parsed
if /i "%~1"=="--no-build" ( set "RUN_BUILD=0" & shift & goto :parse )
if /i "%~1"=="--amend"    ( set "AMEND=1" & shift & goto :parse )
echo Unknown argument: %~1
exit /b 1
:parsed

REM ------------------------------------------------------------------
REM Preflight: git must be available
REM ------------------------------------------------------------------
where git >nul 2>nul
if errorlevel 1 (
    echo [ERROR] git not found on PATH.
    exit /b 1
)

REM ------------------------------------------------------------------
REM If requested, build and lint to make sure the code compiles
REM ------------------------------------------------------------------
if "%RUN_BUILD%"=="1" (
    echo.
    echo === Building and linting ===
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed. Fix the errors and try again.
        exit /b 1
    )
    call npm run lint
    if errorlevel 1 (
        echo [ERROR] Lint failed. Fix the errors and try again.
        exit /b 1
    )
)

REM ------------------------------------------------------------------
REM Stage all changes (tracked + new files)
REM ------------------------------------------------------------------
echo.
echo === Staging changes ===
git add -A
if errorlevel 1 (
    echo [ERROR] git add failed.
    exit /b 1
)

REM ------------------------------------------------------------------
REM Commit (or amend)
REM ------------------------------------------------------------------
echo.
if "%AMEND%"=="1" (
    echo === Amending previous commit ===
    git commit --amend --no-edit
) else (
    set /p MESSAGE=Commit message: 
    if "%MESSAGE%"=="" set "MESSAGE=Update Connect 4"
    echo === Committing ===
    git commit -m "%MESSAGE%"
)
if errorlevel 1 (
    echo [ERROR] Commit failed. Nothing to commit, or a conflict occurred.
    exit /b 1
)

REM ------------------------------------------------------------------
REM Push to origin/main (force-safe: fast-forward only)
REM ------------------------------------------------------------------
echo.
echo === Pushing to origin/main ===
git push origin main
if errorlevel 1 (
    echo [ERROR] Push failed.
    exit /b 1
)

echo.
echo === Done ===
git log --oneline -1
endlocal
