document.addEventListener('DOMContentLoaded', function () {
    // Éviter la duplication de l'événement DOMContentLoaded
    // Au chargement du popup, envoyer automatiquement le message pour afficher la bulle
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0]) {
            // Envoyer le message pour afficher la bulle automatiquement
            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleChatBubble" }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Erreur lors de l'envoi du message:", chrome.runtime.lastError);
                    
                    // Tentative d'injecter et d'exécuter la fonction directement si le message échoue
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: function() {
                            // Vérifier si la bulle existe déjà
                            if (document.getElementById("chatBubble")) {
                                document.getElementById("chatBubble").style.display = "flex";
                                document.getElementById("chatBubble").style.visibility = "visible";
                            } else if (window.createBubbleChat) {
                                // Si la fonction existe, l'appeler
                                window.createBubbleChat();
                            } else {
                                console.error("Impossible d'afficher la bulle de chat");
                            }
                        }
                    });
                } else if (response && response.success) {
                    console.log("Bulle de chat affichée avec succès");
                }
            });
        }
    });
    
  });