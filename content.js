const validActivities = ["Nightly" , "Coverage", "Periodic_2h", "Weekly", "FV", "PreInt", "PreGate"];

// Variables globales
let errorBubble;
let errorCount = 0;
let timeoutId;

// Création de la bulle circulaire
function createErrorBubble() {
    errorBubble = document.createElement("div");
    errorBubble.id = "errorBubble";
    Object.assign(errorBubble.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "60px",
        height: "60px",
        backgroundColor: "rgba(255, 255, 255, 0.9)", // Added transparency
        color: "black",
        borderRadius: "50%",
        boxShadow: "0 2px 15px rgba(0,0,0,0.2), 0 0 5px rgba(255,255,255,0.8) inset", // Enhanced shadow for bubble effect
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "all 0.3s ease",
        zIndex: "10000",
        border: "2px solid transparent",
        cursor: "pointer",
        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(240,240,240,0.9))" // Gradient for bubble shine
    });

    // Contenu de la bulle
    const content = document.createElement("div");
    content.id = "bubbleContent";
    content.style.display = "flex";
    content.style.alignItems = "center";
    content.style.justifyContent = "center";
    content.style.flexDirection = "column";

    const icon = document.createElement("img");
    icon.id = "bubbleIcon";
    icon.src = browser.runtime.getURL("icon.png");
    // Remplir toute la bulle avec l'icône
    Object.assign(icon.style, {
        width: "100%",             // Utilise 100% de la largeur du conteneur
        height: "100%",            // Utilise 100% de la hauteur du conteneur
        display: "block",
        borderRadius: "50%",       // Garde l'image circulaire comme la bulle
        objectFit: "cover",        // Assure que l'image couvre toute la zone sans déformation
        padding: "0",              // Supprime tout padding
        margin: "0",               // Supprime toutes les marges
        position: "absolute",      // Positionnement absolu pour remplir l'espace parent
        top: "0",
        left: "0"
    });


    const text = document.createElement("span");
    text.id = "errorCount";
    text.textContent = "!";
    text.style.display = "none";
    text.style.fontSize = "24px";
    text.style.fontWeight = "bold";

    content.appendChild(icon);
    content.appendChild(text);
    errorBubble.appendChild(content);
// Bouton "X" pour fermer la bulle
const closeBtn = document.createElement("button");
closeBtn.textContent = "✖";
closeBtn.style.cssText = `
    position: absolute;
    top: 0px;                // Positionnement en haut
    right: 0px;              // Positionnement à droite
    width: 18px;             // Petite taille
    height: 18px;            // Petite taille
    background: #ff4444;     // Fond rouge
    color: white;
    border: none;
    border-radius: 50%;      // Forme circulaire
    cursor: pointer;
    font-size: 10px;         // Police plus petite pour la croix
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    transform: translate(50%, -50%); // Déplace la moitié du bouton en dehors de la bulle
    z-index: 10001;          // S'assure que le bouton est au-dessus de la bulle
`;
closeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Empêche le déclenchement de l'événement de clic sur la bulle
    errorBubble.remove();
});
    errorBubble.appendChild(closeBtn);
    document.body.appendChild(errorBubble);

   // ✅ Ajouter le chatbot sous forme d'iframe caché
   const chatContainer = document.createElement("div");
   chatContainer.id = "chatContainer";
   Object.assign(chatContainer.style, {
       position: "fixed",
       bottom: "90px",  // Juste au-dessus de la bulle
       right: "20px",
       width: "350px",
       height: "500px",
       backgroundColor: "white",
       boxShadow: "0 0 10px rgba(0,0,0,0.3)",
       borderRadius: "10px",
       overflow: "hidden",
       display: "none",  // Caché au départ
       zIndex: "9999"
   });

   const iframe = document.createElement("iframe");
   iframe.src = "http://localhost:8501";
   iframe.style.width = "100%";
   iframe.style.height = "100%";
   iframe.style.border = "none";

   chatContainer.appendChild(iframe);
   document.body.appendChild(chatContainer);

   // ✅ Toggle chat en cliquant sur la bulle
   let chatVisible = false;
   errorBubble.addEventListener("click", () => {
       chatVisible = !chatVisible;
       chatContainer.style.display = chatVisible ? "block" : "none";
   });

   return errorBubble;
}
// Mise à jour dynamique de la bulle
function updateErrorBubble(errorCount) {
    const bubble = document.getElementById("errorBubble") || createErrorBubble();
    const icon = document.getElementById("bubbleIcon");
    const text = document.getElementById("errorCount");

    if (errorCount > 0) {
        // Si des erreurs sont détectées
        Object.assign(bubble.style, {
            backgroundColor: "#ff4444",
            borderColor: "#ff0000",
            boxShadow: "0 2px 15px rgba(255,0,0,0.3), 0 0 5px rgba(255,150,150,0.8) inset",
            background: "radial-gradient(circle at 30% 30%, rgba(255,100,100,0.9), rgba(255,50,50,1))"
        });
        icon.style.display = "none"; // Masquer l'icône
        text.style.display = "block"; // Afficher le nombre d'erreurs
        text.textContent = `${errorCount}`;
        
        // Ajouter un effet de pulsation
        bubble.style.animation = "pulse 2s infinite";
        if (!document.getElementById("bubbleAnimation")) {
            const style = document.createElement("style");
            style.id = "bubbleAnimation";
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        // Si aucune erreur n'est détectée
        Object.assign(bubble.style, {
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "#00ff00",
            boxShadow: "0 2px 15px rgba(0,0,0,0.2), 0 0 5px rgba(255,255,255,0.8) inset",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(240,240,240,0.9))",
            animation: "none"
        });
        icon.style.display = "block"; // Afficher l'icône
        text.style.display = "none"; // Masquer le nombre d'erreurs
    }
}

// Afficher une alerte pour un format invalide
function showError(input, message) {
    const errorBubble = document.getElementById("errorBubble"); // Récupérer la bulle d'erreur
    if (!errorBubble) {
        console.error("Bulle d'erreur non trouvée.");
        return;
    }

    // Créer l'élément d'alerte
    const alert = document.createElement("div");
    alert.className = "alert";
    alert.style.cssText = `
        position: fixed; // Utiliser "fixed" pour un positionnement absolu par rapport à la fenêtre
        top: ${errorBubble.offsetTop}px; // Aligner verticalement avec la bulle
        right: ${window.innerWidth - errorBubble.offsetLeft + 10}px; // Positionner à gauche de la bulle
        background: #ff4444;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        white-space: nowrap;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    `;
    alert.innerText = message;

    // Ajouter l'alerte au corps du document
    document.body.appendChild(alert);

    // Supprimer l'alerte après 3 secondes
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Vérifier si le format est valide
function isValidFormat(text) {
    const regex = /^\[SWP-\d+\]\[IPNext\]\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]:\s.+$/;
    return regex.test(text);
}
function extractSegments(text) {
    // Expression régulière pour extraire les segments au format [SWP-$x][IPNext][$activity]: $text
    const regex = /\[SWP-\d+\]\[IPNext\]\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]:\s[^\[]+/g;
    return text.match(regex) || [];
}
function validateSegment(segment) {
    const errors = [];

    // Vérifier [$id]
    const idRegex = /^\[SWP-\d+\]/;
    if (!idRegex.test(segment)) {
        errors.push("Format de [$id] invalide. Le format attendu est : [SWP-$x]");
    }

    // Vérifier [IPNext]
    if (!segment.includes("[IPNext]")) {
        errors.push("Le champ [IPNext] est manquant ou incorrect.");
    }

    // Vérifier [$activity]
    const activityRegex = /\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]/;
    if (!activityRegex.test(segment)) {
        errors.push("L'activité [$activity] est invalide. Les valeurs autorisées sont : Nightly, Coverage, Periodic_2h, Weekly, FV, PreInt, PreGate.");
    }

    // Vérifier ": $text"
    if (!segment.includes(":")) {
        errors.push("Le format ': $text' est manquant.");
    }

    return errors;
}
function checkText(input) {
    const text = input.value.trim();
    const lines = text.split('\n'); // Séparer le texte en lignes
    let newErrorCount = 0;

    lines.forEach((line, lineIndex) => {
        const errors = validateSegment(line);

        if (errors.length > 0) {
            newErrorCount += errors.length;
            errors.forEach((error, errorIndex) => {
                showError(input, `Ligne ${lineIndex + 1}, Erreur ${errorIndex + 1} : ${error}`);
            });
        }
    });

    if (newErrorCount !== errorCount) {
        errorCount = newErrorCount;
        updateErrorBubble(errorCount);
        browser.runtime.sendMessage({ type: "updateErrors", count: errorCount });
    }

    return newErrorCount > 0; // Retourne true si des erreurs sont détectées
}
// Empêcher l'enregistrement du ticket si des erreurs sont détectées
function preventTicketSubmission() {
    const submitButton = document.querySelector("button[data-testid='issue-create.common.ui.footer.create-button']");
    
    if (!submitButton) {
        console.error("⚠️ Bouton de soumission non trouvé !");
        return;
    }

    console.log("🔍 Bouton détecté :", submitButton);

    // Vérifier si l'événement est déjà attaché pour éviter les doublons
    if (!submitButton.dataset.listenerAdded) {
        submitButton.addEventListener("click", (e) => {
            console.log("📩 Bouton cliqué !");
            const inputs = document.querySelectorAll("textarea, input[type='text']");
            let hasErrors = false;

            inputs.forEach(input => {
                console.log("📝 Vérification de :", input.value);
                if (checkText(input)) {
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                console.log("❌ Erreurs détectées, annulation de la soumission !");
                e.preventDefault();
                e.stopPropagation();
                alert("Des erreurs ont été détectées. Veuillez corriger le format avant de soumettre.");
                return false; // Forcer l'annulation de l'action
            }
        });

        // Marquer le bouton comme écouté
        submitButton.dataset.listenerAdded = "true";
    }
}

// Détecter les changements dans les champs de saisie
document.addEventListener("input", (e) => {
    const input = e.target;

    // Cibler les champs de saisie spécifiques à Jira
    if (input.matches("textarea, input[type='text']")) { // Cible tous les textarea et input de type texte
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => checkText(input), 500);
    }
});



function showError(input, message) {
    const errorBubble = document.getElementById("errorBubble");
    if (!errorBubble) return;

    const alert = document.createElement("div");
    alert.className = "alert";
    alert.style.cssText = `
        position: fixed;
        top: ${errorBubble.offsetTop}px;
        right: ${window.innerWidth - errorBubble.offsetLeft + 10}px;
        background: #ff4444;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        white-space: nowrap;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    `;
    alert.innerText = message;

    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}
function updateErrorBubble(errorCount) {
    const bubble = document.getElementById("errorBubble") || createErrorBubble();
    const icon = document.getElementById("bubbleIcon");
    const text = document.getElementById("errorCount");

    if (errorCount > 0) {
        // Si des erreurs sont détectées
        bubble.style.backgroundColor = "#ff4444";
        bubble.style.borderColor = "#ff0000";
        icon.style.display = "none"; // Masquer l'icône
        text.style.display = "block"; // Afficher le nombre d'erreurs
        text.textContent = `${errorCount}`;
    } else {
        // Si aucune erreur n'est détectée
        bubble.style.backgroundColor = "#fff";
        bubble.style.borderColor = "#00ff00";
        icon.style.display = "block"; // Afficher l'icône
        text.style.display = "none"; // Masquer le nombre d'erreurs
    }
}
function checkInput(input) {
    const text = input.value.trim();

    if (text === "") {
        // Si le champ est vide, revenir à l'état initial (icône par défaut)
        updateErrorBubble(0);
    } else {
        const errorCount = checkText(input); 
        updateErrorBubble(errorCount); 
    }
}
function checkText(input) {
    const text = input.value.trim();
    const lines = text.split('\n'); 
    let errorCount = 0;

    lines.forEach((line, lineIndex) => {
        const errors = validateSegment(line); // Utilisez votre fonction existante pour valider chaque segment

        if (errors.length > 0) {
            errorCount += errors.length; // Compter chaque erreur
            errors.forEach((error, errorIndex) => {
                showError(input, `Ligne ${lineIndex + 1}, Erreur ${errorIndex + 1} : ${error}`);
            });
        }
    });

    return errorCount; // Retourner le nombre total d'erreurs
}
document.addEventListener("input", (e) => {
    const input = e.target;

    // Cibler les champs de saisie spécifiques
    if (input.matches("textarea, input[type='text']")) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => checkInput(input), 500); 
    }
});
browser.runtime.onMessage.addListener((message) => {
    if (message.action === "showBubble") {
        const bubble = document.getElementById("errorBubble") || createErrorBubble();
        bubble.style.display = "flex";
    } 
});

// Contrôle de la priorité
function checkPriority(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.priority) {
        errorCount += 1;
        errorFlags.priority = true;
        alert("Erreur : 'none' ne doit pas être sélectionné pour la priorité !");
    } else if (selectedValue !== "none" && errorFlags.priority) {
        errorCount -= 1;
        errorFlags.priority = false;
    }

    updateErrorBubble();
}

// Contrôle des composants
function checkComponents(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.components) {
        errorCount += 1;
        errorFlags.components = true;
        alert("Erreur : 'none' ne doit pas être sélectionné pour les composants !");
    } else if (selectedValue !== "none" && errorFlags.components) {
        errorCount -= 1;
        errorFlags.components = false;
    }

    updateErrorBubble();
}

// Contrôle de la version
function checkVersion(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "none" && !errorFlags.version) {
        errorCount += 1;
        errorFlags.version = true;
        alert("Erreur : 'none' ne doit pas être sélectionné pour la version !");
    } else if (selectedValue !== "none" && errorFlags.version) {
        errorCount -= 1;
        errorFlags.version = false;
    }

    updateErrorBubble();
}

// Assigner "Unassigned" à l'assignee
function enforceUnassigned() {
    const assignee = document.getElementById("assignee-field");
    if (assignee && assignee.textContent !== "Unassigned") {
        assignee.textContent = "Unassigned";
    }
}

// Observer pour l'assignee
const assigneeObserver = new MutationObserver(enforceUnassigned);
const assigneeElement = document.getElementById("assignee-field");
if (assigneeElement) {
    assigneeObserver.observe(assigneeElement, { childList: true, subtree: true });
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    createErrorBubble();

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

    // Vérifier les valeurs initiales au chargement
    if (prioritySelect && prioritySelect.value === "none") {
        errorCount += 1;
        errorFlags.priority = true;
    }
    if (componentsSelect && componentsSelect.value === "none") {
        errorCount += 1;
        errorFlags.components = true;
    }
    if (versionSelect && versionSelect.value === "none") {
        errorCount += 1;
        errorFlags.version = true;
    }

    updateErrorBubble();
});
// Fonction pour la catégorisation
function categorization() {
    const selectElement = document.getElementById("labels-field");
    if (selectElement && selectElement.value === "D0_sample") {
        if (!errorState.categorization) {
            errorCount += 1;
            errorState.categorization = true;
        }
    } else {
        if (errorState.categorization) {
            errorCount -= 1;
            errorState.categorization = false;
        }
    }
    updateErrorBubble();
}

// Fonction pour afficher toujours "ipn_10"
function variant() {
    const variantElement = document.getElementById("variant");
    if (variantElement) {
        variantElement.textContent = "ipn_10";
    }
}

// Fonction pour sélectionner une ou deux options : "IPN_10 PERF" et/ou "IPN_10 Main"
function variant2() {
    const variant2Element = document.getElementById("variant2");
    if (variant2Element) {
        const options = Array.from(variant2Element.options);
        const selectedValues = options
            .filter(option => option.selected)
            .map(option => option.value);

        // Vérifie si au moins une des options est sélectionnée
        const isValid = selectedValues.some(value => value === "IPN_10 PERF" || value === "IPN_10 Main");

        if (!isValid && !errorState.variant2) {
            errorCount += 1;
            errorState.variant2 = true;
        } else if (isValid && errorState.variant2) {
            errorCount -= 1;
            errorState.variant2 = false;
        }
    }
    updateErrorBubble();
}

// Fonction pour vérifier que "ErrorOccurrence" n'est pas "none"
function errorOccurrence() {
    const errorOccurrenceElement = document.getElementById("errorOccurrence");
    if (errorOccurrenceElement && errorOccurrenceElement.value === "none") {
        if (!errorState.errorOccurrence) {
            errorCount += 1;
            errorState.errorOccurrence = true;
        }
    } else {
        if (errorState.errorOccurrence) {
            errorCount -= 1;
            errorState.errorOccurrence = false;
        }
    }
    updateErrorBubble();
}

// Fonction pour vérifier une exigence de texte (exemple : doit commencer par "[TestSuitaName]:")
function otherText(inputElement, prefix) {
    if (inputElement) {
        const text = inputElement.value.trim();
        if (!text.startsWith(prefix)) {
            if (!errorState.otherText) {
                errorCount += 1;
                errorState.otherText = true;
            }
        } else {
            if (errorState.otherText) {
                errorCount -= 1;
                errorState.otherText = false;
            }
        }
    }
    updateErrorBubble();
}

// Fonction pour initialiser les écouteurs d'événements
function initializeEventListeners() {
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

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    variant();
    initializeEventListeners();
    categorization();
    variant2();
    errorOccurrence();
    otherText(document.getElementById("exampleText"), "[TestSuitaName]:");
});


console.log("✅ content.js chargé et injecté !");

createErrorBubble();
updateErrorBubble(0); 
preventTicketSubmission();
  