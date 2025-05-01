@echo off
echo ======================================================
echo Lancement du backend Streamlit...
echo ======================================================

REM Définir le répertoire du script
set SCRIPT_DIR=%~dp0
echo Répertoire du script: %SCRIPT_DIR%
cd "%SCRIPT_DIR%backend"
echo Répertoire actuel: %CD%

REM Vérifier si un processus Streamlit est déjà en cours d'exécution
echo Vérification si Streamlit est déjà en cours d'exécution...
tasklist /FI "IMAGENAME eq streamlit.exe" 2>NUL | find /I /N "streamlit.exe">NUL
IF "%ERRORLEVEL%"=="0" (
    echo Streamlit est déjà en cours d'exécution.
    goto :end
)

REM Vérifier si Python est installé
where python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Python n'est pas installé ou n'est pas dans le PATH.
    echo Veuillez installer Python et réessayer.
    pause
    goto :end
)

REM Vérifier si l'environnement virtuel existe
IF NOT EXIST "%SCRIPT_DIR%backend\.venv\Scripts\activate.bat" (
    echo L'environnement virtuel n'existe pas, création en cours...
    python -m venv "%SCRIPT_DIR%backend\.venv"
    
    echo Installation des dépendances...
    call "%SCRIPT_DIR%backend\.venv\Scripts\activate.bat"
    pip install streamlit
    pip install -r "%SCRIPT_DIR%backend\requirements.txt"
) ELSE (
    echo Environnement virtuel trouvé.
)

REM Activer l'environnement virtuel
echo Activation de l'environnement virtuel...
call "%SCRIPT_DIR%backend\.venv\Scripts\activate.bat"

REM Vérifier si l'environnement virtuel a été activé correctement
IF ERRORLEVEL 1 (
    echo Erreur lors de l'activation de l'environnement virtuel.
    goto :error
)

REM Vérifier si le fichier chatbot.py existe
IF NOT EXIST "%SCRIPT_DIR%backend\chatbot.py" (
    echo ERREUR: Le fichier chatbot.py n'existe pas!
    echo Chemin attendu: %SCRIPT_DIR%backend\chatbot.py
    goto :error
)

REM Lancer l'application Streamlit
echo Lancement de Streamlit...
echo Commande: streamlit run "%SCRIPT_DIR%backend\chatbot.py" --server.headless=true
start /B streamlit run "%SCRIPT_DIR%backend\chatbot.py" --server.headless=true

REM Vérifier si Streamlit a été lancé correctement
timeout /t 5
tasklist /FI "IMAGENAME eq streamlit.exe" 2>NUL | find /I /N "streamlit.exe">NUL
IF "%ERRORLEVEL%"=="0" (
    echo Streamlit a été lancé avec succès!
) ELSE (
    echo Erreur lors du lancement de Streamlit.
    goto :error
)

echo Le backend est en cours d'exécution.
goto :end

:error
echo ======================================================
echo ERREUR: Échec du lancement du backend.
echo ======================================================
pause
exit /b 1

:end
echo ======================================================
echo Le script a été exécuté avec succès.
echo ======================================================
exit /b 0