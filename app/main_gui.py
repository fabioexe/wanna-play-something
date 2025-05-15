import tkinter as tk
from tkinter import messagebox
import random
from auth import get_token, authorize_user, get_session
from api import get_top_artists
from config import API_KEY
import os
import json

SESSAO_PATH = ".env"

def salvar_sessao(session_data):
    with open(SESSAO_PATH, "w") as f:
        json.dump(session_data, f)

def carregar_sessao():
    if os.path.exists(SESSAO_PATH):
        with open(SESSAO_PATH) as f:
            return json.load(f)
    return None

def autenticar():
    session = carregar_sessao()
    if session:
        return session

    token = get_token()
    authorize_user(token)
    messagebox.showinfo("Autenticação", "Autorize no navegador e clique OK.")
    session = get_session(token)

    if "session" in session:
        salvar_sessao(session)
        return session
    else:
        messagebox.showerror("Erro", f"Erro na autenticação: {session}")
        return None

def buscar_artistas():
    session = autenticar()
    if not session:
        return

    username = session['session']['name']
    session_key = session['session']['key']

    try:
        artistas = get_top_artists(API_KEY, session_key, username)
        total = len(artistas)

        if total == 0:
            resultado_var.set("⚠️ Nenhum artista encontrado.")
            return

        sorteado_index = random.randint(0, total - 1)
        artista = artistas[sorteado_index]

        mensagem = f"🎧 Que tal ouvir: {artista}\n(🎲 número sorteado: {sorteado_index + 1} de {total})"
        resultado_var.set(mensagem)
    except Exception as e:
        messagebox.showerror("Erro", str(e))


# GUI
root = tk.Tk()
root.title("Random Last.fm Artist Picker")

frame = tk.Frame(root, padx=20, pady=20)
frame.pack()

btn = tk.Button(frame, text="Buscar artistas aleatórios", command=buscar_artistas)
btn.pack()

resultado_var = tk.StringVar()
resultado_label = tk.Label(frame, textvariable=resultado_var, justify="left", anchor="w")
resultado_label.pack()

root.mainloop()
