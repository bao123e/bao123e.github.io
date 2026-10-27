@echo off
chcp 65001 >nul
echo ========================================================
echo   HUONG DAN DONG BO AETHERIA TCG LEN GITHUB PAGES
echo ========================================================
echo.
echo Tai khoan GitHub cua ban: baodznhatsv
echo.
echo 1. Hay vao trinh duyet mo: https://github.com/new
echo 2. Tai o Repository name, nhap: baodznhatsv.github.io (hoac wuwa-gacha)
echo 3. Chon che do Public, sau do bam nut [Create repository]
echo.
echo ========================================================
set /p REPO_NAME="Nhap ten Repository ban vua tao tren GitHub (vi du: baodznhatsv.github.io): "

if "%REPO_NAME%"=="" (
    echo Ban chua nhap ten repo!
    pause
    exit /b
)

echo.
echo Dang ket noi voi https://github.com/baodznhatsv/%REPO_NAME%.git ...
git remote remove origin 2>nul
git remote add origin https://github.com/baodznhatsv/%REPO_NAME%.git
git branch -M main

echo Dang day toan bo ma nguon len GitHub...
git push -u origin main

echo.
echo ========================================================
echo DA DAY CODE THANH CONG!
echo.
echo Buoc cuoi cung de web hoat dong:
echo 1. Vao: https://github.com/baodznhatsv/%REPO_NAME%/settings/pages
echo 2. Muc Branch chon "main", thu muc "/ (root)", bam Save.
echo 3. Cho 1 phut la web online tai:
echo    https://baodznhatsv.github.io/%REPO_NAME%/
echo ========================================================
pause
