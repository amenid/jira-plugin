import streamlit as st
from dataclasses import dataclass
from typing import Literal
from langchain.chains import ConversationChain
from langchain.memory import ConversationSummaryMemory
from langchain_openai import OpenAI
from langchain_community.callbacks.manager import get_openai_callback

import os

# Définition du message avec icônes
@dataclass
class Message:
    """Class for keeping track of a chat message."""
    origin: Literal["human", "ai"]
    message: str

# Charger le CSS
def load_css():
    # Chemin absolu vers le fichier styles.css
    css_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "styles.css")
    
    with open(css_path, "r") as f:
        css = f"<style>{f.read()}</style>"
        st.markdown(css, unsafe_allow_html=True)

# Initialisation de la session
def initialize_session_state():
    if "history" not in st.session_state:
        st.session_state.history = []
    if "token_count" not in st.session_state:
        st.session_state.token_count = 0
    if "conversation" not in st.session_state:
        llm = OpenAI(
            temperature=0,
            openai_api_key=st.secrets["openai_api_key"],
            model_name="gpt-3.5-turbo"
        )
        st.session_state.conversation = ConversationChain(
            llm=llm,
            memory=ConversationSummaryMemory(llm=llm),
        )

# Fonction pour gérer l'envoi du message
def on_click_callback():
    with get_openai_callback() as cb:
        human_prompt = st.session_state.human_prompt
        llm_response = st.session_state.conversation.run(human_prompt)
        
        # Ajouter les messages dans l'historique
        st.session_state.history.append(Message("human", human_prompt))
        st.session_state.history.append(Message("ai", llm_response))
        st.session_state.token_count += cb.total_tokens

# Charger le CSS et initialiser la session
load_css()
initialize_session_state()

# Interface du chatbot
st.title("🤖 QA Bot")

chat_placeholder = st.container()
prompt_placeholder = st.form("chat-form")
credit_card_placeholder = st.empty()

# Affichage du chat avec les icônes
with chat_placeholder:
    for chat in st.session_state.history:
        div = f"""
<div class="chat-row 
    {'' if chat.origin == 'ai' else 'row-reverse'}">
    <img class="chat-icon" src="static/{
        'ai_icon.png' if chat.origin == 'ai' 
                      else 'user_icon.png'}"
         width=32 height=32>
    <div class="chat-bubble
    {'ai-bubble' if chat.origin == 'ai' else 'human-bubble'}">
        &#8203;{chat.message}
    </div>
</div>
        """
        st.markdown(div, unsafe_allow_html=True)
    
    for _ in range(3):
        st.markdown("")

# Formulaire de saisie utilisateur
with prompt_placeholder:
    st.markdown("**Chat**")
    cols = st.columns((6, 1))
    cols[0].text_input(
        "Chat",
        value="Hello bot",
        label_visibility="collapsed",
        key="human_prompt",
    )
    cols[1].form_submit_button(
        "Envoyer", 
        type="primary", 
        on_click=on_click_callback, 
    )

# Affichage des tokens utilisés
credit_card_placeholder.caption(f"""
Utilisation de {st.session_state.token_count} tokens \n
Debug Langchain conversation: 
{st.session_state.conversation.memory.buffer}
""")

# Script pour soumettre avec "Entrée"
st.components.v1.html("""
<script>
const streamlitDoc = window.parent.document;
const buttons = Array.from(streamlitDoc.querySelectorAll('.stButton > button'));
const submitButton = buttons.find(el => el.innerText === 'Envoyer');

streamlitDoc.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        submitButton.click();
    }
});
</script>
""")
