import os
import openai
import streamlit as st

# 🔑 Charger la clé API depuis Streamlit Secrets ou les variables d'environnement
api_key = st.secrets.get("openai_api_key", os.getenv("OPENAI_API_KEY"))

if not api_key:
    st.error("❌ Clé API OpenAI manquante. Ajoutez-la dans `secrets.toml` ou comme variable d'environnement.")
    st.stop()

# 🎭 Initialisation du client OpenAI
client = openai.OpenAI(api_key=api_key)

# 🎨 CSS pour améliorer l'affichage des messages
st.markdown("""
<style>
.chat-container {
    max-width: 700px;
    margin: auto;
}
.chat-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}
.user-message {
    background-color: #0078ff;
    color: white;
    padding: 10px;
    border-radius: 10px;
    max-width: 70%;
}
.ai-message {
    background-color: #f1f1f1;
    padding: 10px;
    border-radius: 10px;
    max-width: 70%;
}
</style>
""", unsafe_allow_html=True)

# 🎭 Initialisation de la session
if "messages" not in st.session_state:
    st.session_state.messages = []

# 📢 Affichage du titre
st.title("🤖 Chatbot OpenAI")
st.write("Posez une question et obtenez une réponse instantanée !")

# 💬 Affichage de l'historique des conversations
with st.container():
    for msg in st.session_state.messages:
        role, content = msg["role"], msg["content"]
        if role == "user":
            st.markdown(f'<div class="chat-row" style="justify-content: flex-end;"><div class="user-message">{content}</div></div>', unsafe_allow_html=True)
        else:
            st.markdown(f'<div class="chat-row"><div class="ai-message">{content}</div></div>', unsafe_allow_html=True)

# ✍️ Champ d'entrée utilisateur
user_input = st.text_input("Votre question:", key="user_input")

# 🚀 Fonction pour envoyer un message
def send_message():
    if user_input.strip():
        st.session_state.messages.append({"role": "user", "content": user_input})
        
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=st.session_state.messages
            )
            answer = response.choices[0].message.content
            st.session_state.messages.append({"role": "assistant", "content": answer})
        except Exception as e:
            st.error(f"❌ Erreur lors de la communication avec OpenAI : {e}")

# 🎯 Bouton pour envoyer le message
if st.button("Envoyer"):
    send_message()

# 📜 Script JS pour envoyer avec "Entrée"
st.components.v1.html("""
<script>
const inputBox = window.parent.document.querySelector('input[type="text"]');
if (inputBox) {
    inputBox.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            const submitButton = window.parent.document.querySelector('button');
            if (submitButton) submitButton.click();
        }
    });
}
</script>
""", height=0, width=0)
