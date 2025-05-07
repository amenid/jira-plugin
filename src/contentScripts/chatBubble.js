let chatBubble;

/**
 * Creates and returns the chat bubble element
 * @returns {HTMLElement} The chat bubble element
 */
export function createBubbleChat() {
    // Vérifie si la bulle existe déjà
    if (document.getElementById("chatBubble")) {
        const existingBubble = document.getElementById("chatBubble");
        existingBubble.style.display = "flex"; // S'assurer que la bulle est visible
        existingBubble.style.visibility = "visible";
        return existingBubble;
    }
    
    // Créer la bulle de chat
    const chatBubble = document.createElement("div");
    chatBubble.id = "chatBubble";
    Object.assign(chatBubble.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "60px",
        height: "60px",
        backgroundColor: "transparent", // Arrière-plan transparent
        color: "white",
        borderRadius: "50%",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "all 0.3s ease",
        zIndex: "2147483647", // Maximum z-index pour être au-dessus de tout
        border: "none",
        cursor: "pointer",
        background: "transparent",
        visibility: "visible"
    });

    // Contenu - image qui occupe toute la bulle
    const content = document.createElement("div");
    content.id = "chatBubbleContent";
    content.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
    `;

    // Image PNG plein écran
    const chatImage = document.createElement("img");
    chatImage.src = chrome.runtime.getURL("chat.png");
    chatImage.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    `;
    
    content.appendChild(chatImage);
    chatBubble.appendChild(content);

    // Bouton de fermeture
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✖";
    closeBtn.style.cssText = `
        position: absolute;
        top: 0px;
        right: 0px;
        width: 18px;
        height: 18px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        transform: translate(50%, -50%);
        z-index: 10001;
    `;
    closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        chatBubble.style.display = "none";
        
        // Stocker l'état dans le localStorage
        localStorage.setItem("chatBubbleHidden", "true");
        
        // Réafficher après 1 heure
        setTimeout(() => {
            chatBubble.style.display = "flex";
            localStorage.removeItem("chatBubbleHidden");
        }, 3600000);
    });
    chatBubble.appendChild(closeBtn);
    
    // Important: Ajouter au document AVANT de créer le conteneur de chat
    document.body.appendChild(chatBubble);

    // Conteneur de chat
    const chatContainer = document.createElement("div");
    chatContainer.id = "chatBotContainer";
    Object.assign(chatContainer.style, {
        position: "fixed",
        bottom: "90px",
        right: "20px",
        width: "350px",
        height: "500px",
        backgroundColor: "white",
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        borderRadius: "10px",
        overflow: "hidden",
        display: "none",
        zIndex: "9999"
    });

    // Iframe pour le chat
    const iframe = document.createElement("iframe");
    iframe.src = "http://localhost:8501"; // Changez cette URL pour la production
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    chatContainer.appendChild(iframe);
    document.body.appendChild(chatContainer);

    // Toggle du chat en cliquant sur la bulle
    let chatVisible = false;
    chatBubble.addEventListener("click", () => {
        chatVisible = !chatVisible;
        chatContainer.style.display = chatVisible ? "block" : "none";
        
        // Effet visuel pour montrer l'état actif
        if (chatVisible) {
            chatBubble.style.boxShadow = "0 0 15px rgba(0,0,0,0.25)";
            chatBubble.style.transform = "scale(1.05)";
        } else {
            chatBubble.style.boxShadow = "0 2px 10px rgba(0,0,0,0.15)";
            chatBubble.style.transform = "scale(1)";
        }
    });

    // Vérifier si la bulle était précédemment cachée
    if (localStorage.getItem("chatBubbleHidden") === "true") {
        chatBubble.style.display = "none";
    } else {
        // Ajouter un effet d'apparition
        chatBubble.style.transform = "scale(0)";
        setTimeout(() => {
            chatBubble.style.transform = "scale(1)";
        }, 100);
    }

    console.log("Chat bubble created and added to DOM with id:", chatBubble.id);
    return chatBubble;
}

/**
 * Sets up listeners for extension messages
 */
export function setupExtensionListener() {
    // S'assurer que chrome.runtime est disponible
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            if (message.action === "toggleChatBubble") {
                const chatBubble = document.getElementById("chatBubble") || createBubbleChat();
                const chatContainer = document.getElementById("chatBotContainer");
                
                // Afficher la bulle si elle était cachée
                if (chatBubble.style.display === "none") {
                    chatBubble.style.display = "flex";
                    localStorage.removeItem("chatBubbleHidden");
                    
                    // Effet d'apparition
                    chatBubble.style.transform = "scale(0)";
                    setTimeout(() => {
                        chatBubble.style.transform = "scale(1)";
                    }, 100);
                }
                
                // Ouvrir automatiquement la fenêtre de chat
                chatContainer.style.display = "block";
                chatBubble.style.transform = "scale(1.05)";
                
                sendResponse({success: true});
                return true; // Important pour les réponses asynchrones
            }
        });
    } else {
        console.warn("Chrome runtime not available for extension messaging");
    }
}

/**
 * Function to show the chat bubble (to be called from popup.js)
 * @returns {boolean} Success status
 */
export function afficherBulle() {
    const chatBubble = document.getElementById("chatBubble") || createBubbleChat();
    const chatContainer = document.getElementById("chatBotContainer");
    
    // Assurer que la bulle est visible
    chatBubble.style.display = "flex";
    chatBubble.style.visibility = "visible";
    localStorage.removeItem("chatBubbleHidden");
    
    // Effet d'apparition
    chatBubble.style.transform = "scale(0)";
    setTimeout(() => {
        chatBubble.style.transform = "scale(1)";
    }, 100);
    
    // Ouvrir automatiquement la fenêtre de chat
    chatContainer.style.display = "block";
    chatBubble.style.transform = "scale(1.05)";
    
    return true;
}

/**
 * Initializes all chat features
 */
export function initializeChatFeatures() {
    try {
        // Créer la bulle de chat immédiatement
        const chatBubble = createBubbleChat();
        console.log("Chat bubble successfully created");
        
        // Configurer l'écouteur d'extension
        setupExtensionListener();
        
        console.log("Chat features initialized successfully");
    } catch (error) {
        console.error("Failed to initialize chat features:", error);
    }
}