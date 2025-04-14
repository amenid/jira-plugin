document.addEventListener('DOMContentLoaded', function () {
    // Éviter la duplication de l'événement DOMContentLoaded
    // Au chargement du popup, envoyer automatiquement le message pour afficher la bulle
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0]) {
            // Envoyer le message pour afficher la bulle automatiquement
            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleChatBubble" }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Erreur lors de l'envoi du message:", chrome.runtime.lastError);
                    
                    // Tentative d'injecter et d'exécuter la fonction directement si le message échoue
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: function() {
                            // Vérifier si la bulle existe déjà
                            if (document.getElementById("chatBubble")) {
                                document.getElementById("chatBubble").style.display = "flex";
                                document.getElementById("chatBubble").style.visibility = "visible";
                            } else if (window.createBubbleChat) {
                                // Si la fonction existe, l'appeler
                                window.createBubbleChat();
                            } else {
                                console.error("Impossible d'afficher la bulle de chat");
                            }
                        }
                    });
                } else if (response && response.success) {
                    console.log("Bulle de chat affichée avec succès");
                }
            });
        }
    });
    
    // Fermer le popup après une courte période
    setTimeout(() => {
        window.close();
    }, 300);

    // S'assurer que les éléments existent avant d'y accéder
    chrome.storage.sync.get('notificationSettings', function(result) {
        const settings = result.notificationSettings || {};
        updateNotificationStatus(settings);
    });

    // Vérifier si les éléments existent avant d'ajouter les écouteurs d'événements
    if (document.getElementById('configureNotifications')) {
        document.getElementById('configureNotifications').addEventListener('click', openConfigPage);
    }
    if (document.getElementById('testNotification')) {
        document.getElementById('testNotification').addEventListener('click', sendTestNotification);
    }
    if (document.getElementById('resetSettings')) {
        document.getElementById('resetSettings').addEventListener('click', resetSettings);
    }
});

// Update notification status display
function updateNotificationStatus(settings) {
    const statusDiv = document.getElementById('notificationStatus');
    // Vérifier si l'élément existe
    if (!statusDiv) {
        console.error("L'élément avec l'ID 'notificationStatus' n'existe pas");
        return;
    }
    
    let statusHtml = '';

    // Check which notifications are enabled
    const enabledCount = [
        settings.notifyOnComment, 
        settings.notifyOnLabel,
        settings.notifyOnDueDate,
        settings.notifyOnSprintEnd
    ].filter(Boolean).length;
    
    const totalCount = 4;
    
    if (enabledCount === totalCount) {
        statusHtml = '<p>✅ All notifications are active</p>';
    } else if (enabledCount === 0) {
        statusHtml = '<p>❌ All notifications are disabled</p>';
    } else {
        statusHtml = `<p>⚠️ ${enabledCount}/${totalCount} notifications active</p>`;
    }
    
    // Add notification method info
    if (settings.notificationMethod) {
        let methodIcon = '';
        switch(settings.notificationMethod) {
            case 'teams':
                methodIcon = '👥 Microsoft Teams';
                break;
            case 'email':
                methodIcon = '📧 Email';
                break;
            case 'both':
                methodIcon = '📧👥 Email & Teams';
                break;
            default:
                methodIcon = settings.notificationMethod;
        }
        statusHtml += `<p>Notification method: ${methodIcon}</p>`;
    }
    
    statusDiv.innerHTML = statusHtml + '<button id="configureNotifications">Configure Notifications</button>';
    
    // Ajouter l'écouteur d'événement après avoir mis à jour le HTML
    const configButton = document.getElementById('configureNotifications');
    if (configButton) {
        configButton.addEventListener('click', openConfigPage);
    }
}

// Open configuration page
function openConfigPage() {
    // Find the current active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        
        // Send message to content script to show settings
        chrome.tabs.sendMessage(activeTab.id, {
            action: "showBubble",
            showSettings: true
        });
        
        // Close the popup
        window.close();
    });
}

// Send a test notification
function sendTestNotification() {
    // Find the current active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        
        // Get current user info
        chrome.storage.sync.get('notificationSettings', function(result) {
            const settings = result.notificationSettings || {};
            
            // Prepare test notification
            const testTicketInfo = {
                key: "TEST-123",
                summary: "Test Notification Ticket",
                assignee: "You",
                reporter: "Extension",
                status: "Testing",
                project: "TEST",
                url: activeTab.url,
                dueDate: new Date().toLocaleDateString(),
                sprint: "Test Sprint (ends in 5 days)",
                labels: ["test", "notification"]
            };
            
            // Send test message to background script
            chrome.runtime.sendMessage({
                action: settings.notificationMethod === "email" ? "sendEmailNotification" : "sendTeamsNotification",
                recipient: "you",
                subject: "Test Notification from Jira Extension",
                message: "This is a test notification to verify that your notification settings are working correctly.",
                payload: {
                    "@type": "MessageCard",
                    "@context": "http://schema.org/extensions",
                    "themeColor": "0076D7",
                    "summary": "Test notification",
                    "sections": [{
                        "activityTitle": "**Test Notification**",
                        "activitySubtitle": "This is a test to verify your notification settings",
                        "facts": [
                            { "name": "Sent on", "value": new Date().toLocaleString() }
                        ],
                        "markdown": true
                    }]
                },
                content: "<h2>Test Notification</h2><p>This is a test to verify your notification settings are working correctly.</p>"
            });
            
            // Show confirmation
            alert("Test notification sent! Check your " + 
                (settings.notificationMethod === "both" ? "email and Microsoft Teams" : 
                (settings.notificationMethod === "email" ? "email" : "Microsoft Teams")));
        });
    });
}

// Reset all settings to defaults
function resetSettings() {
    if (confirm("Are you sure you want to reset all notification settings to defaults?")) {
        // Default settings
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
        
        // Save default settings
        chrome.storage.sync.set({ 'notificationSettings': defaultSettings }, function() {
            updateNotificationStatus(defaultSettings);
            alert("Settings have been reset to defaults.");
        });
    }
}