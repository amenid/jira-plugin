// service-worker.js (Manifest V3 - Version Finale)
'use strict';

let errorCount = 0;
const CHATBOT_URL = 'https://votre-chatbot.streamlit.app';

// Gestion du badge avec sécurité
function updateBadge(count) {
  errorCount = Math.max(0, parseInt(count) || 0); 
  const badgeText = errorCount > 0 ? String(errorCount) : "";
  const badgeColor = errorCount > 0 ? [255, 0, 0, 255] : [0, 128, 0, 255];

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}
// Vérification des URLs autorisées
function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('atlassian.net') || 
           parsed.hostname === 'votre-chatbot.streamlit.app';
  } catch {
    return false;
  }
}


// Injection sécurisée du chatbot
async function injectChatbot(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isAllowedUrl(tab.url)) {
      console.warn('URL non autorisée pour injection:', tab.url);
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (url, styles) => {
        const existingFrame = document.getElementById('chatbot-frame');
        if (existingFrame) {
          existingFrame.style.display = existingFrame.style.display === 'none' ? 'block' : 'none';
          return;
        }

        const iframe = document.createElement('iframe');
        iframe.id = 'chatbot-frame';
        iframe.src = url;
        Object.assign(iframe.style, styles);
        document.body.appendChild(iframe);
      },
      args: [
        CHATBOT_URL,
        {
          position: 'fixed',
          top: '50px',
          right: '10px',
          width: '400px',
          height: '500px',
          border: '1px solid #ccc',
          zIndex: '1000',
          backgroundColor: 'white'
        }
      ]
    });
  } catch (error) {
    console.error('Échec injection chatbot:', error);
  }
}

// Gestion des messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab) return;

  switch (message.type) {
    case 'updateErrors':
      updateBadge(message.count);
      break;

    case 'toggleChatbot':
      injectChatbot(sender.tab.id);
      break;
  }
});

// Gestion du clic sur l'icône
chrome.action.onClicked.addListener(async (tab) => {
    try {
      // Injecter le content.js SI nécessaire
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
  
      // Envoyer le message APRÈS l'injection
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: "showBubble",
        errorCount: 5 // Exemple de données
      });
      
      console.log("Réponse du content.js:", response);
    } catch (error) {
      console.error("Échec de communication :", error);
    }
  });
// Initialisation
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({ title: 'BUGS REPORT JIRA' });
  console.log('Extension initialisée');
});

// Gestion des erreurs globales
self.addEventListener('error', (event) => {
  console.error('Erreur SW:', event.error);
});
chrome.runtime.onInstalled.addListener(() => {
  // Stockage initial des identifiants (à faire une seule fois)
  chrome.storage.local.set({
    brevoUser: '8a993d002@smtp-brevo.com',
    brevoApiKey: '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'
  }, () => {
    console.log('Identifiants Brevo initialisés en stockage sécurisé');
  });
  
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({ title: 'BUGS REPORT JIRA' });
  console.log('Extension initialisée');
});




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateErrors") {
    // Mettre à jour le badge avec le nombre d'erreurs
    if (message.count > 0) {
      // Afficher le nombre d'erreurs sur l'icône
      chrome.action.setBadgeText({ text: message.count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#FF0000" }); // Rouge
    } else {
      // Effacer le badge si pas d'erreurs
      chrome.action.setBadgeText({ text: "" });
    }
    sendResponse({ success: true });
    return true;
  }
});
