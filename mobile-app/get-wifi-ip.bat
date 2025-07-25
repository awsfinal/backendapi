@echo off
echo Getting your WiFi IP address...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4.*192.168"') do (
    set ip=%%i
    set ip=!ip: =!
    echo Your WiFi IP: !ip!
)
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4.*10\."') do (
    set ip=%%i
    set ip=!ip: =!
    echo Your WiFi IP: !ip!
)
pause
