import os
import json
import requests
import logging
import threading
from datetime import datetime

class SpotifyIntegration:
    """Class voor Spotify integratie."""
    
    def __init__(self, client_id=None, client_secret=None):
        """Initialiseer de Spotify integratie."""
        self.client_id = client_id or os.environ.get('SPOTIFY_CLIENT_ID')
        self.client_secret = client_secret or os.environ.get('SPOTIFY_CLIENT_SECRET')
        self.access_token = None
        self.token_expiry = None
        self.logger = logging.getLogger(__name__)
    
    def authenticate(self):
        """Authenticeer met de Spotify API."""
        if not self.client_id or not self.client_secret:
            self.logger.warning("Spotify client ID of client secret niet geconfigureerd")
            return False
        
        try:
            auth_url = 'https://accounts.spotify.com/api/token'
            auth_response = requests.post(auth_url, {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
            })
            auth_response.raise_for_status()
            
            auth_data = auth_response.json()
            self.access_token = auth_data['access_token']
            self.token_expiry = datetime.now().timestamp() + auth_data['expires_in']
            
            return True
        except Exception as e:
            self.logger.error(f"Fout bij authenticatie met Spotify: {e}")
            return False
    
    def ensure_authenticated(self):
        """Zorg ervoor dat we geauthenticeerd zijn."""
        if not self.access_token or (self.token_expiry and datetime.now().timestamp() > self.token_expiry):
            return self.authenticate()
        return True
    
    def search_track(self, query, limit=5):
        """Zoek naar nummers op Spotify."""
        if not self.ensure_authenticated():
            # Simuleer resultaten als authenticatie mislukt
            return self._simulate_search_results(query, limit)
        
        try:
            search_url = 'https://api.spotify.com/v1/search'
            headers = {
                'Authorization': f'Bearer {self.access_token}'
            }
            params = {
                'q': query,
                'type': 'track',
                'limit': limit
            }
            
            response = requests.get(search_url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            tracks = []
            for item in data['tracks']['items']:
                track = {
                    'id': item['id'],
                    'name': item['name'],
                    'artists': [artist['name'] for artist in item['artists']],
                    'album': item['album']['name'],
                    'preview_url': item['preview_url'],
                    'external_url': item['external_urls']['spotify'],
                    'image': item['album']['images'][0]['url'] if item['album']['images'] else None
                }
                tracks.append(track)
            
            return tracks
        except Exception as e:
            self.logger.error(f"Fout bij zoeken op Spotify: {e}")
            return self._simulate_search_results(query, limit)
    
    def _simulate_search_results(self, query, limit=5):
        """Simuleer zoekresultaten als Spotify API niet beschikbaar is."""
        self.logger.warning("Simuleren van Spotify zoekresultaten")
        
        tracks = []
        for i in range(min(limit, 5)):
            track = {
                'id': f'track{i+1}',
                'name': f'Resultaat {i+1} voor {query}',
                'artists': [f'Artiest {i+1}', 'Featuring Artist'] if i % 2 == 0 else [f'Artiest {i+1}'],
                'album': f'Album {i+1}',
                'preview_url': 'https://example.com/preview.mp3' if i < 3 else None,
                'external_url': f'https://open.spotify.com/track/track{i+1}',
                'image': 'https://example.com/album_cover.jpg'
            }
            tracks.append(track)
        
        return tracks
