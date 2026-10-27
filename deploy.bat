@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Deploy Wuthering Waves TCG to GitHub Pages (bao123e)
echo ========================================================
echo   DONG BO AETHERIA TCG LEN GITHUB: bao123e/wwtcg
echo ========================================================
echo.
echo Remote URL: https://github.com/bao123e/wwtcg.git
echo.
echo Dang chuan bi ma nguon...
git config user.name "bao123e"
git remote remove origin 2>nul
git remote add origin https://github.com/bao123e/wwtcg.git
git branch -M main

echo.
echo Dang day code len GitHub...
echo (Neu trinh duyet hoac cua so dang nhap GitHub hien len, ban hay bam "Sign in with your browser" hoac "Authorize" nhe)
echo.
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
    echo Buoc cuoi cung de web chay online:
    echo 1. Mo link nay: https://github.com/bao123e/wwtcg/settings/pages
    echo 2. Tai muc Branch chon "main" (folder "/root"), bam Save.
    echo 3. Cho 1-2 phut la web online tai:
    echo    https://bao123e.github.io/wwtcg/
    echo ========================================================
)
pause
