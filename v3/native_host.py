#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import json
import struct
import subprocess
import os
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='native_host.log'
)
logger = logging.getLogger('native_host')

# Fonction pour lire un message de stdin
def read_message():
    # Lire les 4 premiers octets (taille du message)
    message_length_bytes = sys.stdin.buffer.read(4)
    if len(message_length_bytes) == 0:
        logger.error("Pas de données reçues")
        return None
    
    # Convertir les octets en entier
    message_length = struct.unpack('i', message_length_bytes)[0]
    
    # Lire le message JSON
    message_json = sys.stdin.buffer.read(message_length).decode('utf-8')
    logger.info(f"Message reçu: {message_json}")
    
    # Convertir JSON en dictionnaire
    return json.loads(message_json)

# Fonction pour envoyer un message à stdout
def send_message(message):
    # Convertir le message en JSON
    message_json = json.dumps(message)
    
    # Convertir le JSON en bytes
    message_bytes = message_json.encode('utf-8')
    
    # Calculer la taille du message
    message_length = len(message_bytes)
    
    # Envoyer la taille suivie du message
    sys.stdout.buffer.write(struct.pack('I', message_length))
    sys.stdout.buffer.write(message_bytes)
    sys.stdout.buffer.flush()

# Fonction principale
def main():
    logger.info("Démarrage de l'hôte natif")
    
    try:
        # Lire un message depuis Chrome
        message = read_message()
        
        if message and 'command' in message:
            command = message['command']
            
            if command == 'run':
                # Lancer le script batch
                current_dir = os.path.dirname(os.path.abspath(__file__))
                batch_path = os.path.join(current_dir, "launch.bat")
                
                logger.info(f"Exécution du script: {batch_path}")
                
                try:
                    # Exécuter le script batch en arrière-plan
                    if os.name == 'nt':  # Windows
                        subprocess.Popen(
                            [batch_path],
                            creationflags=subprocess.CREATE_NO_WINDOW,
                            shell=True
                        )
                    else:  # Unix/Linux
                        subprocess.Popen(
                            [batch_path],
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE
                        )
                    
                    # Répondre à Chrome
                    send_message({'success': True, 'message': 'Script exécuté avec succès'})
                
                except Exception as e:
                    logger.error(f"Erreur lors de l'exécution du script: {str(e)}")
                    send_message({'success': False, 'message': f"Erreur: {str(e)}"})
            
            else:
                logger.error(f"Commande inconnue: {command}")
                send_message({'success': False, 'message': f"Commande inconnue: {command}"})
        
        else:
            logger.error("Message invalide ou vide")
            send_message({'success': False, 'message': "Message invalide ou vide"})
    
    except Exception as e:
        logger.error(f"Erreur dans l'hôte natif: {str(e)}")
        # Ne pas envoyer de message en cas d'erreur critique pour éviter de bloquer

if __name__ == "__main__":
    main()