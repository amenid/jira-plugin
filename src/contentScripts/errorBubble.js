// Error bubble functionality
let errorBubble;
let errorCount = 0;
let timeoutId;

/**
 * Creates error bubble UI element for showing validation errors
 * @returns {HTMLElement} The error bubble element
 */
export function createErrorBubble() {
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
export function updateErrorBubble(count) {
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
export function updateCreateButton() {
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
export function preventTicketSubmission() {
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
export function getErrorCount() {
    return errorCount;
}

/**
 * Set the error count
 * @param {number} count - New error count
 */
export function setErrorCount(count) {
    errorCount = count;
    updateErrorBubble(errorCount);
}

/**
 * Get the current timeout ID
 * @returns {number} Current timeout ID
 */
export function getTimeoutId() {
    return timeoutId;
}

/**
 * Set the timeout ID
 * @param {number} id - New timeout ID
 */
export function setTimeoutId(id) {
    timeoutId = id;
}