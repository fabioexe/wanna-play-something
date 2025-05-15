# main.py
import os
import json
from auth import get_token, authorize_user, get_session
from api import get_top_artists
from config import API_KEY
import random

SESSAO_PATH = ".env"

def salvar_sessao(session_data):
    with open(SESSAO_PATH, "w") as f:
        json.dump(session_data, f)
    print("✅ Sessão salva com sucesso!")

def carregar_sessao():
    if os.path.exists(SESSAO_PATH):
        with open(SESSAO_PATH) as f:
            return json.load(f)
    return None

def autenticar():
    session = carregar_sessao()
    if session:
        print(f"🔓 Sessão carregada! Usuário: {session['session']['name']}")
        return session

    print("🔐 Iniciando autenticação...")
    token = get_token()
    authorize_user(token)
    input("📥 Após autorizar no navegador, pressione Enter para continuar...")
    session = get_session(token)

    if "session" in session:
        salvar_sessao(session)
        return session
    else:
        print("❌ Erro na autenticação:", session)
        return None

# Executar
if __name__ == "__main__":
    sessao = autenticar()

    if sessao:
        session_key = sessao["session"]["key"]
        username = sessao["session"]["name"]
        print("🎧 Carregando artistas favoritos...")
        artistas = get_top_artists(API_KEY, session_key, username, limit=20)

        if artistas:
            escolhido = random.choice(artistas)
            print(f"🤘 Que tal ouvir: {escolhido}")
        else:
            print("Nenhum artista encontrado.")