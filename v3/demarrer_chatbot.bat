@echo off
cd %~dp0..\backend
call .venv\Scripts\activate
start /min cmd /c streamlit run chatbot.py
exit