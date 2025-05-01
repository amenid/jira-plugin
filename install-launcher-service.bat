@echo off
echo ======================================================
echo Installation du service launcher pour l'extension
echo ======================================================

REM Vérification des droits administrateur
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Ce script doit être exécuté en tant qu'administrateur.
    echo Clic droit sur le fichier et sélectionnez "Exécuter en tant qu'administrateur".
    pause
    exit /b 1
)

REM Définir le répertoire du script
set SCRIPT_DIR=%~dp0
echo Répertoire du script: %SCRIPT_DIR%

REM Vérifier si Python est installé
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Python n'est pas installé ou n'est pas dans le PATH.
    echo Veuillez installer Python et réessayer.
    pause
    exit /b 1
)

REM Installer les dépendances nécessaires
echo Installation des dépendances Python...
pip install flask flask-cors psutil

REM Créer un script de démarrage pour le lanceur
echo Création du script de démarrage...
set STARTUP_SCRIPT=%SCRIPT_DIR%start-launcher.bat
echo @echo off > "%STARTUP_SCRIPT%"
echo cd /d "%SCRIPT_DIR%" >> "%STARTUP_SCRIPT%"
echo start /MIN pythonw "%SCRIPT_DIR%launcher_server.py" --auto-launch >> "%STARTUP_SCRIPT%"

REM Créer une entrée dans le démarrage de Windows
echo Création du raccourci dans le dossier de démarrage...
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT=%STARTUP_FOLDER%\ChatbotLauncher.lnk

REM Créer un script PowerShell temporaire pour créer le raccourci
echo $WshShell = New-Object -ComObject WScript.Shell > "%TEMP%\CreateShortcut.ps1"
echo $Shortcut = $WshShell.CreateShortcut("%SHORTCUT%") >> "%TEMP%\CreateShortcut.ps1"
echo $Shortcut.TargetPath = "%STARTUP_SCRIPT%" >> "%TEMP%\CreateShortcut.ps1"
echo $Shortcut.WorkingDirectory = "%SCRIPT_DIR%" >> "%TEMP%\CreateShortcut.ps1"
echo $Shortcut.WindowStyle = 7 >> "%TEMP%\CreateShortcut.ps1"
echo $Shortcut.Description = "Démarre le serveur launcher de l'extension chatbot" >> "%TEMP%\CreateShortcut.ps1"
echo $Shortcut.Save() >> "%TEMP%\CreateShortcut.ps1"

REM Exécuter le script PowerShell
powershell -ExecutionPolicy Bypass -File "%TEMP%\CreateShortcut.ps1"

REM Supprimer le script temporaire
del "%TEMP%\CreateShortcut.ps1"

REM Démarrer immédiatement le serveur launcher
echo Démarrage du serveur launcher...
start /MIN pythonw "%SCRIPT_DIR%launcher_server.py" --auto-launch

echo ======================================================
echo Installation terminée avec succès!
echo Le serveur launcher démarre automatiquement au démarrage de Windows.
echo Pour le démarrer manuellement, exécutez start-launcher.bat
echo ======================================================
pause