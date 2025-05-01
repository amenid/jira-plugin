import subprocess
import os
import sys
import time

def start_streamlit():
    # Chemin vers le dossier backend
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(script_dir, "backend")
    chatbot_path = os.path.join(backend_dir, "chatbot.py")
    
    print(f"Démarrage de Streamlit avec le script: {chatbot_path}")
    
    # Commande de démarrage
    cmd = [sys.executable, "-m", "streamlit", "run", chatbot_path, "--server.headless=true"]
    
    # Lancement du processus et retour immédiat
    subprocess.Popen(cmd, creationflags=subprocess.CREATE_NO_WINDOW)
    
    print("Process Streamlit lancé en arrière-plan")
    return True

if __name__ == "__main__":
    start_streamlit()
    # Si lancé avec l'argument --wait, garder la fenêtre ouverte
    if len(sys.argv) > 1 and sys.argv[1] == "--wait":
        input("Appuyez sur Entrée pour quitter...")