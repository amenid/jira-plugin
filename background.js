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