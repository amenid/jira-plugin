/**
 * Determines if an element belongs to the extension
 * @param {HTMLElement} element - DOM element to check
 * @returns {boolean} True if the element is part of the extension
 */
export function isExtensionField(element) {
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
export function setupDOMObserver(callback, selector) {
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
export function observeElement(elementId, callback) {
    const element = document.getElementById(elementId);
    if (!element) return null;
    
    const observer = new MutationObserver(callback);
    observer.observe(element, { childList: true, subtree: true });
    return observer;
}