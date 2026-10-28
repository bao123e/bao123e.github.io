@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Deploy Wuthering Waves Terminal to GitHub Pages (bao123e.github.io)
echo ========================================================
echo   DONG BO WUWA AKADEMIYA TERMINAL LEN GITHUB PAGES
echo ========================================================
echo.
echo Remote URL: https://github.com/bao123e/bao123e.github.io.git
echo.
echo Dang chuan bi ma nguon...
git config user.name "bao123e"
git remote remove origin 2>nul
git remote add origin https://github.com/bao123e/bao123e.github.io.git
git branch -M main

echo.
echo Dang day code len GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo CO LOI XAY RA HOAC CHUA XAC THUC TAI KHOAN GITHUB!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   DA DAY CODE LEN GITHUB THANH CONG 100%!
    echo ========================================================
    echo.
    echo Website da duoc cap nhat truc tiep tai:
    echo https://bao123e.github.io/
    echo ========================================================
)
pause
