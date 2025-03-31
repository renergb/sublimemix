from flask import Flask, jsonify, request
import os
import json
import uuid
import time
import feedparser
import requests
from datetime import datetime
import threading
import logging

class Database:
    """Database class voor het beheren van gegevens."""
    
    def __init__(self, data_dir):
        """Initialiseer de database."""
        self.data_dir = data_dir
        self.episodes_file = os.path.join(data_dir, 'episodes.json')
        self.favorites_file = os.path.join(data_dir, 'favorites.json')
        self.favorite_songs_file = os.path.join(data_dir, 'favorite_songs.json')
        self.downloads_file = os.path.join(data_dir, 'downloads.json')
        
        # Zorg ervoor dat de data directory bestaat
        os.makedirs(data_dir, exist_ok=True)
    
    def load_episodes(self):
        """Laad afleveringen uit het bestand."""
        return self._load_json_file(self.episodes_file, [])
    
    def save_episodes(self, episodes):
        """Sla afleveringen op in het bestand."""
        return self._save_json_file(self.episodes_file, episodes)
    
    def load_favorites(self):
        """Laad favorieten uit het bestand."""
        return self._load_json_file(self.favorites_file, [])
    
    def save_favorites(self, favorites):
        """Sla favorieten op in het bestand."""
        return self._save_json_file(self.favorites_file, favorites)
    
    def load_favorite_songs(self):
        """Laad favoriete nummers uit het bestand."""
        return self._load_json_file(self.favorite_songs_file, [])
    
    def save_favorite_songs(self, favorite_songs):
        """Sla favoriete nummers op in het bestand."""
        return self._save_json_file(self.favorite_songs_file, favorite_songs)
    
    def load_downloads(self):
        """Laad downloads uit het bestand."""
        return self._load_json_file(self.downloads_file, {})
    
    def save_downloads(self, downloads):
        """Sla downloads op in het bestand."""
        return self._save_json_file(self.downloads_file, downloads)
    
    def _load_json_file(self, file_path, default=None):
        """Laad JSON-gegevens uit een bestand, of retourneer standaardwaarde als het bestand niet bestaat."""
        if default is None:
            default = []
        
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    return json.load(f)
            return default
        except Exception as e:
            logging.error(f"Fout bij het laden van {file_path}: {e}")
            return default
    
    def _save_json_file(self, file_path, data):
        """Sla JSON-gegevens op in een bestand."""
        try:
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            logging.error(f"Fout bij het opslaan van {file_path}: {e}")
            return False
