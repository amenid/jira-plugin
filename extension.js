const vscode = require('vscode');
const path = require('path');

function activate(context) {
    console.log('Extension "streamlit-backend" est maintenant active');

    // Enregistrer la commande pour lancer le backend
    let disposable = vscode.commands.registerCommand('extension.launchBackend', function () {
        // Obtenir le chemin absolu du répertoire de l'extension
        const extensionPath = context.extensionPath;
        const backendPath = path.join(extensionPath, 'backend');
        
        // Créer un terminal VS Code pour exécuter les commandes
        let terminal = vscode.window.createTerminal('Streamlit Backend');
        
        // Naviguer vers le répertoire backend et activer l'environnement virtuel
        terminal.sendText(`cd "${backendPath}"`);
        terminal.sendText(`.venv\\Scripts\\activate`);
        
        // Lancer Streamlit
        terminal.sendText(`streamlit run chatbot.py`);
        
        // Rendre le terminal visible
        terminal.show();
        
        // Informer l'utilisateur
        vscode.window.showInformationMessage('Backend Streamlit démarré dans le terminal');
    });

    context.subscriptions.push(disposable);
    
    // Vous pouvez aussi ajouter une commande pour arrêter le backend si nécessaire
    let stopDisposable = vscode.commands.registerCommand('extension.stopBackend', function () {
        // Trouver le terminal Streamlit s'il existe
        const terminals = vscode.window.terminals;
        const streamlitTerminal = terminals.find(t => t.name === 'Streamlit Backend');
        
        if (streamlitTerminal) {
            streamlitTerminal.dispose(); // Fermer le terminal
            vscode.window.showInformationMessage('Backend Streamlit arrêté');
        } else {
            vscode.window.showWarningMessage('Aucun backend Streamlit en cours d\'exécution trouvé');
        }
    });
    
    context.subscriptions.push(stopDisposable);
}

function deactivate() {
    // Fonction appelée lorsque l'extension est désactivée
    // Vous pouvez arrêter proprement les processus ici si nécessaire
    const terminals = vscode.window.terminals;
    const streamlitTerminal = terminals.find(t => t.name === 'Streamlit Backend');
    
    if (streamlitTerminal) {
        streamlitTerminal.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};