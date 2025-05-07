// Combined content.js - Generated on 5/7/2025, 9:19:45 PM

// =============================================
// constants.js
// =============================================

// Global constants
const validActivities = ["Nightly", "Coverage", "Periodic_2h", "Weekly", "FV", "PreInt", "PreGate"];

// Global error state
const errorFlags = {
    priority: false,
    components: false,
    version: false
};

const errorState = {
    categorization: false,
    variant2: false,
    errorOccurrence: false,
    otherText: false
};

// Active alerts tracking
const activeAlerts = new Set();

// =============================================
// domHelpers.js
// =============================================

/**
 * Determines if an element belongs to the extension
 * @param {HTMLElement} element - DOM element to check
 * @returns {boolean} True if the element is part of the extension
 */
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

/**
 * Sets up MutationObserver to watch for DOM changes and initialize components when needed
 * @param {Function} callback - Function to call when relevant DOM nodes are added
 * @param {string} selector - CSS selector to look for
 */
function setupDOMObserver(callback, selector) {
    const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if target element exists in added node
                        const targetElement = node.querySelector(selector) || 
                                            (node.matches(selector) ? node : null);
                        if (targetElement) {
                            callback();
                            break;
                        }
                    }
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
}

/**
 * Sets up an observer for a specific element
 * @param {string} elementId - ID of the element to observe
 * @param {Function} callback - Function to call when element changes
 * @returns {MutationObserver|null} The observer or null if element not found
 */
function observeElement(elementId, callback) {
    const element = document.getElementById(elementId);
    if (!element) return null;
    
    const observer = new MutationObserver(callback);
    observer.observe(element, { childList: true, subtree: true });
    return observer;
}

// =============================================
// errorBubble.js
// =============================================

// Error bubble functionality
let errorBubble;
let errorCount = 0;
let timeoutId;

/**
 * Creates error bubble UI element for showing validation errors
 * @returns {HTMLElement} The error bubble element
 */
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

/**
 * Updates the error bubble UI based on error count
 * @param {number} count - Number of errors to display
 */
function updateErrorBubble(count) {
    errorCount = count;
    const bubble = document.getElementById("errorBubble") || createErrorBubble();
    const icon = document.getElementById("bubbleIcon");
    const text = document.getElementById("errorCount");

    if (count > 0) {
        // If errors are detected
        Object.assign(bubble.style, {
            backgroundColor: "#ff4444",
            borderColor: "#ff0000",
            boxShadow: "0 2px 15px rgba(255,0,0,0.3), 0 0 5px rgba(255,150,150,0.8) inset",
            background: "radial-gradient(circle at 30% 30%, rgba(255,100,100,0.9), rgba(255,50,50,1))"
        });
        
        // Hide the icon
        if (icon) {
            icon.style.display = "none";
        }
        
        // Show the text with the error count and ensure it's centered
        if (text) {
            text.style.display = "flex";
            text.textContent = count.toString();
            
            // Ajustement supplémentaire pour les grands nombres
            if (count > 9) {
                text.style.fontSize = "14px";
            } else {
                text.style.fontSize = "16px";
            }
        }
        
        // Add a pulsing animation
        bubble.style.animation = "pulse 2s infinite";
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
        // If no errors are detected
        Object.assign(bubble.style, {
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "transparent",
            boxShadow: "0 2px 15px rgba(0,0,0,0.2), 0 0 5px rgba(255,255,255,0.8) inset",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(240,240,240,0.9))",
            animation: "none"
        });
        
        // Show the icon
        if (icon) {
            icon.style.display = "block";
        }
        
        // Hide the error count text
        if (text) {
            text.style.display = "none";
        }
    }
    
    // Update the submit button state
    updateCreateButton();
}

/**
 * Updates the create button state based on error count
 */
function updateCreateButton() {
    const createButton = document.querySelector('button[data-testid="issue-create.common.ui.footer.create-button"]');
    
    if (createButton) {
        if (errorCount > 0) {
            createButton.disabled = true;
            createButton.style.opacity = "0.5";
            createButton.style.cursor = "not-allowed";
            
            // Add a title attribute to explain why it's disabled
            createButton.setAttribute("title", "Please fix all errors before submitting");
        } else {
            createButton.disabled = false;
            createButton.style.opacity = "1";
            createButton.style.cursor = "pointer";
            createButton.removeAttribute("title");
        }
    }
}

/**
 * Sets up a MutationObserver to watch for the button
 */
function preventTicketSubmission() {
    // First check if the button already exists
    updateCreateButton();
    
    // Then set up an observer to watch for the button if it doesn't exist yet
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                // Check if our button has been added
                const createButton = document.querySelector('button[data-testid="issue-create.common.ui.footer.create-button"]');
                if (createButton) {
                    updateCreateButton();
                }
            }
        });
    });
    
    // Watch for changes in the DOM where the button might be added
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Get the current error count
 * @returns {number} Current error count
 */
function getErrorCount() {
    return errorCount;
}

/**
 * Set the error count
 * @param {number} count - New error count
 */
function setErrorCount(count) {
    errorCount = count;
    updateErrorBubble(errorCount);
}

/**
 * Get the current timeout ID
 * @returns {number} Current timeout ID
 */
function getTimeoutId() {
    return timeoutId;
}

/**
 * Set the timeout ID
 * @param {number} id - New timeout ID
 */
function setTimeoutId(id) {
    timeoutId = id;
}

// =============================================
// fieldValidation.js
// =============================================


/**
 * Validates a text segment to ensure it meets the required format
 * @param {string} segment - Text segment to validate
 * @returns {Array} Array of error messages
 */
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

/**
 * Validates component field
 * @param {Event} event - Change event
 * @returns {boolean} True if there's an error
 */
function checkComponent(event) {
    const input = event.target;
    const value = input.value.trim();
    
    // Exemple de validation spécifique
    if (value === "" || value === "none") {
        showUniqueError(input, "Le composant ne peut pas être vide ou 'none'");
        setErrorCount(getErrorCount() + 1);
    }
    
    updateErrorBubble(getErrorCount());
    return value === "" || value === "none"; // Retourne true si erreur
}

/**
 * Validates priority field
 * @param {Event} event - Change event
 */
function checkPriority(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.priority) {
        setErrorCount(getErrorCount() + 1);
        errorFlags.priority = true;
        alert("Erreur : 'none' ne doit pas être sélectionné pour la priorité !");
    } else if (selectedValue !== "none" && errorFlags.priority) {
        setErrorCount(getErrorCount() - 1);
        errorFlags.priority = false;
    }

    updateErrorBubble(getErrorCount());
}

/**
 * Validates components field
 * @param {Event} event - Change event
 */
function checkComponents(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.components) {
        setErrorCount(getErrorCount() + 1);
        errorFlags.components = true;
        alert("Erreur : 'none' ne doit pas être sélectionné pour les composants !");
    } else if (selectedValue !== "none" && errorFlags.components) {
        setErrorCount(getErrorCount() - 1);
        errorFlags.components = false;
    }

    updateErrorBubble(getErrorCount());
}

/**
 * Validates version field
 * @param {Event} event - Change event
 */
function checkVersion(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.version) {
        setErrorCount(getErrorCount() + 1);
        errorFlags.version = true;
        alert("Erreur : 'none' ne doit pas être sélectionné pour la version !");
    } else if (selectedValue !== "none" && errorFlags.version) {
        setErrorCount(getErrorCount() - 1);
        errorFlags.version = false;
    }

    updateErrorBubble(getErrorCount());
}

/**
 * Enforces unassigned value for assignee field
 */
function enforceUnassigned() {
    const assignee = document.getElementById("assignee-field");
    if (assignee && assignee.textContent !== "Unassigned") {
        assignee.textContent = "Unassigned";
    }
}

/**
 * Validates categorization field 
 */
function categorization() {
    const selectElement = document.getElementById("labels-field");
    if (selectElement && selectElement.value === "D0_sample") {
        if (!errorState.categorization) {
            setErrorCount(getErrorCount() + 1);
            errorState.categorization = true;
        }
    } else {
        if (errorState.categorization) {
            setErrorCount(getErrorCount() - 1);
            errorState.categorization = false;
        }
    }
    updateErrorBubble(getErrorCount());
}

/**
 * Sets variant field to ipn_10
 */
function variant() {
    const variantElement = document.getElementById("variant");
    if (variantElement) {
        variantElement.textContent = "ipn_10";
    }
}

/**
 * Validates variant2 field
 */
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
            setErrorCount(getErrorCount() + 1);
            errorState.variant2 = true;
        } else if (isValid && errorState.variant2) {
            setErrorCount(getErrorCount() - 1);
            errorState.variant2 = false;
        }
    }
    updateErrorBubble(getErrorCount());
}

/**
 * Validates error occurrence field
 */
function errorOccurrence() {
    const errorOccurrenceElement = document.getElementById("errorOccurrence");
    if (errorOccurrenceElement && errorOccurrenceElement.value === "none") {
        if (!errorState.errorOccurrence) {
            setErrorCount(getErrorCount() + 1);
            errorState.errorOccurrence = true;
        }
    } else {
        if (errorState.errorOccurrence) {
            setErrorCount(getErrorCount() - 1);
            errorState.errorOccurrence = false;
        }
    }
    updateErrorBubble(getErrorCount());
}

/**
 * Validates text field for specific prefix
 * @param {HTMLElement} inputElement - Input element to validate
 * @param {string} prefix - Required prefix
 */
function otherText(inputElement, prefix) {
    if (inputElement) {
        const text = inputElement.value.trim();
        if (!text.startsWith(prefix)) {
            if (!errorState.otherText) {
                setErrorCount(getErrorCount() + 1);
                errorState.otherText = true;
            }
        } else {
            if (errorState.otherText) {
                setErrorCount(getErrorCount() - 1);
                errorState.otherText = false;
            }
        }
    }
    updateErrorBubble(getErrorCount());
}

/**
 * Add additional validation controls to form
 */
function addAdditionalControls() {
    // Identifier tous les champs à valider
    const fieldsToValidate = [
        { id: "component", validator: checkComponent },
        { id: "version", validator: checkVersion },
        { id: "priority", validator: checkPriority }
        // Ajoutez d'autres champs ici selon vos besoins
    ];
    
    // Attacher les validateurs aux champs
    fieldsToValidate.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.addEventListener("change", field.validator);
            element.addEventListener("input", field.validator);
            
            // Vérification initiale
            field.validator({ target: element });
        }
    });
}

/**
 * Initialize event listeners for all validation fields
 */
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

// =============================================
// errorHandling.js
// =============================================


/**
 * Creates container for error alerts
 * @returns {HTMLElement} The error alerts container
 */
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

/**
 * Shows an error message in the UI
 * @param {HTMLElement} input - The input field related to the error
 * @param {string} message - The error message to display
 */
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

/**
 * Shows a unique error message (prevents duplicates)
 * @param {HTMLElement} input - The input field related to the error
 * @param {string} message - The error message to display
 */
function showUniqueError(input, message) {
    // If this message is already displayed, don't duplicate it
    if (activeAlerts.has(message)) {
        return;
    }
    
    activeAlerts.add(message);
    showError(input, message);
    
    // Remove from tracker after display delay
    setTimeout(() => {
        activeAlerts.delete(message);
    }, 5000);
    
    // Update the button state whenever errors are shown
    updateErrorBubble(getErrorCount());
}

/**
 * Checks the text content for errors
 * @param {HTMLElement} input - The input field to check
 * @returns {boolean} Whether there are errors
 */
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
    if (newErrorCount !== getErrorCount()) {
        setErrorCount(newErrorCount);
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "updateErrors", count: newErrorCount });
        }
        console.log("Current error count:", newErrorCount);
    }

    return newErrorCount > 0; // Return boolean indicating if there are errors
}

/**
 * Check input field for validation
 * @param {HTMLElement} input - Input element to check
 */
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
            updateErrorBubble(0);
        } else {
            checkText(input);
            // Use the global errorCount from getErrorCount
            updateErrorBubble(getErrorCount());
        }
    }
}

// =============================================
// chatBubble.js
// =============================================

let chatBubble;

/**
 * Creates and returns the chat bubble element
 * @returns {HTMLElement} The chat bubble element
 */
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

/**
 * Sets up listeners for extension messages
 */
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

/**
 * Function to show the chat bubble (to be called from popup.js)
 * @returns {boolean} Success status
 */
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

/**
 * Initializes all chat features
 */
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

// =============================================
// summaryAutocomplete.js
// =============================================


/**
 * Initialize autocomplete functionality for the summary field
 */
function initSummaryAutocomplete() {
    // Identifie le champ summary
    const summaryField = document.getElementById('summary') || 
                         document.querySelector('input[name="summary"]') ||
                         document.querySelector('.summary-field');
    
    if (!summaryField) {
        console.error("Champ summary non trouvé");
        return;
    }
    
    // Ajouter un placeholder pour guider l'utilisateur
    summaryField.placeholder = "[SWP-123] [IPNext] [Activity] : Description";
    
    // Ajouter une info-bulle explicative
    summaryField.title = "Format requis: [SWP-123] [IPNext] [Activity] : Description - Utilisez ESPACE pour naviguer entre les sections";
    
    // Variables pour suivre l'état de l'autocomplétion
    let currentSegment = 0; // 0 = id, 1 = IPNext, 2 = activity, 3 = text
    let activityMenu = null;
    
    // Ajout d'un écouteur d'événements pour gérer l'autocomplétion
    summaryField.addEventListener('input', function(e) {
        const cursorPosition = this.selectionStart;
        const text = this.value;
        
        // Détection de la position actuelle dans la chaîne de format
        detectCurrentSegment(text);
        
        // Gestion de l'autocomplétion en fonction du segment actuel
        handleAutocomplete(this, text, cursorPosition);
    });
    
    // Ajout d'un écouteur pour les touches spéciales (Espace, Tab, etc.)
    summaryField.addEventListener('keydown', function(e) {
        // Si l'utilisateur appuie sur Espace
        if (e.key === ' ') {
            const text = this.value;
            const cursorPosition = this.selectionStart;
            
            // Vérifier si nous sommes à la fin d'un segment
            if (isSegmentComplete(text, currentSegment, cursorPosition)) {
                e.preventDefault(); // Empêcher l'espace d'être ajouté
                moveToNextSegment(this, text, cursorPosition);
            }
        }
        
        // Si l'utilisateur appuie sur Tab
        if (e.key === 'Tab') {
            const text = this.value;
            const cursorPosition = this.selectionStart;
            
            // Vérifier si nous sommes dans un segment incomplet
            if (!isSegmentComplete(text, currentSegment, cursorPosition)) {
                e.preventDefault(); // Empêcher le comportement par défaut du Tab
                completeCurrentSegment(this, text, cursorPosition);
            }
        }
    });
    
    // Fonction pour détecter le segment actuel en fonction du texte
    function detectCurrentSegment(text) {
        // Regex pour identifier les segments
        const idRegex = /^\[SWP-\d+\]/;
        const ipNextRegex = /^\[SWP-\d+\]\s+\[IPNext\]/;
        const activityRegex = /^\[SWP-\d+\]\s+\[IPNext\]\s+\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]/;
        const colonRegex = /^\[SWP-\d+\]\s+\[IPNext\]\s+\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]\s*:/;
        
        if (!idRegex.test(text)) {
            currentSegment = 0; // ID manquant
        } else if (!ipNextRegex.test(text)) {
            currentSegment = 1; // IPNext manquant
        } else if (!activityRegex.test(text)) {
            currentSegment = 2; // Activity manquant
        } else if (!colonRegex.test(text)) {
            currentSegment = 3; // Deux-points manquants
        } else {
            currentSegment = 4; // Texte de description
        }
    }
    
    // Fonction pour vérifier si un segment est complet
    function isSegmentComplete(text, segment, position) {
        const segments = parseSegments(text);
        
        switch (segment) {
            case 0: // ID
                return segments.id && text.indexOf(']', 0) === position - 1;
            case 1: // IPNext
                return segments.ipNext && text.indexOf(']', segments.id.length) === position - 1;
            case 2: // Activity
                return segments.activity && text.indexOf(']', segments.id.length + segments.ipNext.length) === position - 1;
            case 3: // Colon
                return text.indexOf(':', 0) === position - 1;
            default:
                return false;
        }
    }
    
    // Fonction pour passer au segment suivant
    function moveToNextSegment(inputField, text, position) {
        let newText = text;
        
        switch (currentSegment) {
            case 0: // Après ID, ajouter espace + [IPNext]
                newText = text + ' [IPNext]';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                currentSegment = 1;
                
                // Ajouter automatiquement le segment suivant avec le crochet ouvrant après [IPNext]
                setTimeout(() => {
                    newText += ' [';
                    inputField.value = newText;
                    inputField.setSelectionRange(newText.length, newText.length);
                    currentSegment = 2;
                    showActivityMenu(inputField, newText.length);
                }, 100);
                break;
                
            case 1: // Après IPNext, ajouter espace + [
                newText = text + ' [';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                currentSegment = 2;
                showActivityMenu(inputField, newText.length);
                break;
                
            case 2: // Après Activity, ajouter espace + :
                newText = text + ' :';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                currentSegment = 3;
                break;
                
            case 3: // Après les deux-points, ajouter espace
                newText = text + ' ';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                currentSegment = 4;
                break;
        }
        
        // Déclencher un événement input pour vérifier la validité
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Fonction pour compléter le segment actuel
    function completeCurrentSegment(inputField, text, position) {
        let newText = text;
        
        switch (currentSegment) {
            case 0: // ID
                if (!text.startsWith('[')) {
                    newText = '[' + text;
                }
                if (!text.includes(']')) {
                    if (text.includes('SWP-')) {
                        // Compléter avec le crochet fermant
                        newText = newText + ']';
                    } else {
                        // Ajouter le préfixe SWP- si manquant
                        newText = newText.replace('[', '[SWP-');
                    }
                }
                break;
                
            case 1: // IPNext
                if (!text.includes('[IPNext]', text.indexOf(']') + 1)) {
                    const idEnd = text.indexOf(']') + 1;
                    newText = text.substring(0, idEnd) + ' [IPNext]';
                }
                break;
                
            case 2: // Activity
                // Géré par la liste déroulante d'activités
                break;
                
            case 3: // Colon
                if (!text.includes(':')) {
                    newText = text + ' :';
                }
                break;
        }
        
        inputField.value = newText;
        inputField.setSelectionRange(newText.length, newText.length);
        
        // Déclencher un événement input pour vérifier la validité
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Fonction pour gérer l'autocomplétion en temps réel
    function handleAutocomplete(inputField, text, position) {
        // Autocomplétion pour le segment ID
        if (currentSegment === 0) {
            // Si l'utilisateur commence à taper, ajouter les crochets si nécessaire
            if (text.length > 0 && !text.startsWith('[')) {
                inputField.value = '[' + text;
                inputField.setSelectionRange(position + 1, position + 1);
            }
            // Si l'utilisateur tape "SWP" sans le tiret, ajouter le tiret
            if (text.includes('SWP') && !text.includes('SWP-')) {
                const newText = text.replace('SWP', 'SWP-');
                inputField.value = newText;
                inputField.setSelectionRange(position + 1, position + 1);
            }
            
            // Si l'utilisateur tape juste un nombre sans SWP, ajouter le préfixe SWP-
            const idContent = text.match(/\[(\d+)/);
            if (idContent) {
                const newText = text.replace('[' + idContent[1], '[SWP-' + idContent[1]);
                inputField.value = newText;
                inputField.setSelectionRange(position + 4, position + 4); // +4 pour "SWP-"
            }
        }
        
        // Autocomplétion pour IPNext
        if (currentSegment === 1) {
            // Si l'utilisateur tape "ip", autocompléter en "IPNext"
            const lastSegment = text.substring(text.indexOf(']') + 1).trim();
            if (lastSegment.startsWith('[i') || lastSegment.startsWith('[I')) {
                const newText = text.substring(0, text.indexOf(']') + 1) + ' [IPNext]';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                
                // Ajouter automatiquement le segment suivant avec le crochet ouvrant
                setTimeout(() => {
                    inputField.value = newText + ' [';
                    inputField.setSelectionRange(newText.length + 2, newText.length + 2);
                    showActivityMenu(inputField, newText.length + 2);
                    currentSegment = 2;
                }, 100);
            }
        }
        
        // Autocomplétion pour Activity
        if (currentSegment === 2) {
            const segments = parseSegments(text);
            if (segments.partial && !segments.activity) {
                // Si l'utilisateur a commencé à taper une activité
                showActivityMenu(inputField, position);
            }
        }
    }
    
    // Fonction pour afficher le menu d'activités
    function showActivityMenu(inputField, position) {
        // Supprimer le menu existant s'il y en a un
        if (activityMenu) {
            activityMenu.remove();
        }
        
        // Créer un nouveau menu
        activityMenu = document.createElement('div');
        activityMenu.className = 'activity-menu';
        Object.assign(activityMenu.style, {
            position: 'absolute',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: '9999',
            maxHeight: '200px',
            overflowY: 'auto',
            width: '150px'
        });
        
        // Positionner le menu sous le champ de saisie
        const rect = inputField.getBoundingClientRect();
        activityMenu.style.top = (rect.bottom + 5) + 'px';
        activityMenu.style.left = (rect.left + position * 8) + 'px'; // Estimation de la position du curseur
        
        // Ajouter les options d'activité
        validActivities.forEach(activity => {
            const option = document.createElement('div');
            option.textContent = activity;
            Object.assign(option.style, {
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'background 0.2s'
            });
            
            // Effet de survol
            option.addEventListener('mouseenter', () => {
                option.style.background = '#f0f0f0';
            });
            option.addEventListener('mouseleave', () => {
                option.style.background = 'transparent';
            });
            
            // Sélection d'une activité
            option.addEventListener('click', () => {
                const text = inputField.value;
                const segments = parseSegments(text);
                
                // Construire le nouveau texte avec l'activité sélectionnée
                let newText;
                if (segments.partial) {
                    // Remplacer l'activité partielle
                    const activityStart = text.lastIndexOf('[', position);
                    newText = text.substring(0, activityStart) + '[' + activity + ']';
                } else {
                    // Ajouter la nouvelle activité
                    newText = text + activity + ']';
                }
                
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                activityMenu.remove();
                activityMenu = null;
                
                // Déclencher un événement input pour vérifier la validité
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
            });
            
            activityMenu.appendChild(option);
        });
        
        // Ajouter le menu au document
        document.body.appendChild(activityMenu);
        
        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', function closeMenu(e) {
            if (!activityMenu.contains(e.target) && e.target !== inputField) {
                activityMenu.remove();
                activityMenu = null;
                document.removeEventListener('click', closeMenu);
            }
        });
    }
    
    // Fonction pour analyser les segments du texte
    function parseSegments(text) {
        const result = {
            id: null,
            ipNext: null,
            activity: null,
            partial: null,
            text: null
        };
        
        // Regex pour les différents segments
        const idRegex = /^\[([^\]]+)\]/;
        const ipNextRegex = /\[IPNext\]/;
        const activityRegex = /\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]/;
        const partialRegex = /\[([^\]]*)/g;
        
        // Extraire l'ID
        const idMatch = text.match(idRegex);
        if (idMatch) {
            result.id = idMatch[0];
        }
        
        // Extraire IPNext
        const ipNextMatch = text.match(ipNextRegex);
        if (ipNextMatch) {
            result.ipNext = ipNextMatch[0];
        }
        
        // Extraire l'activité
        const activityMatch = text.match(activityRegex);
        if (activityMatch) {
            result.activity = activityMatch[0];
        }
        
        // Extraire une activité partielle (crochets ouverts sans fermeture)
        const allPartials = [...text.matchAll(partialRegex)];
        if (allPartials.length > 0) {
            const lastPartial = allPartials[allPartials.length - 1];
            if (!text.includes(']', lastPartial.index)) {
                result.partial = lastPartial[0];
            }
        }
        
        // Extraire le texte après les deux-points
        const colonIndex = text.indexOf(':');
        if (colonIndex !== -1) {
            result.text = text.substring(colonIndex + 1).trim();
        }
        
        return result;
    }
    
    // Initialisation - vérifier l'état actuel du champ
    if (summaryField.value) {
        detectCurrentSegment(summaryField.value);
    }
    
    console.log("📝 Autocomplétion pour le champ summary initialisée");
}

// =============================================
// index.js
// =============================================

import { 
    checkPriority, 
    checkComponents, 
    checkVersion, 
    enforceUnassigned, 
    variant, 
    initializeEventListeners,
    categorization,
    variant2,
    errorOccurrence,
    otherText,
    addAdditionalControls
} from './fieldValidation.js';

// Event listeners
let timeoutId;

/**
 * Initializes all components and sets up event listeners
 */
function initializeAll() {
    try {
        // Initialize error bubble
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

        // Initialize additional features
        addAdditionalControls();
        initSummaryAutocomplete();
        
        // Initialize chat features
        initializeChatFeatures();
        
        // Check initial field values
        const summaryField = document.getElementById('summary') || 
                             document.querySelector('input[name="summary"]') ||
                             document.querySelector('.summary-field');
        
        if (summaryField) {
            checkInput(summaryField);
        }
        
        // Prevent submission with errors
        preventTicketSubmission();
        
        // Set up assignee observer
        const assigneeObserver = observeElement("assignee-field", enforceUnassigned);
        
        // Initialize validation features
        variant();
        initializeEventListeners();
        categorization();
        variant2();
        errorOccurrence();
        
        // Example text field validation
        const exampleText = document.getElementById("exampleText");
        if (exampleText) {
            otherText(exampleText, "[TestSuitaName]:");
        }
        
        console.log("✅ JIRA plugin initialized successfully!");
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

// Set up input event listeners for validation
document.addEventListener("input", (e) => {
    const input = e.target;
    
    // Check if it's the summary field
    const isSummary = input.id === "summary" || 
                      input.name === "summary" || 
                      input.classList.contains("summary-field");
    
    // For text inputs and the summary field
    if (input.matches("textarea, input[type='text']") || isSummary) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => checkInput(input), 500);
    }
});

// Set up extension message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleChatBubble") {
        const bubble = createBubbleChat();
        sendResponse({ success: true, bubbleId: bubble.id });
        return true; // Indicates you wish to send a response asynchronously
    }
});

// Initialize everything when the DOM is loaded
document.addEventListener("DOMContentLoaded", initializeAll);

// If document is already loaded, initialize
if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(initializeAll, 100);
}

// Expose functions to window for external access
window.afficherBulle = function() {
    const chatBubble = document.getElementById("chatBubble") || createBubbleChat();
    const chatContainer = document.getElementById("chatBotContainer");
    
    chatBubble.style.display = "flex";
    chatBubble.style.visibility = "visible";
    localStorage.removeItem("chatBubbleHidden");
    
    // Animation effect
    chatBubble.style.transform = "scale(0)";
    setTimeout(() => {
        chatBubble.style.transform = "scale(1)";
    }, 100);
    
    chatContainer.style.display = "block";
    chatBubble.style.transform = "scale(1.05)";
    
    return true;
};

// Set up observers for DOM changes
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

// Setup a DOM observer to initialize autocomplete when summary field is added dynamically
setupDOMObserver(
    initSummaryAutocomplete,
    '#summary, input[name="summary"], .summary-field'
);

console.log("✅ content.js chargé!");
console.log("Script execution completed, bubble should be visible");

