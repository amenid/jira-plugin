/*let scriptInjecte = false;
var timeoutId; // Déclaration unique de timeoutId, au niveau global, avant toute fonction

document.addEventListener('DOMContentLoaded', function () {
    const injectBtn = document.getElementById('injectBtn');
    const statusDiv = document.getElementById('status');

    // Ajouter un événement de clic pour le bouton injectBtn
    injectBtn.addEventListener("click", async () => {
        try {
            // Récupérer l'onglet actif dans la fenêtre actuelle
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });

            if (tabs.length === 0) {
                console.error("❌ Aucun onglet actif !");
                statusDiv.textContent = "Erreur : Aucun onglet actif";
                statusDiv.className = 'error';
                return;
            }

            const tabId = tabs[0].id;

            let isScriptActive = false;
            try {
                let response = await browser.tabs.sendMessage(tabId, { action: "ping" });
                if (response && response.status === "active") {
                    isScriptActive = true;
                }
            } catch (error) {
                console.log("ℹ️ Content script non actif, injection en cours...");
            }
            
            if (!isScriptActive) {
                await browser.tabs.executeScript(tabId, { file: "content.js" });
                setTimeout(() => {
                    envoyerMessage(tabId);
                }, 500); // Attendre un peu avant d'envoyer le message
            } else {
                envoyerMessage(tabId);
            }
            
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des onglets :", error);
            statusDiv.textContent = "Erreur d'accès aux onglets : " + error.message;
            statusDiv.className = 'error'; // Appliquer la classe d'erreur
        }
    });
});

// Fonction pour envoyer un message au content script
async function envoyerMessage(tabId) {
    try {
        await browser.tabs.sendMessage(tabId, { action: "showBubble" });
        console.log("✅ Message envoyé au content script.");
        document.getElementById('status').textContent = "Message envoyé au content script.";
        document.getElementById('status').className = 'success'; // Appliquer la classe de succès
    } catch (error) {
        console.error("❌ Erreur lors de l’envoi du message au content script :", error);
        document.getElementById('status').textContent = "Erreur lors de l’envoi du message.";
        document.getElementById('status').className = 'error'; // Appliquer la classe d'erreur
    }
}

// Fonction pour envoyer le texte de la page au script content.js
function sendTextToContentScript(tabId) {
    // Utiliser executeScript pour récupérer le texte de la page
    browser.tabs.executeScript(tabId, { code: "document.body.innerText" })
    .then(result => {
        if (result && result[0]) {
            console.log("Texte récupéré : ", result[0]);
            return browser.tabs.sendMessage(tabId, {
                action: "showBubble",
                texte: result[0]
            });
        } else {
            throw new Error("Aucun texte récupéré");
        }
    })
    .catch(error => {
        console.error("Erreur lors de la récupération du texte : ", error);
        document.getElementById('status').textContent = "Erreur lors de la récupération du texte.";
        document.getElementById('status').className = 'error';
    });

}

// Ajout d'un événement pour activer/désactiver la correction
document.getElementById("toggleCorrectionButton").addEventListener("click", async function () {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        console.error("❌ Aucun onglet actif !");
        return;
    }
    const tabId = tabs[0].id;
    // Activer ou désactiver la correction
    browser.tabs.sendMessage(tabId, { action: "toggleCorrection" });
    // Envoyer le texte après l'activation/désactivation
    sendTextToContentScript(tabId);
});

// Dans popup.js ou le fichier d'injection
if (document.getElementById('myExtensionBubble')) {
    console.log("✅ Content script déjà actif !");
} else {
    // Code pour injecter le script si ce n'est pas déjà fait
    browser.tabs.executeScript({ file: "content.js" })
        .then(() => console.log("✅ Script injecté"))
        .catch(error => console.error("❌ Erreur lors de l'injection du script", error));
}*/
/*document.addEventListener('DOMContentLoaded', function () {
    const injectBtn = document.getElementById('injectBtn');
    const toggleCorrectionBtn = document.getElementById('toggleCorrectionButton');
    const statusDiv = document.getElementById('status');
    const checkNowBtn = document.getElementById("checkNow");

    // Vérifier si les éléments existent avant d'ajouter des écouteurs
    if (injectBtn) {
        injectBtn.addEventListener("click", function () {
            browser.runtime.sendMessage({ action: "injectScript" }, function (response) {
                if (response && response.status === "ok") {
                    statusDiv.textContent = "Script injecté avec succès !";
                    statusDiv.className = "success";
                } else {
                    statusDiv.textContent = "Erreur: " + (response ? response.message : "Aucune réponse");
                    statusDiv.className = "error";
                }
            });
        });
    } else {
        console.warn("L'élément injectBtn n'existe pas.");
    }

    if (toggleCorrectionBtn) {
        toggleCorrectionBtn.addEventListener("click", function () {
            browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length > 0) {
                    const tabId = tabs[0].id;
                    browser.tabs.sendMessage(tabId, { action: "toggleCorrection" }, function (response) {
                        console.log("Réponse toggleCorrection :", response);
                    });
                }
            });
        });
    } else {
        console.warn("L'élément toggleCorrectionButton n'existe pas.");
    }

    if (checkNowBtn) {
        checkNowBtn.addEventListener("click", () => {
            browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    browser.tabs.sendMessage(tabs[0].id, { action: "checkText" });
                }
            });
        });
    } else {
        console.warn("L'élément checkNow n'existe pas.");
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const injectBtn = document.getElementById('injectBtn');
    const statusDiv = document.getElementById('status');

    if (injectBtn) {
        injectBtn.addEventListener("click", function () {
            browser.runtime.sendMessage({ action: "injectScript" }, function (response) {
                console.log("📩 Réponse du background :", response);
                if (response && response.status === "ok") {
                    statusDiv.textContent = "✅ Script injecté avec succès !";
                    statusDiv.className = "success";
                } else {
                    statusDiv.textContent = "❌ Erreur: " + (response ? response.message : "Aucune réponse");
                    statusDiv.className = "error";
                }
            });
        });
    } else {
        console.warn("⚠️ Le bouton injectBtn n'existe pas.");
    }
});*/
document.addEventListener('DOMContentLoaded', function () {
    // Éléments de l'interface
    const injectBtn = document.getElementById('injectBtn');
    const toggleCorrectionBtn = document.getElementById('toggleCorrectionButton');
    const statusDiv = document.getElementById('status');
    const checkNowBtn = document.getElementById('checkNow');
    const afficherBulleBtn = document.getElementById('afficherBulle');

    // État global de la correction
    let correctionActive = true;

    // Initialisation de l'état depuis le stockage
    browser.storage.local.get('correctionActive').then(({ correctionActive: stored }) => {
        correctionActive = stored !== false;
        updateToggleButton();
    });

    // Gestion du bouton d'injection
    if (injectBtn) {
        injectBtn.addEventListener("click", async function () {
            try {
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                if (!tabs.length) {
                    throw new Error("Aucun onglet actif");
                }

                const response = await browser.runtime.sendMessage({ action: "injectScript" });
                
                if (response && response.status === "ok") {
                    updateStatus("✅ Script injecté avec succès !", "success");
                    // Activer automatiquement la vérification après l'injection
                    await browser.tabs.sendMessage(tabs[0].id, { 
                        action: "showBubble",
                        correctionActive: correctionActive
                    });
                } else {
                    throw new Error(response ? response.message : "Aucune réponse");
                }
            } catch (error) {
                updateStatus(`❌ Erreur: ${error.message}`, "error");
                console.error("Erreur lors de l'injection:", error);
            }
        });
    }

    // Gestion du bouton de basculement de correction
    if (toggleCorrectionBtn) {
        toggleCorrectionBtn.addEventListener("click", async function () {
            correctionActive = !correctionActive;
            
            try {
                // Sauvegarder l'état
                await browser.storage.local.set({ correctionActive });
                
                // Mettre à jour l'interface
                updateToggleButton();
                
                // Envoyer le nouvel état au content script
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0) {
                    await browser.tabs.sendMessage(tabs[0].id, { 
                        action: "toggleCorrection",
                        state: correctionActive
                    });
                    
                    updateStatus(
                        correctionActive ? "✅ Correction activée" : "⏸️ Correction désactivée",
                        "success"
                    );
                }
            } catch (error) {
                updateStatus("❌ Erreur lors du changement d'état", "error");
                console.error("Erreur:", error);
            }
        });
    }

    // Gestion du bouton de vérification immédiate
    if (checkNowBtn) {
        checkNowBtn.addEventListener("click", async () => {
            try {
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0) {
                    await browser.tabs.sendMessage(tabs[0].id, { action: "checkText" });
                    updateStatus("🔍 Vérification en cours...", "info");
                }
            } catch (error) {
                updateStatus("❌ Erreur lors de la vérification", "error");
                console.error("Erreur:", error);
            }
        });
    }

    // Gestion du bouton "Afficher la bulle"
    if (afficherBulleBtn) {
        afficherBulleBtn.addEventListener("click", async () => {
            try {
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0) {
                    await browser.tabs.sendMessage(tabs[0].id, { action: "showBubble" });
                    updateStatus("✨ Bulle affichée !", "success");
                }
            } catch (error) {
                updateStatus("❌ Erreur lors de l'affichage de la bulle", "error");
                console.error("Erreur:", error);
            }
        });
    }

    // Fonctions utilitaires
    function updateStatus(message, className) {
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = className;
        }
    }

    function updateToggleButton() {
        if (toggleCorrectionBtn) {
            toggleCorrectionBtn.textContent = correctionActive ? 
                "Désactiver la correction" : 
                "Activer la correction";
            toggleCorrectionBtn.className = correctionActive ? 
                "active" : 
                "inactive";
        }
    }
});