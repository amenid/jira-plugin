import os
import sys
import subprocess
import threading
import socket
import time
import logging
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='extension_launcher.log'
)
logger = logging.getLogger('extension_launcher')

# Variables globales
streamlit_process = None
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, 'backend')
VENV_PATH = os.path.join(BACKEND_DIR, '.venv')
STREAMLIT_SCRIPT = os.path.join(BACKEND_DIR, 'chatbot.py')

class LauncherServer(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_OPTIONS(self):
        self._set_headers()
        
    def do_GET(self):
        response = {"status": "error", "message": "Unknown endpoint"}
        
        if self.path == '/start':
            success, message = start_streamlit()
            response = {"status": "success" if success else "error", "message": message}
        
        elif self.path == '/stop':
            success, message = stop_streamlit()
            response = {"status": "success" if success else "error", "message": message}
        
        elif self.path == '/status':
            is_running = check_streamlit_status()
            response = {"status": "running" if is_running else "stopped"}
        
        self._set_headers()
        self.wfile.write(json.dumps(response).encode())

def check_streamlit_status():
    """Vérifie si Streamlit est en cours d'exécution"""
    global streamlit_process
    if streamlit_process and streamlit_process.poll() is None:
        # Vérifier si le port est ouvert
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(1)
            s.connect(('localhost', 8501))
            s.close()
            return True
        except:
            return False
    return False

def start_streamlit():
    """Démarre l'application Streamlit"""
    global streamlit_process
    
    # Vérifier si l'application est déjà en cours d'exécution
    if check_streamlit_status():
        return True, "L'application Streamlit est déjà en cours d'exécution"
    
    try:
        # Déterminer le chemin Python à utiliser
        if sys.platform == 'win32':
            python_exe = os.path.join(VENV_PATH, 'Scripts', 'python.exe')
        else:
            python_exe = os.path.join(VENV_PATH, 'bin', 'python')
        
        # S'assurer que l'exécutable existe
        if not os.path.exists(python_exe):
            return False, f"L'exécutable Python n'a pas été trouvé: {python_exe}"
        
        # Vérifier que le script existe
        if not os.path.exists(STREAMLIT_SCRIPT):
            return False, f"Le script Streamlit n'a pas été trouvé: {STREAMLIT_SCRIPT}"
        
        # Construire la commande
        cmd = [python_exe, '-m', 'streamlit', 'run', STREAMLIT_SCRIPT]
        
        # Démarrer le processus
        logger.info(f"Démarrage de Streamlit avec la commande: {' '.join(cmd)}")
        streamlit_process = subprocess.Popen(
            cmd,
            cwd=BACKEND_DIR,
            env=os.environ.copy(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Attendre un moment pour vérifier que le processus a démarré correctement
        time.sleep(3)
        
        if streamlit_process.poll() is not None:
            error = streamlit_process.stderr.read().decode('utf-8')
            return False, f"Impossible de démarrer Streamlit: {error}"
        
        # Vérifier que le port est ouvert
        attempt = 0
        while attempt < 10:
            if check_streamlit_status():
                logger.info("Streamlit a démarré avec succès")
                return True, "Streamlit a démarré avec succès"
            time.sleep(1)
            attempt += 1
        
        return False, "Streamlit a démarré mais ne répond pas"
    
    except Exception as e:
        logger.error(f"Erreur lors du démarrage de Streamlit: {str(e)}")
        return False, f"Erreur lors du démarrage de Streamlit: {str(e)}"

def stop_streamlit():
    """Arrête l'application Streamlit"""
    global streamlit_process
    
    if streamlit_process:
        try:
            streamlit_process.terminate()
            streamlit_process.wait(timeout=5)
            streamlit_process = None
            logger.info("Streamlit a été arrêté avec succès")
            return True, "Streamlit a été arrêté avec succès"
        except Exception as e:
            logger.error(f"Erreur lors de l'arrêt de Streamlit: {str(e)}")
            return False, f"Erreur lors de l'arrêt de Streamlit: {str(e)}"
    else:
        return True, "Aucune application Streamlit en cours d'exécution"

def run_server():
    """Démarre le serveur HTTP"""
    try:
        port = 5000
        server = HTTPServer(('localhost', port), LauncherServer)
        logger.info(f"Serveur démarré sur le port {port}")
        server.serve_forever()
    except Exception as e:
        logger.error(f"Erreur lors du démarrage du serveur: {str(e)}")
        sys.exit(1)

def main():
    """Fonction principale"""
    logger.info("Démarrage du launcher d'extension")
    
    # Démarrer le serveur HTTP dans un thread séparé
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Démarrer automatiquement Streamlit
    success, message = start_streamlit()
    logger.info(f"Démarrage initial de Streamlit: {message}")
    
    # Garder le programme en cours d'exécution
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Arrêt du launcher d'extension")
        stop_streamlit()

if __name__ == "__main__":
    main()