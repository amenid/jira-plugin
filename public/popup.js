document.addEventListener('DOMContentLoaded', function () {
    console.log("Popup chargé, tentative d'afficher la bulle de chat...");
    
    // Utiliser une fonction asynchrone pour mieux gérer les erreurs
    const showChatBubble = async () => {
        try {
            // Obtenir l'onglet actif
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tabs || !tabs[0]) {
                throw new Error("Aucun onglet actif trouvé");
            }
            
            const activeTab = tabs[0];
            console.log("Onglet actif trouvé, ID:", activeTab.id);
            
            // D'abord essayer d'envoyer un message à l'onglet
            try {
                console.log("Tentative d'envoi de message à l'onglet...");
                const response = await chrome.tabs.sendMessage(activeTab.id, { 
                    action: "toggleChatBubble",
                    from: "popup" 
                });
                
                if (response && response.success) {
                    console.log("Bulle de chat affichée via sendMessage");
                    return;
                } else {
                    console.warn("Réponse reçue mais pas de succès confirmé:", response);
                }
            } catch (msgError) {
                console.warn("Échec de l'envoi du message:", msgError);
            }
            
            // Si le message a échoué, injecter du script directement
            console.log("Tentative d'injection de script...");
            const results = await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: function() {
                    console.log("Script injecté dans la page");
                    
                    // Vérifier si la bulle existe déjà
                    const existingBubble = document.getElementById("chatBubble");
                    if (existingBubble) {
                        console.log("Bulle existante trouvée, affichage...");
                        existingBubble.style.display = "flex";
                        existingBubble.style.visibility = "visible";
                        return { method: "existing", success: true };
                    } 
                    
                    // Essayer d'utiliser la fonction createBubbleChat si elle existe
                    if (typeof window.createBubbleChat === 'function') {
                        console.log("Fonction createBubbleChat trouvée, exécution...");
                        const bubble = window.createBubbleChat();
                        return { method: "function", success: !!bubble };
                    }
                    
                    // Si nous arrivons ici, c'est que nous n'avons pas pu afficher la bulle
                    console.error("Impossible d'afficher la bulle de chat");
                    return { method: "none", success: false };
                }
            });
            
            if (results && results[0]) {
                const result = results[0].result;
                console.log("Résultat de l'injection:", result);
                
                if (result && result.success) {
                    console.log(`Bulle de chat affichée avec succès via ${result.method}`);
                } else {
                    throw new Error("L'injection a échoué à afficher la bulle");
                }
            } else {
                throw new Error("Aucun résultat d'injection reçu");
            }
            
        } catch (error) {
            console.error("Erreur critique:", error);
            
            // Afficher un message à l'utilisateur dans le popup
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.padding = '10px';
            errorDiv.textContent = `Erreur: Impossible d'afficher la bulle de chat. (${error.message})`;
            document.body.appendChild(errorDiv);
        }
    };
    
    // Exécuter la fonction
    showChatBubble();
    
    // Ajouter un bouton de secours au popup pour réessayer
    const retryButton = document.createElement('button');
    retryButton.textContent = "Réessayer d'afficher la bulle";
    retryButton.style.marginTop = '10px';
    retryButton.style.padding = '5px 10px';
    retryButton.addEventListener('click', showChatBubble);
    document.body.appendChild(retryButton);
});