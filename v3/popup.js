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
    chrome.storage.local.get('correctionActive').then(({ correctionActive: stored }) => {
        correctionActive = stored !== false;
        updateToggleButton();
    });

    // Gestion du bouton d'injection
    if (injectBtn) {
        injectBtn.addEventListener("click", async function () {
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tabs.length) {
                    throw new Error("Aucun onglet actif");
                }

                const response = await chrome.runtime.sendMessage({ action: "injectScript" });
                
                if (response && response.status === "ok") {
                    updateStatus("✅ Script injecté avec succès !", "success");
                    // Activer automatiquement la vérification après l'injection
                    await chrome.tabs.sendMessage(tabs[0].id, { 
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
                await chrome.storage.local.set({ correctionActive });
                
                // Mettre à jour l'interface
                updateToggleButton();
                
                // Envoyer le nouvel état au content script
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0) {
                    await chrome.tabs.sendMessage(tabs[0].id, { 
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
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0) {
                    await chrome.tabs.sendMessage(tabs[0].id, { action: "checkText" });
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
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0) {
                    await chrome.tabs.sendMessage(tabs[0].id, { action: "showBubble" });
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