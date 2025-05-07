import { activeAlerts } from './constants.js';
import { updateErrorBubble, setErrorCount, getErrorCount } from './errorBubble.js';
import { isExtensionField } from './domHelpers.js';
import { validateSegment } from './fieldValidation.js';

/**
 * Creates container for error alerts
 * @returns {HTMLElement} The error alerts container
 */
export function createErrorContainer() {
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
export function showError(input, message) {
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
export function showUniqueError(input, message) {
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
export function checkText(input) {
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
export function checkInput(input) {
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