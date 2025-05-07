@echo off
echo Installation de JIRA Assistant Bot...

:: Déterminer le chemin actuel de l'extension
set EXTENSION_DIR=%~dp0
echo Le répertoire d'installation est: %EXTENSION_DIR%

:: Créer le script de démarrage automatique avec le bon chemin
echo @echo off > "%EXTENSION_DIR%start_chatbot.bat"
echo cd "%EXTENSION_DIR%backend" >> "%EXTENSION_DIR%start_chatbot.bat"
echo call .venv\Scripts\activate >> "%EXTENSION_DIR%start_chatbot.bat"
echo start /min streamlit run chatbot.py >> "%EXTENSION_DIR%start_chatbot.bat"
echo exit >> "%EXTENSION_DIR%start_chatbot.bat"

:: Créer un raccourci dans le dossier de démarrage
echo Création du raccourci de démarrage...
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Startup')+'\JIRA_Assistant_Bot.lnk');$s.TargetPath='%EXTENSION_DIR%start_chatbot.bat';$s.Save()"

echo Installation terminée avec succès!
echo.
echo L'application démarrera automatiquement au prochain démarrage de Windows.
echo Pour démarrer l'application maintenant, exécutez le fichier start_chatbot.bat.
echo.
pause