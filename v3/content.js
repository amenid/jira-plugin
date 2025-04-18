// Existing constants and global variables
const validActivities = ["Nightly", "Coverage", "Periodic_2h", "Weekly", "FV", "PreInt", "PreGate"];

// Global variables
let errorBubble;
let chatBubble;
let errorCount = 0;
let timeoutId;



function createErrorBubble() {
    if (document.getElementById("errorBubble")) {
        return document.getElementById("errorBubble");
    }
    
    let errorBubble = document.createElement("div");
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
        visibility: "hidden"
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
    icon.src = chrome.runtime.getURL("icon.png");
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
    text.textContent = "0"; // Start with 0
    Object.assign(text.style, {
        display: "none",
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

    // Effet de survol pour afficher l'icône de décollage
    errorBubble.addEventListener("mouseenter", () => {
        icon.style.opacity = "0"; // Masquer l'icône normale
    });

    errorBubble.addEventListener("mouseleave", () => {
        icon.style.opacity = "1"; // Afficher l'icône normale
    });

    // Bouton "X" pour fermer la bulle
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

    function positionBubbleNearInput(inputElement) {
        const rect = inputElement.getBoundingClientRect();
        const errorBubble = document.getElementById("errorBubble");
        
        // Positionner la bulle à l'intérieur du champ, près du bord droit
        errorBubble.style.position = "absolute";
        errorBubble.style.top = (rect.top + window.scrollY + (rect.height - errorBubble.offsetHeight) / 2) + "px";
        
        // Positionnement à droite avec un petit décalage par rapport au bord
        const padding = 5; // 5px de décalage par rapport au bord droit
        errorBubble.style.left = (rect.right + window.scrollX - errorBubble.offsetWidth - padding) + "px";
        
        // Adapter la taille en fonction de la hauteur du champ
        const bubbleSize = Math.min(rect.height * 0.8, 28); // 80% de la hauteur du champ, max 28px
        errorBubble.style.width = bubbleSize + "px";
        errorBubble.style.height = bubbleSize + "px";
        
        // S'assurer que la bulle est devant le contenu du champ
        errorBubble.style.zIndex = "1001";
        
        // Rendre visible
        errorBubble.style.visibility = "visible";
        
        // Mise à jour de la position lors du défilement
        const updatePosition = () => {
            const updatedRect = inputElement.getBoundingClientRect();
            errorBubble.style.top = (updatedRect.top + window.scrollY + (updatedRect.height - errorBubble.offsetHeight) / 2) + "px";
            errorBubble.style.left = (updatedRect.right + window.scrollX - errorBubble.offsetWidth - padding) + "px";
        };
        
        // Supprimer les écouteurs existants avant d'en ajouter de nouveaux
        window.removeEventListener('scroll', window._currentScrollHandler);
        window._currentScrollHandler = updatePosition;
        window.addEventListener('scroll', window._currentScrollHandler);
        
        // Mise à jour lors du redimensionnement de la fenêtre
        window.removeEventListener('resize', window._currentResizeHandler);
        window._currentResizeHandler = updatePosition;
        window.addEventListener('resize', window._currentResizeHandler);
    }
    function attachInputListeners() {
        // For input fields, textareas, and contenteditable elements
        const inputSelectors = 'input[type="text"], input[type="email"], input[type="password"], input[type="search"], textarea, [contenteditable="true"]';
        const inputs = document.querySelectorAll(inputSelectors);
        
        inputs.forEach(input => {
            // Show bubble on focus
            input.addEventListener('focus', () => {
                positionBubbleNearInput(input);
            });
            
            // Update position during typing
            input.addEventListener('input', () => {
                if ((input.value && input.value.trim() !== '') || 
                    (input.isContentEditable && input.textContent.trim() !== '')) {
                    positionBubbleNearInput(input);
                }
            });
            
            // For contenteditable elements
            if (input.isContentEditable) {
                input.addEventListener('keyup', () => {
                    positionBubbleNearInput(input);
                });
            }
        });
        
        // Hide bubble when clicking elsewhere
        document.addEventListener('click', (e) => {
            const isInput = e.target.matches(inputSelectors);
            const isOnBubble = errorBubble.contains(e.target);
            
            if (!isInput && !isOnBubble) {
                errorBubble.style.visibility = "hidden";
                
                // Remove scroll and resize event listeners when hiding the bubble
                window.removeEventListener('scroll', window._currentScrollHandler);
                window.removeEventListener('resize', window._currentResizeHandler);
            }
        });
    }

    // Modifier le comportement de la bulle au clic (puisqu'il n'y a plus de chatbot)
    errorBubble.addEventListener("click", () => {
        // Vous pouvez ajouter ici une autre action si nécessaire
        console.log("Bulle cliquée");
    
    });

    // Détecter également la sélection de texte
    document.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        if (selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Positionner la bulle près de la sélection
            errorBubble.style.top = (rect.bottom + window.scrollY + 5) + "px";
            errorBubble.style.left = (rect.right + window.scrollX - errorBubble.offsetWidth/2) + "px";
            errorBubble.style.visibility = "visible";
        }
    });

    // Surveiller les modifications du DOM pour détecter de nouveaux champs
    const observer = new MutationObserver(() => {
        attachInputListeners();
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });

    // Attacher les écouteurs aux champs existants
    attachInputListeners();

    return errorBubble;
}


function updateErrorBubble(errorCount) {
    const bubble = document.getElementById("errorBubble") || createErrorBubble();
    const icon = document.getElementById("bubbleIcon");
    const text = document.getElementById("errorCount");

    if (errorCount > 0) {
        // Si des erreurs sont détectées
        Object.assign(bubble.style, {
            backgroundColor: "#ff4444",
            borderColor: "#ff0000",
            boxShadow: "0 2px 10px rgba(255,0,0,0.3)",
            background: "radial-gradient(circle at 30% 30%, rgba(255,100,100,0.9), rgba(255,50,50,1))"
        });
        
        // Cacher l'icône
        if (icon) {
            icon.style.display = "none";
        }
        
        // Afficher le texte avec le nombre d'erreurs
        if (text) {
            text.style.display = "flex";
            text.textContent = errorCount.toString();
        }
        
        // Animation pulsante subtile
        bubble.style.animation = "pulse 1.5s infinite";
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
    } else {
        // Si aucune erreur n'est détectée
        Object.assign(bubble.style, {
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "transparent",
            boxShadow: "0 2px 15px rgba(0,0,0,0.2)",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(240,240,240,0.9))",
            animation: "none"
        });
        
        // Afficher l'icône
        if (icon) {
            icon.style.display = "block";
        }
        
        // Cacher le texte du nombre d'erreurs
        if (text) {
            text.style.display = "none";
        }
    }
    chrome.runtime.sendMessage({ type: "updateErrors", count: errorCount });
}

function createErrorContainer() {
    // Vérifier si le conteneur existe déjà
    if (document.getElementById("errorAlertsContainer")) {
        return document.getElementById("errorAlertsContainer");
    }
    
    const alertsContainer = document.createElement("div");
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
    closeBtn.addEventListener("click", () => {
        alert.style.animation = "slideOut 0.3s ease-in forwards";
        setTimeout(() => {
            alert.remove();
            // Si c'était la dernière alerte, nettoyer le conteneur
            if (alertsContainer.children.length === 0) {
                alertsContainer.remove();
            }
        }, 290);
    });
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
    setTimeout(() => {
        if (alert.parentNode) {
            alert.style.animation = "slideOut 0.3s ease-in forwards";
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                    // Si c'était la dernière alerte, nettoyer le conteneur
                    if (alertsContainer.children.length === 0) {
                        alertsContainer.remove();
                    }
                }
            }, 290);
        }
    }, 5000);
}

let activeAlerts = new Set();

// Fonction qui vérifie les doublons avant d'afficher l'erreur
function showUniqueError(input, message) {
    // Si ce message est déjà affiché, ne pas le dupliquer
    if (activeAlerts.has(message)) {
        return;
    }
    
    activeAlerts.add(message);
    showError(input, message);
    
    // Supprimer du tracker après le délai d'affichage
    setTimeout(() => {
        activeAlerts.delete(message);
    }, 5000);
}

function checkInput(input) {
    // Ignorer les champs appartenant à l'extension
    if (isExtensionField(input)) {
        return;
    }
    
    const text = input.value.trim();

    if (text === "") {
        // Si le champ est vide, revenir à l'état initial (icône par défaut)
        updateErrorBubble(0);
    } else {
        const hasErrors = checkText(input); 
        // Use the global errorCount instead of the boolean return value
        updateErrorBubble(errorCount); 
    }
}

// Fonction pour déterminer si un champ appartient à l'extension
function isExtensionField(element) {
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
// Écouter les changements dans les champs de texte avec une attention particulière pour le champ summary
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
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => checkInput(input), 500); 
    }
});
function validateSegment(segment) {
    const errors = [];

    // Check [$id]
    const idRegex = /^\[SWP-\d+\]/;
    if (!idRegex.test(segment)) {
        errors.push("Invalid 'id' format. Expected format: [SWP-'X']");
    }

    // Check [IPNext]
    if (!segment.includes("[IPNext]")) {
        errors.push("Missing 'IPNext' field");
    }

    // Check [$activity]
    const activityRegex = /\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]/;
    if (!activityRegex.test(segment)) {
        errors.push("Invalid 'activity'. Allowed values: Nightly, Coverage, Periodic_2h, Weekly, FV, PreInt, PreGate");
    }

    // Check ": $text"
    if (!segment.includes(":")) {
        errors.push("Missing ': text' format");
    }

    return errors;
}

function checkText(input) {
    const text = input.value.trim();
    const lines = text.split('\n'); 
    let newErrorCount = 0;

    lines.forEach((line, lineIndex) => {
        if (line.trim() === '') return; // Skip empty lines
        
        const errors = validateSegment(line);

        if (errors.length > 0) {
            newErrorCount += errors.length;
            errors.forEach((error, errorIndex) => {
                showUniqueError(input, ` ${error}`);
            });
        }
    });

    // Update the global error count and bubble
    if (newErrorCount !== errorCount) {
        errorCount = newErrorCount;
        updateErrorBubble(errorCount);
        chrome.runtime.sendMessage({ type: "updateErrors", count: errorCount });
        console.log("Current error count:", errorCount);
    }

    return errorCount > 0; // Return boolean indicating if there are errors
}

// Écouter les changements dans les champs de texte
document.addEventListener("input", (e) => {
    const input = e.target;

    // Cibler les champs de saisie spécifiques
    if (input.matches("textarea, input[type='text']")) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => checkInput(input), 500); 
    }
});


// Contrôle de la priorité et autres validators
const errorFlags = {
    priority: false,
    components: false,
    version: false
};

// Contrôle de la priorité
function checkPriority(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.priority) {
        errorCount += 1;
        errorFlags.priority = true;
        alert("Erreur : 'none' ne doit pas être sélectionné pour la priorité !");
    } else if (selectedValue !== "none" && errorFlags.priority) {
        errorCount -= 1;
        errorFlags.priority = false;
    }

    updateErrorBubble(errorCount);
}

// Contrôle des composants
function checkComponents(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.components) {
        errorCount += 1;
        errorFlags.components = true;
        alert("Erreur : 'none' ne doit pas être sélectionné pour les composants !");
    } else if (selectedValue !== "none" && errorFlags.components) {
        errorCount -= 1;
        errorFlags.components = false;
    }

    updateErrorBubble(errorCount);
}

// Contrôle de la version
function checkVersion(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.version) {
        errorCount += 1;
        errorFlags.version = true;
        alert("Erreur : 'none' ne doit pas être sélectionné pour la version !");
    } else if (selectedValue !== "none" && errorFlags.version) {
        errorCount -= 1;
        errorFlags.version = false;
    }

    updateErrorBubble(errorCount);
}

// Assigner "Unassigned" à l'assignee
function enforceUnassigned() {
    const assignee = document.getElementById("assignee-field");
    if (assignee && assignee.textContent !== "Unassigned") {
        assignee.textContent = "Unassigned";
    }
}

// Observer pour l'assignee
const assigneeObserver = new MutationObserver(enforceUnassigned);
const assigneeElement = document.getElementById("assignee-field");
if (assigneeElement) {
    assigneeObserver.observe(assigneeElement, { childList: true, subtree: true });
}

// État de validation supplémentaire
const errorState = {
    categorization: false,
    variant2: false,
    errorOccurrence: false,
    otherText: false
};

// Fonction pour la catégorisation
function categorization() {
    const selectElement = document.getElementById("labels-field");
    if (selectElement && selectElement.value === "D0_sample") {
        if (!errorState.categorization) {
            errorCount += 1;
            errorState.categorization = true;
        }
    } else {
        if (errorState.categorization) {
            errorCount -= 1;
            errorState.categorization = false;
        }
    }
    updateErrorBubble(errorCount);
}

// Fonction pour afficher toujours "ipn_10"
function variant() {
    const variantElement = document.getElementById("variant");
    if (variantElement) {
        variantElement.textContent = "ipn_10";
    }
}

// Fonction pour sélectionner une ou deux options : "IPN_10 PERF" et/ou "IPN_10 Main"
function variant2() {
    const variant2Element = document.getElementById("variant2");
    if (variant2Element) {
        const options = Array.from(variant2Element.options);
        const selectedValues = options
            .filter(option => option.selected)
            .map(option => option.value);

        // Vérifie si au moins une des options est sélectionnée
        const isValid = selectedValues.some(value => value === "IPN_10 PERF" || value === "IPN_10 Main");

        if (!isValid && !errorState.variant2) {
            errorCount += 1;
            errorState.variant2 = true;
        } else if (isValid && errorState.variant2) {
            errorCount -= 1;
            errorState.variant2 = false;
        }
    }
    updateErrorBubble(errorCount);
}

// Fonction pour vérifier que "ErrorOccurrence" n'est pas "none"
function errorOccurrence() {
    const errorOccurrenceElement = document.getElementById("errorOccurrence");
    if (errorOccurrenceElement && errorOccurrenceElement.value === "none") {
        if (!errorState.errorOccurrence) {
            errorCount += 1;
            errorState.errorOccurrence = true;
        }
    } else {
        if (errorState.errorOccurrence) {
            errorCount -= 1;
            errorState.errorOccurrence = false;
        }
    }
    updateErrorBubble(errorCount);
}

// Fonction pour vérifier une exigence de texte
function otherText(inputElement, prefix) {
    if (inputElement) {
        const text = inputElement.value.trim();
        if (!text.startsWith(prefix)) {
            if (!errorState.otherText) {
                errorCount += 1;
                errorState.otherText = true;
            }
        } else {
            if (errorState.otherText) {
                errorCount -= 1;
                errorState.otherText = false;
            }
        }
    }
    updateErrorBubble(errorCount);
}

// Fonction pour initialiser les écouteurs d'événements
function initializeEventListeners() {
    const labelsElement = document.getElementById("labels-field");
    const variant2Element = document.getElementById("variant2");
    const errorOccurrenceElement = document.getElementById("errorOccurrence");
    const exampleTextElement = document.getElementById("exampleText"); // Exemple de champ texte

    if (labelsElement) {
        labelsElement.addEventListener("change", categorization);
    }

    if (variant2Element) {
        variant2Element.addEventListener("change", variant2);
    }

    if (errorOccurrenceElement) {
        errorOccurrenceElement.addEventListener("change", errorOccurrence);
    }

    if (exampleTextElement) {
        exampleTextElement.addEventListener("input", () => {
            otherText(exampleTextElement, "[TestSuitaName]:"); 
        });
    }
}

function createBubbleChat() {
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

// Écouter les messages de l'extension
function setupExtensionListener() {
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

// Exposer la fonction globalement pour pouvoir l'appeler depuis l'extérieur
window.createBubbleChat = createBubbleChat;

// Initialiser les fonctionnalités de chat
document.addEventListener("DOMContentLoaded", () => {
    setupExtensionListener();
});

// Si le document est déjà chargé
if (document.readyState === "complete" || document.readyState === "interactive") {
    setupExtensionListener();
}

// Fonction d'initialisation pour appeler createBubbleChat et setupExtensionListener
function initializeChatFeatures() {
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



// Fonction pour afficher la bulle de chat (à appeler depuis popup.js)
function afficherBulle() {
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
 
window.afficherBulle = afficherBulle;

document.addEventListener("DOMContentLoaded", initializeChatFeatures);
window.addEventListener("load", initializeChatFeatures);

if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(initializeChatFeatures, 100);
}
window.afficherBulle = afficherBulle;

document.addEventListener("DOMContentLoaded", initializeChatFeatures);
window.addEventListener("load", initializeChatFeatures);

if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(initializeChatFeatures, 100);
}

document.addEventListener("DOMContentLoaded", initializeChatFeatures);
window.addEventListener("load", initializeChatFeatures);

if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(initializeChatFeatures, 100);
}
document.addEventListener("DOMContentLoaded", function() {
    createBubbleChat();
    setupExtensionListener();
});
document.addEventListener("DOMContentLoaded", () => {
   try { 

    createErrorBubble();
    updateErrorBubble(0);
    
    // Set up validators
    const prioritySelect = document.getElementById("priority-val");
    const componentsSelect = document.getElementById("components-field");
    const versionSelect = document.getElementById("versions-field");

    if (prioritySelect) {
        prioritySelect.addEventListener("change", checkPriority);
    }
    if (componentsSelect) {
        componentsSelect.addEventListener("change", checkComponents);
    }
    if (versionSelect) {
        versionSelect.addEventListener("change", checkVersion);
    }

    // Vérifier les valeurs initiales au chargement
    if (prioritySelect && prioritySelect.value === "none") {
        errorCount += 1;
        errorFlags.priority = true;
    }
    if (componentsSelect && componentsSelect.value === "none") {
        errorCount += 1;
        errorFlags.components = true;
    }
    if (versionSelect && versionSelect.value === "none") {
        errorCount += 1;
        errorFlags.version = true;
    }
    
    updateErrorBubble(errorCount);
    preventTicketSubmission();
    
    // Initialize additional validators
    variant();
    initializeEventListeners();
    categorization();
    variant2();
    errorOccurrence();
    otherText(document.getElementById("exampleText"), "[TestSuitaName]:");
    

} catch (error) {
    console.error("Error during initialization:", error);
  }

});
// Add this just before the end of your script to ensure it's called
window.addEventListener('load', () => {
    try {
      const chatBubble = createBubbleChat();
      console.log("Chat bubble visibility:", chatBubble.style.visibility);
console.log("Chat bubble display:", chatBubble.style.display);
console.log("Chat bubble z-index:", chatBubble.style.zIndex);
    } catch (error) {
      console.error("Failed to create chat bubble:", error);
    }
  });
console.log("✅ content.js chargé!");
console.log("Script execution completed, bubble should be visible");
