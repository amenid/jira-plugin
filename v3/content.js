// Constantes pour les options valides
const validActivities = ["Nightly", "Coverage", "Periodic_2h", "Weekly", "FV", "PreInt", "PreGate"];
const validIPOptions = ["IPNext", "IP1", "IP2", "IP3"];

// Variables globales optimisées
let errorBubble = null;
let chatBubble = null;
let errorCount = 0;
let timeoutId = null;
let optionsMenu = null;
let currentSegment = 0;
let activeAlerts = new Set();
let domObserver = null;
let errorFlags = {
    priority: false,
    components: false,
    version: false
};
let errorState = {
    categorization: false,
    variant2: false,
    errorOccurrence: false,
    otherText: false
};

// Fonction de cache pour éviter des requêtes DOM répétées
const elementCache = new Map();
function getElement(selector) {
    if (elementCache.has(selector)) {
        return elementCache.get(selector);
    }
    const element = document.querySelector(selector);
    if (element) {
        elementCache.set(selector, element);
    }
    return element;
}

// Fonction pour créer la bulle d'erreur - optimisée et corrigée
function createErrorBubble() {
    if (errorBubble) return errorBubble;
    
    errorBubble = document.createElement("div");
    errorBubble.id = "errorBubble";
    Object.assign(errorBubble.style, {
        position: "absolute",
        width: "40px",
        height: "40px",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        color: "black",
        borderRadius: "50%",
        boxShadow: "0 2px 15px rgba(0,0,0,0.2), 0 0 5px rgba(255,255,255,0.8) inset",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "all 0.3s ease",
        zIndex: "10000",
        border: "2px solid transparent",
        cursor: "pointer",
        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(240,240,240,0.9))",
        visibility: "visible" // IMPORTANT: Garder visible par défaut
    });

    // Contenu de la bulle
    const content = document.createElement("div");
    content.id = "bubbleContent";
    content.style.display = "flex";
    content.style.alignItems = "center";
    content.style.justifyContent = "center";
    content.style.flexDirection = "column";
    content.style.width = "100%";
    content.style.height = "100%";
    content.style.position = "relative";

    // Icône normale
    const icon = document.createElement("img");
    icon.id = "bubbleIcon";
    try {
        icon.src = chrome.runtime.getURL("icon.png");
    } catch(e) {
        // Fallback si l'image n'est pas disponible
        icon.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWFsZXJ0LWNpcmNsZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48bGluZSB4MT0iMTIiIHkxPSI4IiB4Mj0iMTIiIHkyPSIxMiIvPjxsaW5lIHgxPSIxMiIgeTE9IjE2IiB4Mj0iMTIuMDEiIHkyPSIxNiIvPjwvc3ZnPg==";
    }
    
    Object.assign(icon.style, {
        width: "100%",
        height: "100%",
        display: "block",
        borderRadius: "50%",
        objectFit: "cover",
        padding: "0",
        margin: "0",
        position: "absolute",
        top: "0",
        left: "0",
        transition: "opacity 0.3s ease"
    });
    
    const text = document.createElement("span");
    text.id = "errorCount";
    text.textContent = "0";
    Object.assign(text.style, {
        fontSize: "16px",
        fontWeight: "bold",
        color: "white",
        position: "absolute",
        top: "0",
        left: "0",
        zIndex: "20",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    });

    content.appendChild(icon);
    content.appendChild(text);
    errorBubble.appendChild(content);

    // Gestion des événements hover
    errorBubble.addEventListener("mouseenter", () => {
        icon.style.opacity = "0";
    });

    errorBubble.addEventListener("mouseleave", () => {
        icon.style.opacity = "1";
    });

    // Bouton de fermeture
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✖";
    closeBtn.style.cssText = `
        position: absolute;
        top: 0px;
        right: 0px;
        width: 14px;
        height: 14px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        transform: translate(50%, -50%);
        z-index: 10001;
    `;
    closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        errorBubble.style.visibility = "hidden";
    });
    
    errorBubble.appendChild(closeBtn);
    document.body.appendChild(errorBubble);
    
    // Écouteur de clic
    errorBubble.addEventListener("click", () => {
        console.log("Bulle cliquée");
        
        // Afficher ou masquer les alertes
        const alertsContainer = document.getElementById("errorAlertsContainer");
        if (alertsContainer) {
            alertsContainer.style.display = alertsContainer.style.display === "none" ? "flex" : "none";
        }
    });
    
    // Ajouter les animations si elles n'existent pas déjà
    if (!document.getElementById("bubbleAnimation")) {
        const style = document.createElement("style");
        style.id = "bubbleAnimation";
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    return errorBubble;
}

// Fonction optimisée pour le positionnement de la bulle près d'un champ
function positionBubbleNearInput(inputElement) {
    if (!inputElement) return;
    
    // Créer la bulle si elle n'existe pas encore
    const bubble = errorBubble || createErrorBubble();
    
    const rect = inputElement.getBoundingClientRect();
    
    // Positionnement optimisé
    const padding = 5;
    const bubbleSize = Math.min(rect.height * 0.8, 28);
    
    bubble.style.position = "absolute";
    bubble.style.top = (rect.top + window.scrollY + (rect.height - bubbleSize) / 2) + "px";
    bubble.style.left = (rect.right + window.scrollX - bubbleSize - padding) + "px";
    bubble.style.width = bubbleSize + "px";
    bubble.style.height = bubbleSize + "px";
    bubble.style.zIndex = "1001";
    bubble.style.visibility = "visible"; // S'assurer que la bulle est visible
    bubble.style.display = "flex"; // S'assurer que la bulle est affichée
    
    // Nettoyage des écouteurs précédents
    if (window._currentScrollHandler) {
        window.removeEventListener('scroll', window._currentScrollHandler);
    }
    if (window._currentResizeHandler) {
        window.removeEventListener('resize', window._currentResizeHandler);
    }
    
    // Définir une nouvelle fonction de mise à jour
    const updatePosition = () => {
        const updatedRect = inputElement.getBoundingClientRect();
        bubble.style.top = (updatedRect.top + window.scrollY + (updatedRect.height - bubbleSize) / 2) + "px";
        bubble.style.left = (updatedRect.right + window.scrollX - bubbleSize - padding) + "px";
    };
    
    // Stocker les références pour pouvoir les supprimer plus tard
    window._currentScrollHandler = updatePosition;
    window._currentResizeHandler = updatePosition;
    
    // Ajouter les nouveaux écouteurs
    window.addEventListener('scroll', window._currentScrollHandler, { passive: true });
    window.addEventListener('resize', window._currentResizeHandler, { passive: true });
    
    return bubble;
}

// Fonction optimisée pour créer le conteneur d'alertes
function createErrorContainer() {
    let alertsContainer = document.getElementById("errorAlertsContainer");
    
    if (alertsContainer) {
        return alertsContainer;
    }
    
    alertsContainer = document.createElement("div");
    alertsContainer.id = "errorAlertsContainer";
    Object.assign(alertsContainer.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "350px",
        zIndex: "10001",
        maxHeight: "70vh",
        overflowY: "auto",
        padding: "5px"
    });
    
    document.body.appendChild(alertsContainer);
    return alertsContainer;
}

// Fonction pour afficher une erreur - optimisée
function showError(input, message) {
    const alertsContainer = createErrorContainer();
    
    // Créer l'élément d'alerte
    const alert = document.createElement("div");
    alert.className = "alert-message";
    Object.assign(alert.style, {
        background: "linear-gradient(to right, #ff4444, #ff6b6b)",
        color: "white",
        padding: "12px 15px",
        borderRadius: "8px",
        fontSize: "13px",
        boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
        marginBottom: "5px",
        position: "relative",
        animation: "slideIn 0.3s ease-out forwards",
        display: "flex",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
        borderLeft: "4px solid #cc0000",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.4"
    });
    alert.innerText = message;
    
    // Ajouter un bouton de fermeture
    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "✕";
    Object.assign(closeBtn.style, {
        position: "absolute",
        top: "8px",
        right: "8px",
        cursor: "pointer",
        fontSize: "14px",
        opacity: "0.7",
        fontWeight: "bold"
    });
    
    const removeAlert = () => {
        alert.style.animation = "slideOut 0.3s ease-in forwards";
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
                if (alertsContainer.children.length === 0) {
                    alertsContainer.remove();
                }
            }
        }, 290);
    };
    
    closeBtn.addEventListener("click", removeAlert);
    alert.appendChild(closeBtn);
    
    // Ajouter l'icône d'erreur
    const errorIcon = document.createElement("div");
    errorIcon.innerHTML = "⚠️";
    Object.assign(errorIcon.style, {
        fontSize: "16px",
        marginRight: "10px"
    });
    alert.insertBefore(errorIcon, alert.firstChild);
    
    // Ajouter l'alerte au conteneur
    alertsContainer.appendChild(alert);
    
    // Ajouter les animations CSS si elles n'existent pas
    if (!document.getElementById("alertAnimations")) {
        const style = document.createElement("style");
        style.id = "alertAnimations";
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto-supprimer l'alerte après 5 secondes
    setTimeout(removeAlert, 5000);
}

// Fonction pour gérer les erreurs sans duplication
function showUniqueError(input, message) {
    if (activeAlerts.has(message)) {
        return;
    }
    
    activeAlerts.add(message);
    showError(input, message);
    
    // Supprimer du tracker après le délai d'affichage
    setTimeout(() => {
        activeAlerts.delete(message);
    }, 5000);
    
    // Mettre à jour le bouton de création
    updateCreateButton();
}

// Fonction pour déterminer si un champ appartient à l'extension
function isExtensionField(element) {
    if (!element) return true;
    
    // Vérifier si le champ se trouve dans un conteneur de l'extension
    const isInExtension = element.closest("#errorBubble") || 
                         element.closest("#chatBubble") || 
                         element.closest("#chatBotContainer") ||
                         element.closest("#errorAlertsContainer");
    
    // Vérifier les identifiants ou classes qui pourraient indiquer un champ de l'extension
    const hasExtensionClass = element.classList && (
        element.classList.contains("ext-field") || 
        element.id?.startsWith("ext-") ||
        element.id?.includes("bubble") ||
        element.id?.includes("chat")
    );
    
    return isInExtension || hasExtensionClass;
}

// Validation de segments - optimisée
function validateSegment(segment) {
    const errors = [];

    // Regex optimisés
    const idRegex = /^\[SWP-\d+\]/;
    const activityRegex = /\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]/;
    const ipRegex = /\[(IPNext|IP[1-3])\]/;

    // Vérifications
    if (!ipRegex.test(segment)) {
        errors.push("Invalid IP format. Expected one of: IPNext, IP1, IP2, IP3");
    }

    if (!activityRegex.test(segment)) {
        errors.push("Invalid activity. Allowed values: Nightly, Coverage, Periodic_2h, Weekly, FV, PreInt, PreGate");
    }

    if (!segment.includes(":")) {
        errors.push("Missing ': text' format");
    } else if (segment.split(':')[1].trim() === '') {
        errors.push("Description cannot be empty");
    }

    return errors;
}

// Fonction améliorée pour s'assurer que errorBubble est visible
function ensureErrorBubbleVisible(count) {
    // Obtenir ou créer la bulle
    const bubble = errorBubble || createErrorBubble();
    
    // S'assurer d'abord que la bulle est visible
    bubble.style.visibility = "visible";
    bubble.style.display = "flex";
    
    // Puis modifier son apparence selon le nombre d'erreurs
    updateErrorBubbleAppearance(bubble, count);
    
    // Si ce n'est pas déjà fait, positionner la bulle près du champ
    const summaryField = document.querySelector('input#summary, textarea#summary, input[name="summary"], .summary-field');
    if (summaryField) {
        positionBubbleNearInput(summaryField);
    }
    
    return bubble;
}

// Séparation de la mise à jour visuelle
function updateErrorBubbleAppearance(bubble, count) {
    const icon = document.getElementById("bubbleIcon");
    const text = document.getElementById("errorCount");
    
    if (count > 0) {
        // Style pour les erreurs
        Object.assign(bubble.style, {
            backgroundColor: "#ff4444",
            borderColor: "#ff0000",
            boxShadow: "0 2px 15px rgba(255,0,0,0.3), 0 0 5px rgba(255,150,150,0.8) inset",
            background: "radial-gradient(circle at 30% 30%, rgba(255,100,100,0.9), rgba(255,50,50,1))"
        });
        
        // Afficher le compteur, cacher l'icône
        if (icon) icon.style.display = "none";
        if (text) {
            text.style.display = "flex";
            text.textContent = count.toString();
            text.style.fontSize = count > 9 ? "14px" : "16px";
        }
        
        // Animation
        bubble.style.animation = "pulse 2s infinite";
    } else {
        // Style normal
        Object.assign(bubble.style, {
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "transparent",
            boxShadow: "0 2px 15px rgba(0,0,0,0.2), 0 0 5px rgba(255,255,255,0.8) inset",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(240,240,240,0.9))",
            animation: "none"
        });
        
        // Afficher l'icône, cacher le compteur
        if (icon) icon.style.display = "block";
        if (text) text.style.display = "none";
    }
}

// Méthode pour mettre à jour la bulle d'erreur (optimisée)
function updateErrorBubble(count) {
    const bubble = ensureErrorBubbleVisible(count);
    updateCreateButton();
}

// Fonction pour vérifier le texte
function checkText(input) {
    if (!input) return false;
    
    const text = input.value.trim();
    if (text === '') {
        errorCount = 0;
        updateErrorBubble(0);
        return false;
    }
    
    const lines = text.split('\n'); 
    let newErrorCount = 0;

    lines.forEach(line => {
        if (line.trim() === '') return;
        
        const errors = validateSegment(line);
        newErrorCount += errors.length;
        
        if (errors.length > 0) {
            // Limiter le nombre d'alertes affichées pour performance
            const maxAlerts = 3;
            errors.slice(0, maxAlerts).forEach(error => {
                showUniqueError(input, error);
            });
            
            if (errors.length > maxAlerts) {
                showUniqueError(input, `And ${errors.length - maxAlerts} more errors...`);
            }
        }
    });

    // Mettre à jour le compteur global d'erreurs et la bulle
    if (newErrorCount !== errorCount) {
        errorCount = newErrorCount;
        updateErrorBubble(errorCount);
        
        // Envoyer un message uniquement si nécessaire
        try {
            chrome.runtime.sendMessage({ type: "updateErrors", count: errorCount });
        } catch (e) {
            // Ignorer les erreurs de communication avec l'extension
        }
    }

    return errorCount > 0;
}

// Vérification des champs optimisée
function checkInput(input) {
    // Ignorer les champs appartenant à l'extension
    if (isExtensionField(input)) {
        return;
    }
    
    // Vérifier si c'est le champ summary
    const isSummary = input.id === "summary" || 
                     input.name === "summary" || 
                     input.classList.contains("summary-field");
    
    // Ne traiter que le champ summary
    if (isSummary) {
        const text = input.value.trim();

        if (text === "") {
            // Si le champ est vide, revenir à l'état initial (icône par défaut)
            errorCount = 0;
            updateErrorBubble(0);
        } else {
            // Vérifier immédiatement le texte
            checkText(input);
        }
        
        // S'assurer que la bulle d'erreur est visible et bien positionnée
        positionBubbleNearInput(input);
    }
}

// Fonction pour attacher l'événement mouseleave à un champ
function attachMouseLeaveHandler(field) {
    if (!field) return;
    
    // Supprimer le gestionnaire précédent pour éviter les doublons
    if (field._mouseleaveHandler) {
        field.removeEventListener('mouseleave', field._mouseleaveHandler);
    }
    
    // Gestionnaire pour le mouseleave
    const mouseleaveHandler = function(e) {
        // Ne vérifier que si la souris quitte complètement le champ
        if (e.relatedTarget !== this && !this.contains(e.relatedTarget)) {
            console.log("Mouse left the summary field, checking content");
            checkInput(this);
        }
    };
    
    // Stocker la référence pour pouvoir la supprimer plus tard
    field._mouseleaveHandler = mouseleaveHandler;
    
    // Attacher le gestionnaire
    field.addEventListener('mouseleave', mouseleaveHandler);
    
    // Ajouter aussi un gestionnaire pour blur (perte de focus)
    if (field._blurHandler) {
        field.removeEventListener('blur', field._blurHandler);
    }
    
    const blurHandler = function() {
        console.log("Summary field lost focus, checking content");
        checkInput(this);
    };
    
    field._blurHandler = blurHandler;
    field.addEventListener('blur', blurHandler);
}

// Modifier la fonction d'initialisation pour attacher ces événements
function initSummaryAutocomplete() {
    // Code existant...
    
    // Utiliser un sélecteur optimisé
    const summarySelector = 'input#summary, input[name="summary"], textarea#summary, .summary-field';
    const summaryField = document.querySelector(summarySelector);
    
    if (!summaryField) {
        console.log("Champ summary non trouvé - réessayer plus tard");
        return; // Sortir si le champ n'est pas trouvé
    }
    
    // Éviter la réinitialisation si déjà configuré
    if (summaryField.dataset.autocompleteInitialized === "true") {
        console.log("Autocomplétion déjà initialisée pour ce champ");
        return;
    }
    
    console.log("Initialisation de l'autocomplétion pour le champ:", summaryField);
    
    // Marquer comme initialisé
    summaryField.dataset.autocompleteInitialized = "true";
    
    // Définir le placeholder
    summaryField.placeholder = "Type ? for help ";
    
    // Supprimer les écouteurs existants pour éviter les doublons
    if (summaryField._keydownHandler) {
        summaryField.removeEventListener('keydown', summaryField._keydownHandler);
    }
    
    // Stocker la référence pour pouvoir la supprimer plus tard
    summaryField._keydownHandler = handleKeyDown;
    
    // Ajouter l'écouteur optimisé pour keydown
    summaryField.addEventListener('keydown', handleKeyDown);
    
    // Ajouter l'écouteur pour le filtrage progressif
    attachFilteringHandler(summaryField);
    
    // Ajouter les écouteurs pour détecter quand la souris quitte le champ
    attachMouseLeaveHandler(summaryField);
    
    // Valider la valeur initiale s'il y en a une
    if (summaryField.value.trim() !== '') {
        checkInput(summaryField);
    }
}

// Fonction optimisée pour activer/désactiver le bouton de création
function updateCreateButton() {
    // Utiliser le cache pour éviter les requêtes DOM répétées
    const createButton = document.querySelector('button[data-testid="issue-create.common.ui.footer.create-button"]');
    
    if (!createButton) return;
    
    if (errorCount > 0) {
        createButton.disabled = true;
        createButton.style.opacity = "0.5";
        createButton.style.cursor = "not-allowed";
        createButton.setAttribute("title", "Please fix all errors before submitting");
    } else {
        createButton.disabled = false;
        createButton.style.opacity = "1";
        createButton.style.cursor = "pointer";
        createButton.removeAttribute("title");
    }
}

// Fonction pour créer la bulle de chat - optimisée
function createBubbleChat() {
    // Vérifier si la bulle existe déjà
    if (chatBubble) {
        chatBubble.style.display = "flex";
        chatBubble.style.visibility = "visible";
        return chatBubble;
    }
    
    // Créer la bulle de chat
    chatBubble = document.createElement("div");
    chatBubble.id = "chatBubble";
    Object.assign(chatBubble.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "60px",
        height: "60px",
        backgroundColor: "transparent",
        color: "white",
        borderRadius: "50%",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "all 0.3s ease",
        zIndex: "2147483647",
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
    try {
        chatImage.src = chrome.runtime.getURL("chat.png");
    } catch(e) {
        // Fallback si l'image n'est pas disponible
        chatImage.style.backgroundColor = "#7B61FF";
        chatImage.alt = "Chat";
    }
    chatImage.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    `;
    
    content.appendChild(chatImage);
    chatBubble.appendChild(content);

    // Ajouter au document
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

    document.body.appendChild(chatContainer);

    // Toggle du chat en cliquant sur la bulle
    let chatVisible = false;
    chatBubble.addEventListener("click", () => {
        chatVisible = !chatVisible;
        chatContainer.style.display = chatVisible ? "block" : "none";
        
        // Si on affiche le chat, vérifier si Streamlit est déjà en cours d'exécution
        if (chatVisible) {
            // Afficher l'écran de chargement pendant la vérification
            chatContainer.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: white;">
                    <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #7B61FF; border-radius: 50%; animation: spin 2s linear infinite;"></div>
                    <p style="margin-top: 20px; color: #333;">Connexion au chatbot...</p>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </div>
            `;
            
            // Tenter de démarrer directement le script batch
            const batchWindow = window.open('file:///C:/Users/NITRO/Documents/pfe/extension/v3/demarrer_chatbot.bat', '_blank');
            setTimeout(() => {
                if (batchWindow) batchWindow.close();
            }, 500);
            
            // Vérifier après un court délai si le serveur est disponible
            setTimeout(() => {
                checkServerAndLoad();
            }, 2000);
        } else {
            // Si on ferme le chat, vider le conteneur
            chatContainer.innerHTML = '';
        }
        
        // Effet visuel pour montrer l'état actif
        if (chatVisible) {
            chatBubble.style.boxShadow = "0 0 15px rgba(0,0,0,0.25)";
            chatBubble.style.transform = "scale(1.05)";
        } else {
            chatBubble.style.boxShadow = "0 2px 10px rgba(0,0,0,0.15)";
            chatBubble.style.transform = "scale(1)";
        }
    });

    // Fonction pour vérifier le serveur et charger l'iframe
    function checkServerAndLoad() {
        let attempts = 0;
        const maxAttempts = 15;
        
        const checkInterval = setInterval(() => {
            fetch('http://localhost:8501', { mode: 'no-cors' })
                .then(() => {
                    // Le serveur est disponible
                    clearInterval(checkInterval);
                    
                    // Charger l'iframe
                    const iframe = document.createElement("iframe");
                    iframe.src = "http://localhost:8501";
                    iframe.style.width = "100%";
                    iframe.style.height = "100%";
                    iframe.style.border = "none";
                    chatContainer.innerHTML = '';
                    chatContainer.appendChild(iframe);
                })
                .catch(() => {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        // Le serveur n'est toujours pas disponible après 15 tentatives
                        clearInterval(checkInterval);
                        
                        chatContainer.innerHTML = `
                            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: white; padding: 20px; text-align: center;">
                                <p style="color: #ff4444; margin-bottom: 15px;">Le chatbot n'a pas pu être démarré automatiquement.</p>
                                <button id="openBatchButton" style="padding: 8px 15px; background: #7B61FF; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 12px;">
                                    Ouvrir demarrer_chatbot.bat
                                </button>
                                <button id="retryButton" style="padding: 8px 15px; background: #5a5a5a; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 12px;">
                                    Réessayer
                                </button>
                                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                                    Après avoir lancé le chatbot, cliquez sur "Réessayer".
                                </p>
                            </div>
                        `;
                        
                        // Ajouter les écouteurs d'événements pour les boutons
                        document.getElementById("openBatchButton").addEventListener("click", () => {
                            window.open('file:///C:/Users/NITRO/Documents/pfe/extension/v3/demarrer_chatbot.bat', '_blank');
                        });
                        
                        document.getElementById("retryButton").addEventListener("click", checkServerAndLoad);
                    }
                });
        }, 1000);
    }

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

    return chatBubble;
}

// Analyse des segments de texte - optimisée
function parseTextSegments(text) {
    if (!text) return [];
    
    const segments = [];
    let bracketLevel = 0;
    let segmentStart = 0;
    let currentSegment = -1;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === '[') {
            if (bracketLevel === 0) {
                currentSegment++;
                segmentStart = i;
            }
            bracketLevel++;
        } 
        else if (char === ']') {
            bracketLevel--;
            if (bracketLevel === 0 && currentSegment >= 0) {
                segments.push({
                    start: segmentStart,
                    end: i,
                    type: currentSegment === 0 ? 'IP' : 'Activity',
                    content: text.substring(segmentStart, i + 1)
                });
            }
        }
        else if (char === ':' && bracketLevel === 0) {
            segments.push({
                start: i,
                end: text.length,
                type: 'Description',
                content: text.substring(i)
            });
            break;
        }
    }
    
    return segments;
}

// Fonction améliorée pour déterminer le segment à la position du curseur
function getSegmentAtCursor(text, position) {
    // Si le texte est vide ou la position est 0 et le texte ne commence pas par [
    if (!text || (position === 0 && !text.startsWith('['))) {
        return 0; // Premier segment (IP)
    }
    
    // Utiliser les segments analysés pour déterminer la position
    const segments = parseTextSegments(text);
    
    // Si aucun segment n'est trouvé, déterminer en fonction de la structure du texte
    if (segments.length === 0) {
        return 0; // Commencer par IP
    }
    
    // Vérifier chaque segment
    for (let i = 0; i < segments.length; i++) {
        // Si le curseur est dans ce segment (y compris juste après le crochet fermant)
        if (position >= segments[i].start && position <= segments[i].end + 1) {
            return i;
        }
    }
    
    // Si le curseur est après le dernier segment trouvé
    const lastSegment = segments[segments.length - 1];
    if (position > lastSegment.end) {
        if (segments.length === 1) return 1; // Après IP, suivant est Activity
        if (segments.length === 2) return 2; // Après Activity, suivant est Description
    }
    
    // Par défaut, revenir au premier segment manquant
    return segments.length === 0 ? 0 : (segments.length === 1 ? 1 : 2);
}

// Gestion optimisée du segment IP
function handleIPSection(field, text, cursorPos, segments) {
    // Vérifier si un segment IP existe déjà
    const ipSegment = segments.find(s => s.type === 'IP');
    
    // Assurer le focus sur le champ
    field.focus();
    
    if (ipSegment) {
        // Conserver le reste du texte après le segment IP
        const afterIP = text.substring(ipSegment.end + 1);
        
        // Stocker pour la restauration
        field.dataset.afterIp = afterIP;
        field.dataset.mode = "replace-ip";
        field.dataset.currentSegment = "0"; // Marquer le segment actuel comme IP
        
        // Si le curseur est dans le segment IP, remplacer juste ce segment
        if (cursorPos >= ipSegment.start && cursorPos <= ipSegment.end) {
            const beforeIP = text.substring(0, ipSegment.start);
            field.value = beforeIP + '[';
            field.dataset.filterPos = beforeIP.length + 1;
            setTimeout(() => field.setSelectionRange(beforeIP.length + 1, beforeIP.length + 1), 0);
        } else {
            // Sinon, commencer un nouveau segment IP au début
            field.value = '[';
            field.dataset.filterPos = 1;
            setTimeout(() => field.setSelectionRange(1, 1), 0);
        }
    } else {
        // Nouveau IP
        field.dataset.mode = "new-ip";
        field.dataset.currentSegment = "0"; // Marquer le segment actuel comme IP
        
        // S'assurer qu'on commence bien par un crochet
        if (!text.startsWith('[')) {
            field.value = '[' + text;
            field.dataset.filterPos = 1;
            setTimeout(() => field.setSelectionRange(1, 1), 0);
        } else if (cursorPos > 0) {
            // Le curseur est après un crochet existant
            field.dataset.filterPos = cursorPos;
            setTimeout(() => field.setSelectionRange(cursorPos, cursorPos), 0);
        } else {
            field.dataset.filterPos = 1;
            setTimeout(() => field.setSelectionRange(1, 1), 0);
        }
    }
    
    // Afficher les options IP
    showOptionsMenu(field, validIPOptions, 0);
}

// Gestion du segment Activity - optimisée
function handleActivitySection(field, text, cursorPos, segments) {
    // Assurer le focus
    field.focus();
    
    // Vérifier si on a déjà un segment IP et un segment Activity
    const ipSegment = segments.find(s => s.type === 'IP');
    const activitySegment = segments.find(s => s.type === 'Activity');
    
    if (activitySegment) {
        // Si on est dans le segment Activity, le remplacer
        if (cursorPos >= activitySegment.start && cursorPos <= activitySegment.end) {
            const beforeActivity = text.substring(0, activitySegment.start);
            const afterActivity = text.substring(activitySegment.end + 1);
            
            field.dataset.beforeActivity = beforeActivity;
            field.dataset.afterActivity = afterActivity;
            field.dataset.mode = "replace-activity";
            field.dataset.currentSegment = "1"; // Marquer le segment actuel comme Activity
            
            field.value = beforeActivity + '[';
            field.dataset.filterPos = beforeActivity.length + 1;
            setTimeout(() => field.setSelectionRange(beforeActivity.length + 1, beforeActivity.length + 1), 0);
        } else {
            // Si on est après Activity, gérer la description
            handleDescriptionSection(field, text, cursorPos, segments);
        }
    } else if (ipSegment) {
        // Si on a un segment IP mais pas d'Activity
        field.dataset.mode = "new-activity";
        field.dataset.currentSegment = "1"; // Marquer le segment actuel comme Activity
        
        // Ajouter directement un crochet après IP sans espace
        const afterIP = text.substring(ipSegment.end + 1);
        
        // Vérifier s'il y a déjà un crochet après IP
        if (afterIP.startsWith('[')) {
            // Le crochet existe déjà, placer le curseur après
            field.dataset.filterPos = ipSegment.end + 2;
            setTimeout(() => field.setSelectionRange(ipSegment.end + 2, ipSegment.end + 2), 0);
        } else {
            // Pas de crochet après IP, ajouter le crochet sans espace
            field.value = text.substring(0, ipSegment.end + 1) + '[';
            field.dataset.filterPos = ipSegment.end + 2;
            setTimeout(() => field.setSelectionRange(ipSegment.end + 2, ipSegment.end + 2), 0);
        }
    } else {
        // Pas de segment IP, commencer par IP
        handleIPSection(field, text, cursorPos, segments);
        return;
    }
    
    // Afficher les options d'activité
    showOptionsMenu(field, validActivities, 1);
}

// Modifier la fonction moveToNextSegment pour supprimer les espaces entre segments
function moveToNextSegment(inputField, text, position) {
    let newText = text;
    
    switch (currentSegment) {
        case 0: // Après ID, ajouter [IPNext] sans espace
            newText = text + '[IPNext]';
            inputField.value = newText;
            inputField.setSelectionRange(newText.length, newText.length);
            currentSegment = 1;
            
            // Ajouter automatiquement le segment suivant avec le crochet ouvrant sans espace
            setTimeout(() => {
                newText += '[';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                currentSegment = 2;
                showActivityMenu(inputField, newText.length);
            }, 100);
            break;
            
        case 1: // Après IPNext, ajouter [ sans espace
            newText = text + '[';
            inputField.value = newText;
            inputField.setSelectionRange(newText.length, newText.length);
            currentSegment = 2;
            showActivityMenu(inputField, newText.length);
            break;
            
        case 2: // Après Activity, ajouter : sans espace
            newText = text + ':';
            inputField.value = newText;
            inputField.setSelectionRange(newText.length, newText.length);
            currentSegment = 3;
            break;
            
        case 3: // Après les deux-points, ajouter espace pour la description
            newText = text + ' ';
            inputField.value = newText;
            inputField.setSelectionRange(newText.length, newText.length);
            currentSegment = 4;
            break;
    }
    
    // Déclencher un événement input pour vérifier la validité
    inputField.dispatchEvent(new Event('input', { bubbles: true }));
}


// Gestion du segment Description - optimisée
function handleDescriptionSection(field, text, cursorPos, segments) {
    field.focus();
    
    const ipSegment = segments.find(s => s.type === 'IP');
    const activitySegment = segments.find(s => s.type === 'Activity');
    const descriptionSegment = segments.find(s => s.type === 'Description');
    
    // Vérifier si les segments obligatoires sont présents
    if (!ipSegment) {
        handleIPSection(field, text, cursorPos, segments);
        return;
    }
    
    if (!activitySegment) {
        handleActivitySection(field, text, cursorPos, segments);
        return;
    }
    
    // Si on a IP et Activity mais pas de description
    if (!descriptionSegment) {
        const afterActivity = text.substring(activitySegment.end + 1);
        
        // Marquer le segment actuel comme Description
        field.dataset.currentSegment = "2";
        
        // Vérifier s'il y a déjà un espace après Activity
        if (afterActivity.trim() === '') {
            field.value = text + ' : ';
            field.dataset.filterPos = field.value.length;
        } else if (!afterActivity.includes(':')) {
            field.value = text + ' : ';
            field.dataset.filterPos = field.value.length;
        }
        setTimeout(() => field.setSelectionRange(field.value.length, field.value.length), 0);
    } else {
        // La description existe déjà, placer le curseur à la fin
        field.dataset.currentSegment = "2";
        field.dataset.filterPos = field.value.length;
        setTimeout(() => field.setSelectionRange(field.value.length, field.value.length), 0);
    }
}

// Affichage optimisé du menu d'options
function showOptionsMenu(field, options, segmentType, filterText = '') {
  // Supprimer le menu existant
  if (optionsMenu) {
      optionsMenu.remove();
      optionsMenu = null;
  }
  
  console.log(`showOptionsMenu appelé - segment: ${segmentType}, filtre: "${filterText}"`);
  console.log(`Options disponibles:`, options);
  
  // Créer le nouveau menu
  optionsMenu = document.createElement('div');
  optionsMenu.className = 'options-menu';
  optionsMenu.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      max-width: 300px;
      z-index: 10000;
      overflow-y: auto;
      max-height: 200px;
  `;
  
  // Titre du menu montrant le type de segment
  const menuTitle = document.createElement('div');
  menuTitle.className = 'menu-title';
  menuTitle.style.cssText = `
      padding: 6px 10px;
      background: #f4f4f4;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
      font-size: 12px;
      color: #555;
  `;
  menuTitle.textContent = segmentType == 0 ? 'Options IP' : 'Options Activity';
  optionsMenu.appendChild(menuTitle);
  
  // Filtrer les options si un texte de filtre est fourni
  let filteredOptions = options;
  
  if (filterText && filterText.trim() !== '') {
      filterText = filterText.toLowerCase();
      console.log(`Filtrage avec le texte: "${filterText}"`);
      
      // CORRECTION IMPORTANTE: Rechercher si une option CONTIENT le texte (pas seulement commence par)
      filteredOptions = options.filter(option => 
          option.toLowerCase().includes(filterText)
      );
      
      console.log(`Résultat du filtrage:`, filteredOptions);
  }
  
  // Si aucune option ne correspond au filtre, afficher un message
  if (filteredOptions.length === 0) {
      const noMatch = document.createElement('div');
      noMatch.className = 'no-option';
      noMatch.textContent = 'Aucune option ne correspond à "' + filterText + '"';
      noMatch.style.cssText = `
          padding: 8px 10px;
          font-size: 14px;
          color: #999;
          font-style: italic;
          text-align: center;
      `;
      optionsMenu.appendChild(noMatch);
  } else {
      // Utiliser un fragment pour améliorer la performance
      const fragment = document.createDocumentFragment();
      
      // Ajouter les options filtrées au menu
      filteredOptions.forEach(option => {
          const item = document.createElement('div');
          item.className = 'option-item';
          
          // Mettre en évidence la partie filtrée si un filtre est appliqué
          if (filterText && filterText.trim() !== '') {
              const lowerOption = option.toLowerCase();
              const filterIndex = lowerOption.indexOf(filterText.toLowerCase());
              
              if (filterIndex >= 0) {
                  const before = option.substring(0, filterIndex);
                  const match = option.substring(filterIndex, filterIndex + filterText.length);
                  const after = option.substring(filterIndex + filterText.length);
                  
                  item.innerHTML = before + '<strong style="background:rgb(153, 223, 255);">' + match + '</strong>' + after;
              } else {
                  item.textContent = option;
              }
          } else {
              item.textContent = option;
          }
          
          item.style.cssText = `
              padding: 8px 10px;
              cursor: pointer;
              font-size: 14px;
              transition: background 0.2s;
          `;
          
          // Utiliser des fonctions anonymes pré-liées pour optimiser les performances
          const handleMouseOver = () => { item.style.background = '#f0f0f0'; };
          const handleMouseOut = () => { item.style.background = 'white'; };
          
          item.addEventListener('mouseover', handleMouseOver);
          item.addEventListener('mouseout', handleMouseOut);
          
          // Optimiser le gestionnaire de clic
          item.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              selectOption(field, option, segmentType);
              if (optionsMenu) {
                  optionsMenu.remove();
                  optionsMenu = null;
              }
              
              // Réinitialiser le mode filtre
              field.dataset.filterMode = "";
              field.dataset.filterText = "";
          });
          
          fragment.appendChild(item);
      });
      
      optionsMenu.appendChild(fragment);
  }
  
  // Ajouter le texte d'aide avec indication du type de segment
  const helpText = document.createElement('div');
  helpText.className = 'help-text';
  helpText.innerHTML = `<small>Filtrage ${segmentType == 0 ? 'IP' : 'Activity'} - Tapez pour filtrer, Entrée pour sélectionner, Échap pour fermer</small>`;
  helpText.style.cssText = `
      padding: 5px;
      font-size: 11px;
      color: #777;
      text-align: center;
      border-top: 1px solid #eee;
  `;
  optionsMenu.appendChild(helpText);
  
  // Positionner le menu sous le champ
  const rect = field.getBoundingClientRect();
  optionsMenu.style.left = rect.left + 'px';
  optionsMenu.style.top = (rect.bottom + window.scrollY) + 'px';
  optionsMenu.style.width = rect.width + 'px';
  
  // Ajouter le menu au document
  document.body.appendChild(optionsMenu);
  
  // Sélectionner la première option s'il y en a
  if (filteredOptions.length > 0) {
      const firstOption = optionsMenu.querySelector('.option-item');
      if (firstOption) {
          firstOption.classList.add('selected');
          firstOption.style.background = '#f0f0f0';
      }
  }
  
  // Fermer le menu lors d'un clic ailleurs
  const closeMenuOnClick = (e) => {
      if (optionsMenu && !optionsMenu.contains(e.target) && e.target !== field) {
          if (optionsMenu.parentNode) {
              optionsMenu.remove();
          }
          optionsMenu = null;
          
          field.dataset.filterMode = "";
          field.dataset.filterText = "";
          
          document.removeEventListener('click', closeMenuOnClick);
      }
  };
  
  // Mettre un délai pour éviter que le menu ne se ferme immédiatement
  setTimeout(() => {
      document.addEventListener('click', closeMenuOnClick);
  }, 10);
}
function selectOption(field, option, segmentType) {
    const currentValue = field.value;
    const cursorPos = field.selectionStart;
    
    console.log(`Sélection d'option: ${option} pour le segment ${segmentType}`);
    
    // Traiter selon le mode et le segment
    if (segmentType == 0) { // IP 
        // Déterminer le mode
        const mode = field.dataset.mode || "new-ip";
        console.log(`Mode IP: ${mode}`);
        
        if (mode === "replace-ip") {
            // Remplacer l'IP existant
            const afterIp = field.dataset.afterIp || "";
            field.value = `[${option}]${afterIp}`;
            
            // Positionner le curseur après le segment IP
            const newCursorPos = option.length + 2;
            setTimeout(() => field.setSelectionRange(newCursorPos, newCursorPos), 0);
            
            // Nettoyer les données temporaires
            delete field.dataset.mode;
            delete field.dataset.afterIp;
        } else {
            // Nouveau IP
            if (currentValue.startsWith('[')) {
                // Compléter le crochet ouvert
                field.value = `[${option}]${currentValue.substring(1)}`;
            } else {
                // Ajouter un nouveau segment IP
                field.value = `[${option}]${currentValue}`;
            }
            
            // Positionner le curseur après le segment IP
            const newCursorPos = option.length + 2;
            setTimeout(() => field.setSelectionRange(newCursorPos, newCursorPos), 0);
        }
    } else if (segmentType == 1) { // Activity
        // Déterminer le mode
        const mode = field.dataset.mode || "new-activity";
        console.log(`Mode Activity: ${mode}`);
        
        if (mode === "replace-activity") {
            // Remplacer l'activité existante
            const beforeActivity = field.dataset.beforeActivity || "";
            const afterActivity = field.dataset.afterActivity || "";
            field.value = `${beforeActivity}[${option}]${afterActivity}`;
            
            // Positionner le curseur après le segment Activity
            const newCursorPos = beforeActivity.length + option.length + 2;
            setTimeout(() => field.setSelectionRange(newCursorPos, newCursorPos), 0);
            
            // Nettoyer les données temporaires
            delete field.dataset.mode;
            delete field.dataset.beforeActivity;
            delete field.dataset.afterActivity;
        } else {
            // Nouvelle activité
            const ipEnd = currentValue.indexOf(']');
            
            if (ipEnd !== -1) {
                // Déterminer si un crochet ouvrant pour l'activité existe déjà
                const activityStart = currentValue.indexOf('[', ipEnd);
                
                if (activityStart !== -1 && activityStart < cursorPos) {
                    // Compléter le crochet ouvert existant
                    field.value = currentValue.substring(0, activityStart + 1) + 
                                option + ']' + 
                                currentValue.substring(activityStart + 1);
                } else {
                    // Ajouter un nouveau segment Activity après IP sans espace
                    field.value = currentValue.substring(0, ipEnd + 1) + 
                                `[${option}]` + 
                                currentValue.substring(ipEnd + 1);
                }
                
                // Positionner le curseur après le segment Activity
                const newActivityEnd = field.value.indexOf(']', ipEnd + 1);
                if (newActivityEnd !== -1) {
                    setTimeout(() => field.setSelectionRange(newActivityEnd + 1, newActivityEnd + 1), 0);
                }
            } else {
                // Pas de segment IP valide, recommencer avec IP
                field.value = `[${validIPOptions[0]}][${option}]`;
                setTimeout(() => field.setSelectionRange(field.value.length, field.value.length), 0);
            }
        }
    } else {
        console.log(`Type de segment non reconnu: ${segmentType}`);
    }
    
    // Vérifier si on doit ajouter automatiquement un séparateur pour la description
    const segments = parseTextSegments(field.value);
    if (segments.length === 2 && !field.value.includes(':')) {
        field.value += ':';
        setTimeout(() => field.setSelectionRange(field.value.length, field.value.length), 0);
    }
    
    // Déclencher un événement input pour activer les validateurs
    field.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Vérifier le texte pour détecter les erreurs
    checkText(field);
  }
  


function enhanceKeyboardNavigation() {
  document.addEventListener('keydown', function(e) {
      if (!optionsMenu) return;
      
      const options = Array.from(optionsMenu.querySelectorAll('.option-item'));
      if (options.length === 0) return;
      
      const selectedOption = optionsMenu.querySelector('.option-item.selected');
      let currentIndex = selectedOption ? options.indexOf(selectedOption) : 0;
      
      // Naviguer avec les flèches haut/bas
      if (e.key === 'ArrowDown' || e.keyCode === 40) {
          e.preventDefault();
          if (currentIndex < options.length - 1) currentIndex++;
          else currentIndex = 0; // Boucler au début
      } else if (e.key === 'ArrowUp' || e.keyCode === 38) {
          e.preventDefault();
          if (currentIndex > 0) currentIndex--;
          else currentIndex = options.length - 1; // Boucler à la fin
      } else {
          return; // Ne rien faire pour les autres touches
      }
      
      // Mettre à jour la sélection
      options.forEach(opt => {
          opt.classList.remove('selected');
          opt.style.background = 'white';
      });
      
      options[currentIndex].classList.add('selected');
      options[currentIndex].style.background = '#f0f0f0';
      
      // Faire défiler si nécessaire pour que l'option sélectionnée soit visible
      options[currentIndex].scrollIntoView({ block: 'nearest' });
  });
}

// S'assurer que la navigation au clavier est activée
enhanceKeyboardNavigation();
// Gestionnaire de clavier optimisé pour que ? fonctionne dans n'importe quel segment
function handleKeyDown(e) {
    // S'assurer que le champ est en focus
    if (document.activeElement !== this) {
        return;
    }
    
    // Capturer la touche ? pour déclencher l'assistant dans n'importe quel segment
    if (e.key === '?' || e.keyCode === 191) {
        e.preventDefault();
        
        // Obtenir les informations sur le champ et la position du curseur
        const text = this.value;
        const cursorPos = this.selectionStart;
        
        // Analyser le texte pour identifier les segments
        const segments = parseTextSegments(text);
        
        // Déterminer précisément le segment actuel en fonction de la position du curseur
        const segmentIndex = getSegmentAtCursor(text, cursorPos);
        
        console.log("Position du curseur:", cursorPos, "Segment détecté:", segmentIndex);
        
        // Stocker le segment actuel et la position pour le filtrage
        this.dataset.filterMode = "start";
        this.dataset.filterPos = cursorPos.toString();
        this.dataset.filterText = "";
        this.dataset.currentSegment = segmentIndex.toString();
        
        // Traiter selon le segment détecté
        switch(segmentIndex) {
            case 0: // IP segment
                // Si on est dans un segment IP existant, le remplacer
                const ipSegment = segments.find(s => s.type === 'IP');
                if (ipSegment && cursorPos >= ipSegment.start && cursorPos <= ipSegment.end) {
                    // Préparer le champ pour remplacer le segment IP
                    const beforeIP = text.substring(0, ipSegment.start);
                    const afterIP = text.substring(ipSegment.end + 1);
                    this.dataset.afterIp = afterIP;
                    this.dataset.mode = "replace-ip";
                    this.value = beforeIP + '[';
                    this.dataset.filterPos = beforeIP.length + 1;
                    setTimeout(() => this.setSelectionRange(beforeIP.length + 1, beforeIP.length + 1), 0);
                    showOptionsMenu(this, validIPOptions, 0);
                } else {
                    // Sinon, traiter normalement le segment IP
                    handleIPSection(this, text, cursorPos, segments);
                }
                break;
                
            case 1: // Activity segment
                // Si on est dans un segment Activity existant, le remplacer
                const activitySegment = segments.find(s => s.type === 'Activity');
                if (activitySegment && cursorPos >= activitySegment.start && cursorPos <= activitySegment.end) {
                    // Préparer le champ pour remplacer le segment Activity
                    const beforeActivity = text.substring(0, activitySegment.start);
                    const afterActivity = text.substring(activitySegment.end + 1);
                    this.dataset.beforeActivity = beforeActivity;
                    this.dataset.afterActivity = afterActivity;
                    this.dataset.mode = "replace-activity";
                    this.value = beforeActivity + '[';
                    this.dataset.filterPos = beforeActivity.length + 1;
                    setTimeout(() => this.setSelectionRange(beforeActivity.length + 1, beforeActivity.length + 1), 0);
                    showOptionsMenu(this, validActivities, 1);
                } else {
                    // Sinon, traiter normalement le segment Activity
                    handleActivitySection(this, text, cursorPos, segments);
                }
                break;
                
            case 2: // Description segment
                // Pour la description, il n'y a pas d'autocomplétion
                handleDescriptionSection(this, text, cursorPos, segments);
                break;
                
            default:
                // Si on ne peut pas déterminer le segment, essayer IP par défaut
                handleIPSection(this, text, cursorPos, segments);
        }
        
        // Déclencher immédiatement le filtrage
        this.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Le reste de la fonction reste inchangé
    else if (this.dataset.filterMode === "start" || this.dataset.filterMode === "filtering") {
      // Mise à jour du mode
      this.dataset.filterMode = "filtering";
      
      // Obtenir le segment actuel depuis les données stockées - IMPORTANT: s'assurer que segmentIndex est correctement interprété
      const segmentIndex = parseInt(this.dataset.currentSegment) || 0;
      console.log("Mode filtrage actif - segment:", segmentIndex);
      
      // Si la touche entrée est pressée, sélectionner la première option filtrée
      if ((e.key === 'Enter' || e.keyCode === 13) && optionsMenu && optionsMenu.querySelector('.option-item')) {
          e.preventDefault();
          const firstOption = optionsMenu.querySelector('.option-item');
          firstOption.click();
          return;
      }
      
      // Si Escape est pressé, annuler le filtrage
      if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault();
          if (optionsMenu) {
              optionsMenu.remove();
              optionsMenu = null;
          }
          this.dataset.filterMode = "";
          this.dataset.filterText = "";
          return;
      }
      
      // Gestionnaire pour les caractères imprimables et la touche Backspace
      setTimeout(() => {
          // Ne rien faire si le menu d'options a été fermé
          if (!optionsMenu) {
              this.dataset.filterMode = "";
              this.dataset.filterText = "";
              return;
          }
          
          // Mettre à jour le texte du filtre
          const currentPos = this.selectionStart;
          const filterStartPos = parseInt(this.dataset.filterPos) || 0;
          
          // Capturer le texte tapé pour le filtre
          if (currentPos >= filterStartPos) {
              this.dataset.filterText = this.value.substring(filterStartPos, currentPos);
              console.log("Filtrage avec:", this.dataset.filterText, "pour segment", segmentIndex);
          } else {
              this.dataset.filterText = "";
              this.dataset.filterPos = currentPos.toString();
          }
          
          // CORRECTION IMPORTANTE: s'assurer que le bon ensemble d'options est utilisé selon le segment
          const filterText = this.dataset.filterText.toLowerCase();
          
          // Utiliser explicitement les options correctes selon le segment
          let options;
          if (segmentIndex == 0) { // Segment IP - utiliser == au lieu de === pour une comparaison plus souple
              options = validIPOptions;
              console.log("Utilisation des options IP pour le filtrage");
          } else if (segmentIndex == 1) { // Segment Activity
              options = validActivities;
              console.log("Utilisation des options Activity pour le filtrage");
          } else {
              // Par défaut, utiliser IP
              options = validIPOptions;
              console.log("Segment non reconnu, utilisation des options IP par défaut");
          }
          
          // Mettre à jour le menu avec les options filtrées et le bon type de segment
          showOptionsMenu(this, options, segmentIndex, filterText);
      }, 0);
  }
}




// Fonction pour attacher le gestionnaire de filtrage
function attachFilteringHandler(field) {
    // Supprimer le gestionnaire existant pour éviter les doublons
    if (field._inputHandler) {
        field.removeEventListener('input', field._inputHandler);
    }
    
    // Fonction de filtrage en temps réel améliorée
    const inputHandler = function() {
        // Ne filtrer que si on est en mode filtrage
        if ((this.dataset.filterMode === "filtering" || this.dataset.filterMode === "start") && optionsMenu) {
            // Mise à jour du mode
            this.dataset.filterMode = "filtering";
            
            const currentPos = this.selectionStart;
            const filterStartPos = parseInt(this.dataset.filterPos) || 0;
            const segmentIndex = parseInt(this.dataset.currentSegment) || 0;
            
            // Mise à jour du texte de filtre
            if (currentPos >= filterStartPos) {
                this.dataset.filterText = this.value.substring(filterStartPos, currentPos);
                console.log("Mise à jour du filtre:", this.dataset.filterText);
            } else {
                // Si le curseur a reculé, réinitialiser
                this.dataset.filterText = "";
                this.dataset.filterPos = currentPos.toString();
            }
            
            // Appliquer le filtrage selon le segment actuel
            const options = segmentIndex === 0 ? validIPOptions : validActivities;
            showOptionsMenu(this, options, segmentIndex, this.dataset.filterText);
        }
    };
    
    // Stocker la référence pour pouvoir la supprimer plus tard
    field._inputHandler = inputHandler;
    
    // Attacher le gestionnaire optimisé
    field.addEventListener('input', inputHandler);
    
    // Ajouter aussi un gestionnaire spécifique pour la touche Backspace
    const keydownHandler = function(e) {
        if (e.key === 'Backspace' && (this.dataset.filterMode === "filtering" || this.dataset.filterMode === "start") && optionsMenu) {
            // Déclencher le filtrage après un court délai pour permettre la mise à jour de la valeur
            setTimeout(() => {
                const currentPos = this.selectionStart;
                const filterStartPos = parseInt(this.dataset.filterPos) || 0;
                const segmentIndex = parseInt(this.dataset.currentSegment) || 0;
                
                if (currentPos >= filterStartPos) {
                    this.dataset.filterText = this.value.substring(filterStartPos, currentPos);
                } else {
                    this.dataset.filterText = "";
                    this.dataset.filterPos = currentPos.toString();
                }
                
                const options = segmentIndex === 0 ? validIPOptions : validActivities;
                showOptionsMenu(this, options, segmentIndex, this.dataset.filterText);
            }, 0);
        }
    };
    
    // Stocker la référence pour pouvoir la supprimer plus tard
    field._backspaceHandler = keydownHandler;
    
    // Attacher le gestionnaire
    field.addEventListener('keydown', keydownHandler);
  }


// Fonction optimisée pour l'initialisation de l'autocomplétion
function initSummaryAutocomplete() {
    // Utiliser un sélecteur optimisé
    const summarySelector = 'input#summary, input[name="summary"], textarea#summary, .summary-field';
    const summaryField = document.querySelector(summarySelector);
    
    if (!summaryField) {
        console.log("Champ summary non trouvé - réessayer plus tard");
        return; // Sortir si le champ n'est pas trouvé
    }
    
    // Éviter la réinitialisation si déjà configuré
    if (summaryField.dataset.autocompleteInitialized === "true") {
        console.log("Autocomplétion déjà initialisée pour ce champ");
        return;
    }
    
    console.log("Initialisation de l'autocomplétion pour le champ:", summaryField);
    
    // Marquer comme initialisé
    summaryField.dataset.autocompleteInitialized = "true";
    
    // Définir le placeholder
    summaryField.placeholder = "Type ? for help ";
    
    // Supprimer les écouteurs existants pour éviter les doublons
    if (summaryField._keydownHandler) {
        summaryField.removeEventListener('keydown', summaryField._keydownHandler);
    }
    
    // Stocker la référence pour pouvoir la supprimer plus tard
    summaryField._keydownHandler = handleKeyDown;
    
    // Ajouter l'écouteur optimisé pour keydown
    summaryField.addEventListener('keydown', handleKeyDown);
    
    // Ajouter l'écouteur pour le filtrage progressif
    attachFilteringHandler(summaryField);
    
    // Valider la valeur initiale s'il y en a une
    if (summaryField.value.trim() !== '') {
        checkInput(summaryField);
    }
}

function addAdaptiveTooltip() {
  console.log('Démarrage de addAdaptiveTooltip');
  
  // Supprimer les tooltips existants pour éviter les doublons
  document.querySelectorAll('.jira-tooltip-icon').forEach(tooltip => {
      tooltip.remove();
      console.log('Ancien tooltip supprimé');
  });
  
  // Recherche du champ summary par différentes méthodes
  let summaryField = document.querySelector('input#summary, textarea#summary, input[name="summary"], .summary-field, input[aria-label="Résumé"], input[placeholder*="Type ? for help"]');
  
  // Si on ne trouve pas avec le sélecteur classique, essayer d'autres méthodes
  if (!summaryField) {
      console.log('Recherche alternative du champ summary');
      
      // Recherche par label
      const labels = Array.from(document.querySelectorAll('label, div'));
      const resumeLabel = labels.find(el => el.textContent && el.textContent.includes('Résumé'));
      
      if (resumeLabel) {
          console.log('Label Résumé trouvé:', resumeLabel);
          // Chercher l'input proche du label
          let inputCandidate = null;
          
          // Méthode 1: chercher le prochain élément après le label
          inputCandidate = resumeLabel.nextElementSibling;
          while (inputCandidate && !['INPUT', 'TEXTAREA'].includes(inputCandidate.tagName)) {
              inputCandidate = inputCandidate.querySelector('input, textarea') || inputCandidate.nextElementSibling;
          }
          
          // Méthode 2: chercher par ID référencé
          if (!inputCandidate && resumeLabel.getAttribute('for')) {
              inputCandidate = document.getElementById(resumeLabel.getAttribute('for'));
          }
          
          // Méthode 3: chercher un input visible dans la même zone
          if (!inputCandidate) {
              const rect = resumeLabel.getBoundingClientRect();
              const inputs = document.querySelectorAll('input, textarea');
              for (const input of inputs) {
                  const inputRect = input.getBoundingClientRect();
                  // Si l'input est proche verticalement du label
                  if (Math.abs(inputRect.top - rect.bottom) < 50) {
                      inputCandidate = input;
                      break;
                  }
              }
          }
          
          if (inputCandidate) {
              console.log('Input résumé trouvé par méthode alternative:', inputCandidate);
              summaryField = inputCandidate;
          }
      }
      
      // Si toujours pas trouvé, essayer de trouver visuellement l'input rouge d'erreur
      if (!summaryField) {
          const redBorderedInputs = Array.from(document.querySelectorAll('input, textarea')).filter(el => {
              const style = window.getComputedStyle(el);
              return style.borderColor.includes('red') || 
                     el.parentElement.querySelector('.error-message') ||
                     el.classList.contains('error');
          });
          
          if (redBorderedInputs.length > 0) {
              summaryField = redBorderedInputs[0];
              console.log('Input trouvé par recherche de bordure rouge:', summaryField);
          }
      }
      
      // Dernière tentative: l'input visible dans la capture d'écran
      if (!summaryField) {
          summaryField = document.querySelector('input[placeholder="Type ? for help"]');
          console.log('Dernier recours, input par placeholder:', summaryField);
      }
  }
  
  // Si aucun champ n'est trouvé, abandonner
  if (!summaryField) {
      console.error('Impossible de trouver le champ résumé avec toutes les méthodes');
      return null;
  }
  
  console.log('Champ résumé trouvé avec succès:', summaryField);
  
  // Créer un conteneur pour le tooltip qui sera positionné en fixed
  const tooltipContainer = document.createElement('div');
  tooltipContainer.className = 'jira-tooltip-container';
  tooltipContainer.style.cssText = `
      position: fixed;
      z-index: 99999;
      pointer-events: none; /* Pour permettre l'interaction avec les éléments en-dessous */
  `;
  document.body.appendChild(tooltipContainer);
  
  // Créer l'icône du tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'jira-tooltip-icon';
  tooltip.style.cssText = `
      position: absolute; /* Relatif au conteneur fixed */
      width: 28px;
      height: 28px;
      background-color: #7B61FF;
      border-radius: 50%;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      cursor: pointer;
      font-size: 16px;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      pointer-events: auto; /* Activer les interactions */
      opacity: 1 !important;
      visibility: visible !important;
  `;
  tooltip.textContent = 'i';
  tooltipContainer.appendChild(tooltip);
  
  // Contenu du tooltip
  const tooltipContent = document.createElement('div');
  tooltipContent.className = 'tooltip-content';
  tooltipContent.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      width: 250px;
      z-index: 100000;
      display: none;
      text-align: center;
      font-weight: normal;
      color: #333;
      line-height: 1.4;
      pointer-events: auto;
  `;
  
  // Contenu HTML du tooltip
  tooltipContent.innerHTML = `
      <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 20px; height: 20px; background: white; box-shadow: 3px 3px 5px rgba(0,0,0,0.1);"></div>
      <div style="display: flex; align-items: center; margin-bottom: 10px; justify-content: center;">
          <span style="width: 20px; height: 20px; border-radius: 50%; background-color: #7B61FF; color: white; text-align: center; line-height: 20px; font-size: 12px; margin-right: 8px; display: inline-block;">i</span>
          <span style="font-weight: bold; font-size: 16px; color: #333;">Helpful Tip</span>
      </div>
      <div style="text-align: left; margin-top: 10px;">
     <p> Required format: [IPNext/IPx] [Activity] : Description </p><br>

          <p style="margin: 0;">Options IP: For  ... </p>
          <p style="margin: 0;">Options Activity: For ... </p> <br>
Type <strong>?</strong> to access autocomplete suggestions.

      </div>
  `;
  
  // Ajouter le contenu à l'icône
  tooltip.appendChild(tooltipContent);
  
  // Gérer les événements de survol
  tooltip.addEventListener('mouseenter', () => {
      tooltipContent.style.display = 'block';
  });
  
  tooltip.addEventListener('mouseleave', () => {
      tooltipContent.style.display = 'none';
  });
  
  // Fonction améliorée pour mettre à jour la position
  function updatePosition() {
      if (!summaryField || !document.body.contains(summaryField)) {
          console.log('Le champ summary n\'est plus dans le DOM, recherche à nouveau');
          
          // Rechercher à nouveau le champ
          summaryField = document.querySelector('input#summary, textarea#summary, input[name="summary"], .summary-field, input[aria-label="Résumé"], input[placeholder*="Type ? for help"]');
          
          if (!summaryField) {
              tooltipContainer.style.display = 'none';
              console.log('Impossible de retrouver le champ, tooltip masqué');
              return;
          }
      }
      
      // Vérifier si le champ est visible
      const isVisible = (element) => {
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 element.offsetWidth > 0 && 
                 element.offsetHeight > 0;
      };
      
      if (!isVisible(summaryField) || !isDialogOpen()) {
          tooltipContainer.style.display = 'none';
          console.log('Tooltip caché: champ non visible ou dialogue fermé');
          return;
      }
      
      const fieldRect = summaryField.getBoundingClientRect();
      
      // Vérifier si le rectangle a une taille valide
      if (fieldRect.width === 0 || fieldRect.height === 0) {
          tooltipContainer.style.display = 'none';
          console.log('Tooltip caché: dimensions du champ nulles');
          return;
      }
      
      // Positionner le conteneur du tooltip
      tooltipContainer.style.display = 'block';
      tooltipContainer.style.top = '0';
      tooltipContainer.style.left = '0';
      
      // Positionner l'icône à droite du champ
      tooltip.style.top = (fieldRect.top + (fieldRect.height - 28) / 2) + "px";
      tooltip.style.left = (fieldRect.right + 10) + "px"; // 10px à droite du champ
      
      console.log('Tooltip positionné à:', {
          top: tooltip.style.top,
          left: tooltip.style.left,
          fieldRect: fieldRect
      });
  }
  
  // Fonction pour vérifier si la boîte de dialogue est ouverte
  function isDialogOpen() {
      // En supposant que la page de création de ticket est toujours ouverte
      return true;
      
      // Si besoin de vérifier plus précisément:
      /*
      const dialogSelectors = [
          'div[role="dialog"]',
          '.modal-dialog',
          '.jira-dialog',
          '.aui-dialog2',
          '#create-issue-dialog',
          '#edit-issue-dialog',
          '.issue-create-dialog',
          '.issue-edit-dialog'
      ];
      
      for (const selector of dialogSelectors) {
          const dialog = document.querySelector(selector);
          if (dialog && dialog.offsetParent !== null) {
              return true;
          }
      }
      
      return false;
      */
  }
  
  // Stocker la référence pour pouvoir la supprimer plus tard
  tooltipContainer._updatePosition = updatePosition;
  
  // Optimiser les écouteurs d'événements
  window.addEventListener('scroll', updatePosition, { passive: true });
  window.addEventListener('resize', updatePosition, { passive: true });
  document.addEventListener('scroll', updatePosition, { passive: true, capture: true });
  
  // Gérer le scroll dans les éléments parents
  let parent = summaryField.parentElement;
  while (parent) {
      parent.addEventListener('scroll', updatePosition, { passive: true });
      parent = parent.parentElement;
  }
  
  // Gestion des inputs et focus pour mettre à jour la position
  summaryField.addEventListener('input', updatePosition, { passive: true });
  summaryField.addEventListener('focus', updatePosition, { passive: true });
  
  // Observer les changements dans le DOM
  const observer = new MutationObserver((mutations) => {
      updatePosition();
  });
  
  // Observer le document entier pour les changements de visibilité
  observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'aria-hidden']
  });
  
  // Exécuter immédiatement pour positionner correctement
  updatePosition();
  
  // Configurer un intervalle pour vérifier régulièrement la position
  const positionInterval = setInterval(updatePosition, 100);
  tooltipContainer._positionInterval = positionInterval;
  
  // Ajouter un clic sur le document pour vérifier si le tooltip est correctement affiché
  document.addEventListener('click', () => {
      // Forcer une mise à jour après un court délai
      setTimeout(updatePosition, 50);
  }, { passive: true });
  
  return tooltipContainer;
}
// Intégrer toutes les fonctionnalités au démarrage avec une seule fonction initializer
function initializeAllFeatures() {
  console.log("Initializing all features...");
  
  // Créer la bulle d'erreur et s'assurer qu'elle est visible
  errorBubble = errorBubble || createErrorBubble();
  errorBubble.style.visibility = "visible"; // Forcer la visibilité
  
  // Rechercher le champ summary
  const summaryField = document.querySelector('input#summary, textarea#summary, input[name="summary"], .summary-field');
  
  if (summaryField) {
      // Positionner la bulle près du champ dès l'initialisation
      positionBubbleNearInput(summaryField);
      
      // Initialiser l'autocomplétion
      initSummaryAutocomplete();
      
      // Vérifier le contenu initial
      if (summaryField.value.trim() !== '') {
          checkInput(summaryField);
      }
  }
  
  // Ajouter le tooltip
  addAdaptiveTooltip();
  
  // Créer la bulle de chat
  if (!chatBubble) {
      chatBubble = createBubbleChat();
  }
  
  // Mettre à jour l'état initial
  updateErrorBubble(errorCount);
  
  // Installer un seul MutationObserver optimisé au lieu de plusieurs
  if (!domObserver) {
      domObserver = new MutationObserver((mutations) => {
          let needsUpdate = false;
          let needsSummaryInit = false;
          let needsTooltip = false;
          
          mutations.forEach(mutation => {
              // Vérifier les ajouts de noeuds
              if (mutation.addedNodes.length > 0) {
                  for (let i = 0; i < mutation.addedNodes.length; i++) {
                      const node = mutation.addedNodes[i];
                      if (node.nodeType !== Node.ELEMENT_NODE) continue;
                      
                      // Vérifier si c'est le bouton de création
                      if (node.matches('button[data-testid="issue-create.common.ui.footer.create-button"]') ||
                          node.querySelector('button[data-testid="issue-create.common.ui.footer.create-button"]')) {
                          needsUpdate = true;
                      }
                      
                      // Vérifier si c'est un champ summary
                      if (node.matches('input#summary, textarea#summary, input[name="summary"], .summary-field') ||
                          node.querySelector('input#summary, textarea#summary, input[name="summary"], .summary-field')) {
                          needsSummaryInit = true;
                          needsTooltip = true;
                      }
                  }
              }
              
              // Vérifier les modifications de styles ou classes pour le champ summary
              if (mutation.type === 'attributes' && 
                  (mutation.attributeName === 'style' || mutation.attributeName === 'class') &&
                  (mutation.target.matches('input#summary, textarea#summary') || 
                   mutation.target.closest('input#summary, textarea#summary'))) {
                  needsTooltip = true;
              }
              
              // Vérifier les modifications des dialogues
              if ((mutation.type === 'attributes' && 
                   (mutation.attributeName === 'style' || mutation.attributeName === 'class' || mutation.attributeName === 'aria-hidden')) ||
                  mutation.type === 'childList') {
                  
                  const isDialogRelated = 
                      mutation.target.matches('div[role="dialog"], .modal-dialog, .jira-dialog, .aui-dialog2') || 
                      mutation.target.closest('div[role="dialog"], .modal-dialog, .jira-dialog, .aui-dialog2');
                  
                  if (isDialogRelated) {
                      // Vérifier si la boîte de dialogue est en train d'être fermée
                      const tooltip = document.querySelector('.jira-tooltip-icon');
                      if (tooltip && tooltip._updatePosition) {
                          tooltip._updatePosition();
                      }
                  }
              }
          });
          
          // Appliquer les mises à jour nécessaires
          if (needsUpdate) {
              updateCreateButton();
          }
          
          if (needsSummaryInit) {
              initSummaryAutocomplete();
          }
          
          if (needsTooltip) {
              addAdaptiveTooltip();
          }
      });
      
      // Observer l'ensemble du document avec des options optimisées
      domObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class', 'aria-hidden'],
          characterData: false // Ne pas surveiller les changements de texte
      });
  }
  
  // Écouter les clics sur le document pour détecter les fermetures potentielles
  document.addEventListener('click', (e) => {
      // Vérifier si c'est un clic en dehors de la boîte de dialogue ou sur un bouton de fermeture
      if (e.target.matches('.cancel, .close, button[data-testid*="cancel"], button[data-testid*="close"]') ||
          e.target.closest('.cancel, .close, button[data-testid*="cancel"], button[data-testid*="close"]')) {
          // Mettre à jour le tooltip après un court délai
          setTimeout(() => {
              const tooltip = document.querySelector('.jira-tooltip-icon');
              if (tooltip && tooltip._updatePosition) {
                  tooltip._updatePosition();
              }
          }, 100);
      }
  }, { passive: true });
  
  // Installer les écouteurs d'événements globaux optimisés
  document.addEventListener("input", (e) => {
    const input = e.target;
    
    // Ignorer les champs de l'extension
    if (isExtensionField(input)) {
        return;
    }

    // Vérifier si c'est le champ summary
    const isSummary = input.id === "summary" || 
                      input.name === "summary" || 
                      input.classList.contains("summary-field");
    
    // Pour les champs de saisie standard et le champ summary
    if (input.matches("textarea, input[type='text']") || isSummary) {
        // On ne vérifie pas immédiatement à chaque saisie pour ne pas perturber l'utilisateur
        // On conserve le délai de 500ms pour l'événement input
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => checkInput(input), 500);
    }
});

// Ajouter un observateur du DOM pour attacher les gestionnaires aux nouveaux champs summary
function setupSummaryFieldObserver() {
    // Observer les changements dans le DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Vérifier si un champ summary a été ajouté
                        const summaryField = node.querySelector('#summary, [name="summary"], .summary-field');
                        if (summaryField) {
                            // Ajouter les événements au nouveau champ
                            attachMouseLeaveHandler(summaryField);
                            initSummaryAutocomplete();
                            break;
                        }
                    }
                }
            }
        });
    });
    
    // Observer tout le document pour détecter les nouveaux champs summary
    observer.observe(document.body, { childList: true, subtree: true });
}

// Exécuter une fois pour configurer l'observateur
setupSummaryFieldObserver();}
// Valider les champs spécifiques - optimisé
function checkVersion(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.version) {
        errorCount += 1;
        errorFlags.version = true;
    } else if (selectedValue !== "none" && errorFlags.version) {
        errorCount -= 1;
        errorFlags.version = false;
    }

    updateErrorBubble(errorCount);
}

function checkPriority(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.priority) {
        errorCount += 1;
        errorFlags.priority = true;
    } else if (selectedValue !== "none" && errorFlags.priority) {
        errorCount -= 1;
        errorFlags.priority = false;
    }

    updateErrorBubble(errorCount);
}

function checkComponents(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.components) {
        errorCount += 1;
        errorFlags.components = true;
    } else if (selectedValue !== "none" && errorFlags.components) {
        errorCount -= 1;
        errorFlags.components = false;
    }

    updateErrorBubble(errorCount);
}

// Écouteur d'extension optimisé
function setupExtensionListener() {
    // Éviter de configurer plusieurs fois
    if (window._extensionListenerInitialized) {
        return;
    }
    
    window._extensionListenerInitialized = true;
    
    // S'assurer que chrome.runtime est disponible
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            if (message.action === "toggleChatBubble") {
                const bubble = chatBubble || createBubbleChat();
                const chatContainer = document.getElementById("chatBotContainer");
                
                // Afficher la bulle si elle était cachée
                if (bubble.style.display === "none") {
                    bubble.style.display = "flex";
                    localStorage.removeItem("chatBubbleHidden");
                    
                    // Effet d'apparition
                    bubble.style.transform = "scale(0)";
                    setTimeout(() => {
                        bubble.style.transform = "scale(1)";
                    }, 100);
                }
                
                // Ouvrir automatiquement la fenêtre de chat
                if (chatContainer) {
                    chatContainer.style.display = "block";
                    bubble.style.transform = "scale(1.05)";
                }
                
                sendResponse({success: true});
                return true;
            }
        });
    }
}

// Fonction pour afficher la bulle de chat (à appeler depuis popup.js) - optimisée
function afficherBulle() {
    const bubble = chatBubble || createBubbleChat();
    const chatContainer = document.getElementById("chatBotContainer");
    
    if (!bubble || !chatContainer) return false;
    
    // Assurer que la bulle est visible
    bubble.style.display = "flex";
    bubble.style.visibility = "visible";
    localStorage.removeItem("chatBubbleHidden");
    
    // Effet d'apparition
    bubble.style.transform = "scale(0)";
    setTimeout(() => {
        bubble.style.transform = "scale(1)";
    }, 100);
    
    // Ouvrir automatiquement la fenêtre de chat
    chatContainer.style.display = "block";
    bubble.style.transform = "scale(1.05)";
    
    return true;
}

// Fonction de diagnostic pour la bulle d'erreur
window.debugErrorBubble = function() {
    const bubble = document.getElementById("errorBubble");
    
    if (!bubble) {
        console.error("Error bubble not found!");
        // Créer la bulle si elle n'existe pas
        createErrorBubble();
        return "Error bubble created now";
    }
    
    console.log("Error bubble state:", {
        id: bubble.id,
        visibility: bubble.style.visibility,
        display: bubble.style.display,
        zIndex: bubble.style.zIndex,
        position: {
            top: bubble.style.top,
            left: bubble.style.left
        }
    });
    
    // Forcer la visibilité
    bubble.style.visibility = "visible";
    bubble.style.display = "flex";
    
    // Repositionner près du champ summary
    const summaryField = document.querySelector('input#summary, textarea#summary');
    if (summaryField) {
        positionBubbleNearInput(summaryField);
        return "Error bubble repositioned";
    }
    
    return "Error bubble forced visible";
};

// Fonction pour forcer l'initialisation de tout
window.forceInitialization = function() {
    // Réinitialiser l'état
    window._featureInitialized = false;
    
    // Supprimer les éléments existants pour une réinitialisation propre
    const elements = ['errorBubble', 'chatBubble', 'chatBotContainer', 'errorAlertsContainer', 'optionsMenu'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.remove();
    });
    
    // Réinitialiser les variables globales
    errorBubble = null;
    chatBubble = null;
    errorCount = 0;
    optionsMenu = null;
    
    // Réinitialiser les écouteurs
    if (domObserver) {
        domObserver.disconnect();
        domObserver = null;
    }
    
    // Initialiser à nouveau
    initAndOptimize();
    
    return "Forced reinitialization complete";
};

// Point d'entrée principal - initialisation optimisée
function initAndOptimize() {
    // N'initialiser qu'une seule fois
    if (window._featureInitialized) {
        return;
    }
    
    window._featureInitialized = true;
    
    // Initialiser toutes les fonctionnalités
    initializeAllFeatures();
    
    // Exposer les fonctions essentielles à l'API window
    window.afficherBulle = afficherBulle;
    window.resetSummaryAuto = initSummaryAutocomplete;
    window.resetJiraTooltips = addAdaptiveTooltip;
    
    // Exposer une fonctionnalité de debug/diagnostic
    window.diagnoseBulles = function() {
        return {
            errorBubble: errorBubble ? {
                id: errorBubble.id,
                visible: errorBubble.style.visibility,
                display: errorBubble.style.display,
                zIndex: errorBubble.style.zIndex
            } : null,
            chatBubble: chatBubble ? {
                id: chatBubble.id,
                visible: chatBubble.style.visibility,
                display: chatBubble.style.display,
                zIndex: chatBubble.style.zIndex
            } : null,
            errorCount: errorCount,
            featureInitialized: window._featureInitialized
        };
    };
    
    console.log("✅ Optimized content.js loaded!");
}

// Exécuter l'initialisation
// 1. Au chargement du DOM
document.addEventListener("DOMContentLoaded", initAndOptimize);

// 2. Si le document est déjà chargé
if (document.readyState === "complete" || document.readyState === "interactive") {
    initAndOptimize();
}

// 3. Au chargement complet de la page
window.addEventListener("load", () => {
    // Vérifier si l'initialisation a déjà été effectuée
    if (!window._featureInitialized) {
        initAndOptimize();
    }
    
    // Vérifier spécifiquement l'état de la bulle d'erreur après un court délai
    setTimeout(() => {
        if (errorBubble && errorBubble.style.visibility !== "visible") {
            errorBubble.style.visibility = "visible";
            console.log("Error bubble visibility fixed");
        }
    }, 500);
});

// Communication avec l'extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleChatBubble") {
        const bubble = chatBubble || createBubbleChat();
        sendResponse({ success: true, bubbleId: bubble.id });
        return true;
    }
    
    // Gestion spécifique pour les messages liés à la bulle d'erreur
    if (message.action === "checkErrorBubble") {
        const bubble = errorBubble || createErrorBubble();
        bubble.style.visibility = "visible";
        positionBubbleNearInput(document.querySelector('input#summary, textarea#summary'));
        sendResponse({ success: true, bubbleId: bubble.id });
        return true;
    }
});

// Dernier recours - initialiser après un court délai
setTimeout(initAndOptimize, 100);

// Vérification supplémentaire pour s'assurer que la bulle d'erreur est visible
setTimeout(() => {
    if (errorBubble && errorBubble.style.visibility !== "visible") {
        errorBubble.style.visibility = "visible";
        const summaryField = document.querySelector('input#summary, textarea#summary, input[name="summary"], .summary-field');
        if (summaryField) {
            positionBubbleNearInput(summaryField);
        }
    }
}, 1000);