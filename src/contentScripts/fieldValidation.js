import { validActivities } from './constants.js';
import { showUniqueError } from './errorHandling.js';
import { errorFlags, errorState } from './constants.js';
import { updateErrorBubble, getErrorCount, setErrorCount } from './errorBubble.js';

/**
 * Validates a text segment to ensure it meets the required format
 * @param {string} segment - Text segment to validate
 * @returns {Array} Array of error messages
 */
export function validateSegment(segment) {
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
export function checkComponent(event) {
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
export function checkPriority(event) {
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
export function checkComponents(event) {
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
export function checkVersion(event) {
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
export function enforceUnassigned() {
    const assignee = document.getElementById("assignee-field");
    if (assignee && assignee.textContent !== "Unassigned") {
        assignee.textContent = "Unassigned";
    }
}

/**
 * Validates categorization field 
 */
export function categorization() {
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
export function variant() {
    const variantElement = document.getElementById("variant");
    if (variantElement) {
        variantElement.textContent = "ipn_10";
    }
}

/**
 * Validates variant2 field
 */
export function variant2() {
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
export function errorOccurrence() {
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
export function otherText(inputElement, prefix) {
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
export function addAdditionalControls() {
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
export function initializeEventListeners() {
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