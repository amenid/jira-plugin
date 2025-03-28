import streamlit as st

print("Vérification des secrets...")
try:
    print(f"openai_api_key: {st.secrets['openai_api_key']}")
except Exception as e:
    print(f"Erreur : {e}")
