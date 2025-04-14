let errorCount = 0;

// Mettre à jour le badge de l'extension
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "updateErrors") {
        errorCount = message.count;
        browser.browserAction.setBadgeText({ text: errorCount > 0 ? `${errorCount}` : "" });
        browser.browserAction.setBadgeBackgroundColor({ color: errorCount > 0 ? "red" : "green" });
    }
});

// Afficher la bulle au clic sur l'icône de l'extension
browser.browserAction.onClicked.addListener(async (tab) => {
    try {
        await browser.tabs.sendMessage(tab.id, { action: "showBubble" });
        console.log("✨ Bulle affichée via l'icône de l'extension");
    } catch (error) {
        console.error("❌ Erreur lors de l'affichage de la bulle :", error);
    }
});

//chatbot
// Fonction pour afficher/masquer le chatbot
function toggleChatbot() {
    const chatbotFrame = document.getElementById("chatbot-frame");
    if (chatbotFrame) {
        chatbotFrame.style.display = chatbotFrame.style.display === "none" ? "block" : "none";
    } else {
        const iframe = document.createElement("iframe");
        iframe.id = "chatbot-frame";
        iframe.src = "https://votre-chatbot.streamlit.app"; // URL publique du chatbot        iframe.style.position = "fixed";
        iframe.style.top = "50px";
        iframe.style.right = "10px";
        iframe.style.width = "400px";
        iframe.style.height = "500px";
        iframe.style.border = "1px solid #ccc";
        iframe.style.zIndex = "1000";
        iframe.style.backgroundColor = "white";
        document.body.appendChild(iframe);
    }
}

// Ajouter un écouteur d'événements à la bulle d'erreur
document.addEventListener("DOMContentLoaded", () => {
    const errorBubble = document.getElementById("error-bubble");
    if (errorBubble) {
        errorBubble.addEventListener("click", toggleChatbot);
    }
});
// background.js - Manages API calls for notifications

// Configuration for API endpoints
const API_CONFIG = {
    teamsWebhook: "https://your-teams-webhook-url.com", // Update this with your actual Teams webhook URL
    emailService: "https://your-email-service-api.com"  // Update this with your email service API
};

// Listen for messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background script received message:", message);

    switch (message.action) {
        case "sendTeamsNotification":
            sendTeamsNotification(message.payload, message.recipient, message.message);
            break;
        
        case "sendEmailNotification":
            sendEmailNotification(message.recipient, message.subject, message.content);
            break;
            
        default:
            console.log("Unknown action:", message.action);
    }
    
    return true; // Keep the message channel open for async responses
});

// Send notification to Microsoft Teams via webhook
async function sendTeamsNotification(payload, recipient, message) {
    try {
        // If recipient is a teams user, you might need to customize the payload
        // to include @mentions or direct the message to specific channels
        
        // You could have a mapping of users to webhooks or channels
        const webhookUrl = API_CONFIG.teamsWebhook;
        
        // Make the API call to Teams webhook
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log("Teams notification sent successfully");
    } catch (error) {
        console.error("Error sending Teams notification:", error);
    }
}

// Send email notification via your email service
async function sendEmailNotification(recipient, subject, content) {
    try {
        // Prepare email data
        const emailData = {
            to: recipient,
            subject: subject,
            html: content,
            from: "jira-notifications@yourcompany.com"  // Update with your sender email
        };
        
        // Make the API call to your email service
        const response = await fetch(API_CONFIG.emailService, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_API_KEY'  // Include your API key if needed
            },
            body: JSON.stringify(emailData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log("Email notification sent successfully");
    } catch (error) {
        console.error("Error sending email notification:", error);
    }
}

// Function to handle browser extension installation or update
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        // Set default notification settings on install
        const defaultSettings = {
            notifyOnComment: true,
            notifyOnLabel: true,
            notifyOnDueDate: true,
            notifyOnSprintEnd: true,
            watchedLabels: ["bug", "critical", "urgent"],
            dueDateThreshold: 2,
            sprintEndThreshold: 3,
            notificationMethod: "teams",
            userMapping: {}
        };
        
        browser.storage.sync.set({ 'notificationSettings': defaultSettings });
        console.log("Default notification settings installed");
    }
});
chrome.action.onClicked.addListener((tab) => {
    // Envoyer un message directement à la page pour afficher la bulle
    chrome.tabs.sendMessage(tab.id, { action: "toggleChatBubble" }, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Erreur lors de l'envoi du message:", chrome.runtime.lastError);
        
        // Injecter le script si la page ne l'a pas encore chargé
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content-script.js"]
        }).then(() => {
          // Attendre que le script soit chargé puis réessayer
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: "toggleChatBubble" });
          }, 200);
        }).catch(err => {
          console.error("Erreur lors de l'injection du script:", err);
        });
      }
    });
  });
console.log("Background script loaded for Jira notifications");