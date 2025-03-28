import streamlit as st
from dataclasses import dataclass
from typing import Literal
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_openai import ChatOpenAI
from langchain.callbacks import get_openai_callback
import os

# Configuration des secrets et chemins
os.environ["OPENAI_API_KEY"] = st.secrets["openai_api_key"]
STATIC_PATH = os.path.join(os.path.dirname(__file__), "static")

@dataclass
class Message:
    """Class for keeping track of a chat message."""
    origin: Literal["human", "ai"]
    message: str

def load_css():
    css_file = os.path.join(STATIC_PATH, "styles.css")
    with open(css_file, "r") as f:
        css = f"<style>{f.read()}</style>"
        st.markdown(css, unsafe_allow_html=True)

def initialize_session_state():
    if "history" not in st.session_state:
        st.session_state.history = []
    
    if "conversation" not in st.session_state:
        llm = ChatOpenAI(
            temperature=0,
            model_name="gpt-3.5-turbo-0125"
        )
        
        st.session_state.conversation = RunnableWithMessageHistory(
            llm,
            lambda session_id: ChatMessageHistory(),
            input_messages_key="input",
            history_messages_key="history"
        )

def on_click_callback():
    with get_openai_callback() as cb:
        human_prompt = st.session_state.human_prompt
        
        response = st.session_state.conversation.invoke(
            {"input": human_prompt},
            config={"configurable": {"session_id": "unused"}}
        )
        
        st.session_state.history.append(Message("human", human_prompt))
        st.session_state.history.append(Message("ai", response.content))
        st.session_state.token_count = cb.total_tokens

# Initialisation
load_css()
initialize_session_state()

# Interface utilisateur
st.title("🤖 JIRA Assistant Bot")

with st.container():  # Zone de chat
    for chat in st.session_state.history:
        icon = "ai_icon.png" if chat.origin == "ai" else "user_icon.png"
        div = f"""
        <div class="chat-row {'row-reverse' if chat.origin == 'human' else ''}">
            <img class="chat-icon" src="app/static/{icon}" width=32 height=32>
            <div class="chat-bubble {'human-bubble' if chat.origin == 'human' else 'ai-bubble'}">
                {chat.message}
            </div>
        </div>
        """
        st.markdown(div, unsafe_allow_html=True)

with st.form("chat-form"):  # Formulaire
    cols = st.columns([6, 1])
    with cols[0]:
        st.text_input(
            "Message",
            label_visibility="collapsed",
            key="human_prompt",
            placeholder="Tapez votre message..."
        )
    with cols[1]:
        st.form_submit_button("Envoyer", on_click=on_click_callback)

# Affichage des statistiques
if "token_count" in st.session_state:
    st.sidebar.caption(f"""
    **Utilisation des tokens**  
    Total: {st.session_state.token_count}
    """)

# Gestion de la touche Entrée
st.components.v1.html("""
<script>
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        parent.document.querySelector('.stFormSubmitButton button').click();
    }
});
</script>
""")