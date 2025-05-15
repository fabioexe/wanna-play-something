# api.py
import requests

API_URL = "http://ws.audioscrobbler.com/2.0/"

def get_total_artists(api_key, session_key, username):
    params = {
        'method': 'user.gettopartists',
        'user': username,
        'api_key': api_key,
        'sk': session_key,
        'format': 'json',
        'limit': 1
    }
    response = requests.get(API_URL, params=params)
    response.raise_for_status()
    data = response.json()
    return int(data['topartists']['@attr']['total'])

def get_top_artists(api_key, session_key, username, limit=None):
    if limit is None:
        limit = get_total_artists(api_key, session_key, username)

    per_page = 1000  # máx permitido é 1000
    artists = []
    pages = (limit // per_page) + 1

    for page in range(1, pages + 1):
        current_limit = min(per_page, limit - len(artists))
        if current_limit <= 0:
            break

        params = {
            'method': 'user.gettopartists',
            'user': username,
            'api_key': api_key,
            'sk': session_key,
            'format': 'json',
            'limit': current_limit,
            'page': page,
            'period': 'overall'
        }
        response = requests.get(API_URL, params=params)
        response.raise_for_status()
        data = response.json()

        artists.extend([a['name'] for a in data['topartists']['artist']])

        if len(artists) >= limit:
            break

    return artists
