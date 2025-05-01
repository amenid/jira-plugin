# launcher_server.py
import subprocess
import os
import sys
import time
import threading
import signal
import psutil
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("launcher_server.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Permettre les requêtes cross-origin

# Variable globale pour suivre le processus du chatbot
chatbot_process = None
chatbot_status = "stopped"

def find_streamlit_process():
    """Vérifie si un processus Streamlit est en cours d'exécution sur le port 8501"""
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if 'streamlit' in proc.info['name'].lower() or any('streamlit' in cmd.lower() for cmd in proc.info['cmdline'] if isinstance(cmd, str)):
                logger.info(f"Processus Streamlit trouvé: {proc.info}")
                return proc
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return None

def check_port_in_use(port):
    """Vérifie si un port est déjà utilisé"""
    for conn in psutil.net_connections():
        if conn.laddr.port == port:
            logger.info(f"Port {port} déjà utilisé par le processus {conn.pid}")
            return True
    return False

def run_chatbot():
    """Lance le chatbot Streamlit"""
    global chatbot_process, chatbot_status
    
    logger.info("Tentative de lancement du chatbot...")
    
    # Vérifier si le processus est déjà en cours d'exécution
    existing_streamlit = find_streamlit_process()
    if existing_streamlit:
        logger.info(f"Un processus Streamlit est déjà en cours d'exécution (PID: {existing_streamlit.pid})")
        chatbot_status = "running"
        return True
    
    # Vérifier si le port 8501 est déjà utilisé
    if check_port_in_use(8501):
        logger.warning("Le port 8501 est déjà utilisé, impossible de lancer le chatbot")
        chatbot_status = "port_in_use"
        return False
    
    try:
        # Chemins adaptés à votre configuration
        script_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.join(script_dir, "backend")
        venv_path = os.path.join(backend_dir, ".venv", "Scripts", "activate")
        chatbot_path = os.path.join(backend_dir, "chatbot.py")
        
        logger.info(f"Répertoire backend: {backend_dir}")
        logger.info(f"Environnement virtuel: {venv_path}")
        logger.info(f"Script chatbot: {chatbot_path}")
        
        # Vérifier l'existence des fichiers nécessaires
        if not os.path.exists(backend_dir):
            logger.error(f"Le répertoire backend n'existe pas: {backend_dir}")
            chatbot_status = "missing_backend_dir"
            return False
        
        if not os.path.exists(chatbot_path):
            logger.error(f"Le script chatbot.py n'existe pas: {chatbot_path}")
            chatbot_status = "missing_chatbot_script"
            return False
        
        # Commande pour Windows PowerShell
        cmd = f'cd "{backend_dir}" && powershell -Command ". \'{venv_path}\'; streamlit run \'{chatbot_path}\' --server.headless=true"'
        logger.info(f"Commande d'exécution: {cmd}")
        
        # Exécution de la commande
        chatbot_process = subprocess.Popen(cmd, shell=True)
        logger.info(f"Chatbot lancé avec PID: {chatbot_process.pid}")
        
        # Attendre un peu pour laisser le temps au processus de démarrer
        time.sleep(5)
        
        # Vérifier si le processus est toujours en cours d'exécution
        retcode = chatbot_process.poll()
        if retcode is not None:
            logger.error(f"Le processus chatbot s'est terminé prématurément avec le code: {retcode}")
            chatbot_status = "failed"
            return False
        
        chatbot_status = "running"
        return True
    
    except Exception as e:
        logger.exception(f"Erreur lors du lancement du chatbot: {str(e)}")
        chatbot_status = "error"
        return False

@app.route('/status', methods=['GET'])
def status():
    """Renvoie le statut du serveur launcher et du chatbot"""
    global chatbot_status
    
    # Vérifier si le chatbot est en cours d'exécution
    existing_streamlit = find_streamlit_process()
    if existing_streamlit:
        chatbot_status = "running"
    elif chatbot_status == "running":
        chatbot_status = "stopped"
    
    return jsonify({
        "status": "online", 
        "message": "Serveur launcher actif", 
        "chatbot_status": chatbot_status
    })

@app.route('/launch-chatbot', methods=['POST'])
def launch_chatbot():
    """Lance le chatbot Streamlit"""
    # Lance le chatbot dans un thread séparé pour ne pas bloquer la réponse
    thread = threading.Thread(target=run_chatbot)
    thread.daemon = True
    thread.start()
    
    # Attendre un court instant pour que le thread démarre
    time.sleep(1)
    
    return jsonify({
        "status": "success", 
        "message": "Chatbot en cours de démarrage", 
        "chatbot_status": chatbot_status
    })

@app.route('/stop-chatbot', methods=['POST'])
def stop_chatbot():
    """Arrête le chatbot Streamlit"""
    global chatbot_process, chatbot_status
    
    existing_streamlit = find_streamlit_process()
    if existing_streamlit:
        try:
            existing_streamlit.terminate()
            time.sleep(2)
            if existing_streamlit.is_running():
                existing_streamlit.kill()
            chatbot_status = "stopped"
            return jsonify({"status": "success", "message": "Chatbot arrêté"})
        except Exception as e:
            logger.exception(f"Erreur lors de l'arrêt du chatbot: {str(e)}")
            return jsonify({"status": "error", "message": f"Erreur lors de l'arrêt du chatbot: {str(e)}"})
    else:
        chatbot_status = "stopped"
        return jsonify({"status": "warning", "message": "Aucun processus chatbot trouvé"})

@app.route('/check-streamlit', methods=['GET'])
def check_streamlit():
    """Vérifie si Streamlit est accessible"""
    import requests
    
    try:
        response = requests.get("http://localhost:8501", timeout=2)
        return jsonify({
            "status": "success", 
            "message": "Streamlit est accessible", 
            "response_code": response.status_code
        })
    except requests.exceptions.ConnectionError:
        return jsonify({
            "status": "error", 
            "message": "Streamlit n'est pas accessible"
        })
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"Erreur lors de la vérification: {str(e)}"
        })

def shutdown_server():
    """Arrête proprement le serveur Flask"""
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Pas dans le contexte du serveur Werkzeug')
    func()

@app.route('/shutdown', methods=['POST'])
def shutdown():
    """Endpoint pour arrêter le serveur Flask"""
    shutdown_server()
    return jsonify({"status": "success", "message": "Serveur en cours d'arrêt"})

if __name__ == '__main__':
    # Gérer proprement l'arrêt du serveur et du processus chatbot
    def signal_handler(sig, frame):
        logger.info("Signal d'arrêt reçu, nettoyage...")
        
        # Arrêter le processus chatbot s'il existe
        existing_streamlit = find_streamlit_process()
        if existing_streamlit:
            logger.info(f"Arrêt du processus Streamlit (PID: {existing_streamlit.pid})")
            try:
                existing_streamlit.terminate()
                time.sleep(2)
                if existing_streamlit.is_running():
                    existing_streamlit.kill()
            except:
                pass
        
        logger.info("Arrêt du serveur launcher")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Vérifier au démarrage si le chatbot doit être lancé automatiquement
    try:
        # Vérifie si un argument --auto-launch a été passé
        if "--auto-launch" in sys.argv:
            logger.info("Lancement automatique du chatbot au démarrage du serveur")
            run_chatbot()
    except Exception as e:
        logger.exception(f"Erreur lors du lancement automatique: {str(e)}")
    
    logger.info("Démarrage du serveur launcher sur localhost:8000")
    # Lance le serveur sur le port 8000
    app.run(host='localhost', port=8000, debug=False)