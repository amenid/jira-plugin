import { createErrorBubble, updateErrorBubble, preventTicketSubmission } from './errorBubble.js';
import { createBubbleChat, setupExtensionListener, initializeChatFeatures } from './chatBubble.js';
import { initSummaryAutocomplete } from './summaryAutocomplete.js';
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
import { observeElement, setupDOMObserver } from './domHelpers.js';
import { checkInput } from './errorHandling.js';

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