import { validActivities } from './constants.js';

/**
 * Initialize autocomplete functionality for the summary field
 */
export function initSummaryAutocomplete() {
    // Identifie le champ summary
    const summaryField = document.getElementById('summary') || 
                         document.querySelector('input[name="summary"]') ||
                         document.querySelector('.summary-field');
    
    if (!summaryField) {
        console.error("Champ summary non trouvé");
        return;
    }
    
    // Ajouter un placeholder pour guider l'utilisateur
    summaryField.placeholder = "[SWP-123] [IPNext] [Activity] : Description";
    
    // Ajouter une info-bulle explicative
    summaryField.title = "Format requis: [SWP-123] [IPNext] [Activity] : Description - Utilisez ESPACE pour naviguer entre les sections";
    
    // Variables pour suivre l'état de l'autocomplétion
    let currentSegment = 0; // 0 = id, 1 = IPNext, 2 = activity, 3 = text
    let activityMenu = null;
    
    // Ajout d'un écouteur d'événements pour gérer l'autocomplétion
    summaryField.addEventListener('input', function(e) {
        const cursorPosition = this.selectionStart;
        const text = this.value;
        
        // Détection de la position actuelle dans la chaîne de format
        detectCurrentSegment(text);
        
        // Gestion de l'autocomplétion en fonction du segment actuel
        handleAutocomplete(this, text, cursorPosition);
    });
    
    // Ajout d'un écouteur pour les touches spéciales (Espace, Tab, etc.)
    summaryField.addEventListener('keydown', function(e) {
        // Si l'utilisateur appuie sur Espace
        if (e.key === ' ') {
            const text = this.value;
            const cursorPosition = this.selectionStart;
            
            // Vérifier si nous sommes à la fin d'un segment
            if (isSegmentComplete(text, currentSegment, cursorPosition)) {
                e.preventDefault(); // Empêcher l'espace d'être ajouté
                moveToNextSegment(this, text, cursorPosition);
            }
        }
        
        // Si l'utilisateur appuie sur Tab
        if (e.key === 'Tab') {
            const text = this.value;
            const cursorPosition = this.selectionStart;
            
            // Vérifier si nous sommes dans un segment incomplet
            if (!isSegmentComplete(text, currentSegment, cursorPosition)) {
                e.preventDefault(); // Empêcher le comportement par défaut du Tab
                completeCurrentSegment(this, text, cursorPosition);
            }
        }
    });
    
    // Fonction pour détecter le segment actuel en fonction du texte
    function detectCurrentSegment(text) {
        // Regex pour identifier les segments
        const idRegex = /^\[SWP-\d+\]/;
        const ipNextRegex = /^\[SWP-\d+\]\s+\[IPNext\]/;
        const activityRegex = /^\[SWP-\d+\]\s+\[IPNext\]\s+\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]/;
        const colonRegex = /^\[SWP-\d+\]\s+\[IPNext\]\s+\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]\s*:/;
        
        if (!idRegex.test(text)) {
            currentSegment = 0; // ID manquant
        } else if (!ipNextRegex.test(text)) {
            currentSegment = 1; // IPNext manquant
        } else if (!activityRegex.test(text)) {
            currentSegment = 2; // Activity manquant
        } else if (!colonRegex.test(text)) {
            currentSegment = 3; // Deux-points manquants
        } else {
            currentSegment = 4; // Texte de description
        }
    }
    
    // Fonction pour vérifier si un segment est complet
    function isSegmentComplete(text, segment, position) {
        const segments = parseSegments(text);
        
        switch (segment) {
            case 0: // ID
                return segments.id && text.indexOf(']', 0) === position - 1;
            case 1: // IPNext
                return segments.ipNext && text.indexOf(']', segments.id.length) === position - 1;
            case 2: // Activity
                return segments.activity && text.indexOf(']', segments.id.length + segments.ipNext.length) === position - 1;
            case 3: // Colon
                return text.indexOf(':', 0) === position - 1;
            default:
                return false;
        }
    }
    
    // Fonction pour passer au segment suivant
    function moveToNextSegment(inputField, text, position) {
        let newText = text;
        
        switch (currentSegment) {
            case 0: // Après ID, ajouter espace + [IPNext]
                newText = text + ' [IPNext]';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                currentSegment = 1;
                
                // Ajouter automatiquement le segment suivant avec le crochet ouvrant après [IPNext]
                setTimeout(() => {
                    newText += ' [';
                    inputField.value = newText;
                    inputField.setSelectionRange(newText.length, newText.length);
                    currentSegment = 2;
                    showActivityMenu(inputField, newText.length);
                }, 100);
                break;
                
            case 1: // Après IPNext, ajouter espace + [
                newText = text + ' [';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                currentSegment = 2;
                showActivityMenu(inputField, newText.length);
                break;
                
            case 2: // Après Activity, ajouter espace + :
                newText = text + ' :';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                currentSegment = 3;
                break;
                
            case 3: // Après les deux-points, ajouter espace
                newText = text + ' ';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                currentSegment = 4;
                break;
        }
        
        // Déclencher un événement input pour vérifier la validité
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Fonction pour compléter le segment actuel
    function completeCurrentSegment(inputField, text, position) {
        let newText = text;
        
        switch (currentSegment) {
            case 0: // ID
                if (!text.startsWith('[')) {
                    newText = '[' + text;
                }
                if (!text.includes(']')) {
                    if (text.includes('SWP-')) {
                        // Compléter avec le crochet fermant
                        newText = newText + ']';
                    } else {
                        // Ajouter le préfixe SWP- si manquant
                        newText = newText.replace('[', '[SWP-');
                    }
                }
                break;
                
            case 1: // IPNext
                if (!text.includes('[IPNext]', text.indexOf(']') + 1)) {
                    const idEnd = text.indexOf(']') + 1;
                    newText = text.substring(0, idEnd) + ' [IPNext]';
                }
                break;
                
            case 2: // Activity
                // Géré par la liste déroulante d'activités
                break;
                
            case 3: // Colon
                if (!text.includes(':')) {
                    newText = text + ' :';
                }
                break;
        }
        
        inputField.value = newText;
        inputField.setSelectionRange(newText.length, newText.length);
        
        // Déclencher un événement input pour vérifier la validité
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Fonction pour gérer l'autocomplétion en temps réel
    function handleAutocomplete(inputField, text, position) {
        // Autocomplétion pour le segment ID
        if (currentSegment === 0) {
            // Si l'utilisateur commence à taper, ajouter les crochets si nécessaire
            if (text.length > 0 && !text.startsWith('[')) {
                inputField.value = '[' + text;
                inputField.setSelectionRange(position + 1, position + 1);
            }
            // Si l'utilisateur tape "SWP" sans le tiret, ajouter le tiret
            if (text.includes('SWP') && !text.includes('SWP-')) {
                const newText = text.replace('SWP', 'SWP-');
                inputField.value = newText;
                inputField.setSelectionRange(position + 1, position + 1);
            }
            
            // Si l'utilisateur tape juste un nombre sans SWP, ajouter le préfixe SWP-
            const idContent = text.match(/\[(\d+)/);
            if (idContent) {
                const newText = text.replace('[' + idContent[1], '[SWP-' + idContent[1]);
                inputField.value = newText;
                inputField.setSelectionRange(position + 4, position + 4); // +4 pour "SWP-"
            }
        }
        
        // Autocomplétion pour IPNext
        if (currentSegment === 1) {
            // Si l'utilisateur tape "ip", autocompléter en "IPNext"
            const lastSegment = text.substring(text.indexOf(']') + 1).trim();
            if (lastSegment.startsWith('[i') || lastSegment.startsWith('[I')) {
                const newText = text.substring(0, text.indexOf(']') + 1) + ' [IPNext]';
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                
                // Ajouter automatiquement le segment suivant avec le crochet ouvrant
                setTimeout(() => {
                    inputField.value = newText + ' [';
                    inputField.setSelectionRange(newText.length + 2, newText.length + 2);
                    showActivityMenu(inputField, newText.length + 2);
                    currentSegment = 2;
                }, 100);
            }
        }
        
        // Autocomplétion pour Activity
        if (currentSegment === 2) {
            const segments = parseSegments(text);
            if (segments.partial && !segments.activity) {
                // Si l'utilisateur a commencé à taper une activité
                showActivityMenu(inputField, position);
            }
        }
    }
    
    // Fonction pour afficher le menu d'activités
    function showActivityMenu(inputField, position) {
        // Supprimer le menu existant s'il y en a un
        if (activityMenu) {
            activityMenu.remove();
        }
        
        // Créer un nouveau menu
        activityMenu = document.createElement('div');
        activityMenu.className = 'activity-menu';
        Object.assign(activityMenu.style, {
            position: 'absolute',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: '9999',
            maxHeight: '200px',
            overflowY: 'auto',
            width: '150px'
        });
        
        // Positionner le menu sous le champ de saisie
        const rect = inputField.getBoundingClientRect();
        activityMenu.style.top = (rect.bottom + 5) + 'px';
        activityMenu.style.left = (rect.left + position * 8) + 'px'; // Estimation de la position du curseur
        
        // Ajouter les options d'activité
        validActivities.forEach(activity => {
            const option = document.createElement('div');
            option.textContent = activity;
            Object.assign(option.style, {
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'background 0.2s'
            });
            
            // Effet de survol
            option.addEventListener('mouseenter', () => {
                option.style.background = '#f0f0f0';
            });
            option.addEventListener('mouseleave', () => {
                option.style.background = 'transparent';
            });
            
            // Sélection d'une activité
            option.addEventListener('click', () => {
                const text = inputField.value;
                const segments = parseSegments(text);
                
                // Construire le nouveau texte avec l'activité sélectionnée
                let newText;
                if (segments.partial) {
                    // Remplacer l'activité partielle
                    const activityStart = text.lastIndexOf('[', position);
                    newText = text.substring(0, activityStart) + '[' + activity + ']';
                } else {
                    // Ajouter la nouvelle activité
                    newText = text + activity + ']';
                }
                
                inputField.value = newText;
                inputField.setSelectionRange(newText.length, newText.length);
                activityMenu.remove();
                activityMenu = null;
                
                // Déclencher un événement input pour vérifier la validité
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
            });
            
            activityMenu.appendChild(option);
        });
        
        // Ajouter le menu au document
        document.body.appendChild(activityMenu);
        
        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', function closeMenu(e) {
            if (!activityMenu.contains(e.target) && e.target !== inputField) {
                activityMenu.remove();
                activityMenu = null;
                document.removeEventListener('click', closeMenu);
            }
        });
    }
    
    // Fonction pour analyser les segments du texte
    function parseSegments(text) {
        const result = {
            id: null,
            ipNext: null,
            activity: null,
            partial: null,
            text: null
        };
        
        // Regex pour les différents segments
        const idRegex = /^\[([^\]]+)\]/;
        const ipNextRegex = /\[IPNext\]/;
        const activityRegex = /\[(Nightly|Coverage|Periodic_2h|Weekly|FV|PreInt|PreGate)\]/;
        const partialRegex = /\[([^\]]*)/g;
        
        // Extraire l'ID
        const idMatch = text.match(idRegex);
        if (idMatch) {
            result.id = idMatch[0];
        }
        
        // Extraire IPNext
        const ipNextMatch = text.match(ipNextRegex);
        if (ipNextMatch) {
            result.ipNext = ipNextMatch[0];
        }
        
        // Extraire l'activité
        const activityMatch = text.match(activityRegex);
        if (activityMatch) {
            result.activity = activityMatch[0];
        }
        
        // Extraire une activité partielle (crochets ouverts sans fermeture)
        const allPartials = [...text.matchAll(partialRegex)];
        if (allPartials.length > 0) {
            const lastPartial = allPartials[allPartials.length - 1];
            if (!text.includes(']', lastPartial.index)) {
                result.partial = lastPartial[0];
            }
        }
        
        // Extraire le texte après les deux-points
        const colonIndex = text.indexOf(':');
        if (colonIndex !== -1) {
            result.text = text.substring(colonIndex + 1).trim();
        }
        
        return result;
    }
    
    // Initialisation - vérifier l'état actuel du champ
    if (summaryField.value) {
        detectCurrentSegment(summaryField.value);
    }
    
    console.log("📝 Autocomplétion pour le champ summary initialisée");
}