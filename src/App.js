import React, { useState } from "react";
import "./App.css";

function App() {
    const [showBubble, setShowBubble] = useState(false);
    const [message, setMessage] = useState(""); // Ajout de l'état message

    const handleClick = async () => {
      try {
          const response = await fetch("http://localhost:5000/message");
          const data = await response.json();
          setMessage(data.message); // Met à jour le message
          setShowBubble(true);
          setTimeout(() => setShowBubble(false), 5000);
      } catch (error) {
          console.error("Erreur de connexion à l'API", error);
      }
  };

    return (
        <div className="popup-container">
            <h2>Mon Extension 🚀</h2>
            <button onClick={handleClick}>Afficher la bulle</button>

            {showBubble && (
                <div className="bubble">
                    ✨ {message} 
                </div>
            )}
        </div>
    );
}

export default App;
