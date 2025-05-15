# auth.py

import hashlib
import requests
import webbrowser
from config import API_KEY, API_SECRET

def get_token():
    url = f"http://ws.audioscrobbler.com/2.0/?method=auth.getToken&api_key={API_KEY}&format=json"
    res = requests.get(url)
    return res.json()['token']

def authorize_user(token):
    auth_url = f"http://www.last.fm/api/auth/?api_key={API_KEY}&token={token}"
    print(f"🔗 Autorize o app acessando:\n{auth_url}")
    webbrowser.open(auth_url)

# auth.py
def get_session(token):
    method = "auth.getSession"
    params = {
        "api_key": API_KEY,
        "method": method,
        "token": token
    }

    # Gera a string da assinatura na ordem alfabética das chaves
    sig_raw = ''.join([f"{k}{params[k]}" for k in sorted(params)]) + API_SECRET
    api_sig = hashlib.md5(sig_raw.encode('utf-8')).hexdigest()

    # Adiciona os campos finais
    params["api_sig"] = api_sig
    params["format"] = "json"

    res = requests.get("http://ws.audioscrobbler.com/2.0/", params=params)
    return res.json()
