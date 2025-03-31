import os
import requests
import base64
import json
import time
from urllib.parse import urlencode

class SpotifyIntegration:
    """Integration with Spotify API."""
    
    def __init__(self):
        """Initialize Spotify integration."""
        self.client_id = os.environ.get('SPOTIFY_CLIENT_ID', '')
        self.client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET', '')
        self.token = None
        self.token_expiry = 0
    
    def get_token(self):
        """Get a valid Spotify API token."""
        # Check if we have a valid token
        if self.token and time.time() < self.token_expiry:
            return {
                'access_token': self.token,
                'expires_in': int(self.token_expiry - time.time())
            }
        
        # Get new token
        try:
            # If client credentials are not set, use demo mode
            if not self.client_id or not self.client_secret:
                print("Spotify credentials not set, using demo mode")
                return self._get_demo_token()
            
            # Prepare request
            auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
            headers = {
                'Authorization': f'Basic {auth_header}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            data = {'grant_type': 'client_credentials'}
            
            # Make request
            response = requests.post('https://accounts.spotify.com/api/token', headers=headers, data=data)
            
            if response.status_code != 200:
                raise Exception(f"Failed to get token: {response.text}")
            
            # Parse response
            token_data = response.json()
            
            # Save token
            self.token = token_data['access_token']
            self.token_expiry = time.time() + token_data['expires_in']
            
            return {
                'access_token': self.token,
                'expires_in': token_data['expires_in']
            }
        
        except Exception as e:
            print(f"Error getting Spotify token: {e}")
            return self._get_demo_token()
    
    def _get_demo_token(self):
        """Get a demo token for testing."""
        # Set a fake token that expires in 1 hour
        self.token = 'demo_token'
        self.token_expiry = time.time() + 3600
        
        return {
            'access_token': self.token,
            'expires_in': 3600
        }
    
    def search(self, query, limit=5):
        """Search for tracks on Spotify."""
        try:
            # Get token
            token_data = self.get_token()
            
            # If in demo mode, return demo results
            if token_data['access_token'] == 'demo_token':
                return self._get_demo_search_results(query)
            
            # Prepare request
            headers = {
                'Authorization': f"Bearer {token_data['access_token']}"
            }
            params = {
                'q': query,
                'type': 'track',
                'limit': limit
            }
            
            # Make request
            response = requests.get(f'https://api.spotify.com/v1/search?{urlencode(params)}', headers=headers)
            
            if response.status_code != 200:
                raise Exception(f"Failed to search: {response.text}")
            
            # Parse response
            search_data = response.json()
            
            # Extract tracks
            tracks = []
            
            if 'tracks' in search_data and 'items' in search_data['tracks']:
                for item in search_data['tracks']['items']:
                    track = {
                        'id': item['id'],
                        'name': item['name'],
                        'artists': [artist['name'] for artist in item['artists']],
                        'album': item['album']['name'],
                        'image': item['album']['images'][0]['url'] if item['album']['images'] else None,
                        'preview_url': item['preview_url'],
                        'external_url': item['external_urls']['spotify'] if 'external_urls' in item and 'spotify' in item['external_urls'] else None
                    }
                    
                    tracks.append(track)
            
            return tracks
        
        except Exception as e:
            print(f"Error searching Spotify: {e}")
            return self._get_demo_search_results(query)
    
    def get_track(self, track_id):
        """Get a track from Spotify by ID."""
        try:
            # Get token
            token_data = self.get_token()
            
            # If in demo mode, return demo track
            if token_data['access_token'] == 'demo_token':
                return self._get_demo_track(track_id)
            
            # Prepare request
            headers = {
                'Authorization': f"Bearer {token_data['access_token']}"
            }
            
            # Make request
            response = requests.get(f'https://api.spotify.com/v1/tracks/{track_id}', headers=headers)
            
            if response.status_code != 200:
                raise Exception(f"Failed to get track: {response.text}")
            
            # Parse response
            track_data = response.json()
            
            # Extract track
            track = {
                'id': track_data['id'],
                'name': track_data['name'],
                'artists': [artist['name'] for artist in track_data['artists']],
                'album': track_data['album']['name'],
                'image': track_data['album']['images'][0]['url'] if track_data['album']['images'] else None,
                'preview_url': track_data['preview_url'],
                'external_url': track_data['external_urls']['spotify'] if 'external_urls' in track_data and 'spotify' in track_data['external_urls'] else None
            }
            
            return track
        
        except Exception as e:
            print(f"Error getting Spotify track: {e}")
            return self._get_demo_track(track_id)
    
    def _get_demo_search_results(self, query):
        """Get demo search results for testing."""
        # Create demo tracks based on query
        tracks = []
        
        # Extract potential artist and title from query
        query_parts = query.lower().split()
        potential_artist = None
        potential_title = None
        
        for part in query_parts:
            if part.startswith('artist:'):
                potential_artist = part.replace('artist:', '')
            elif part.startswith('track:'):
                potential_title = part.replace('track:', '')
        
        # If no specific parts found, use whole query
        if not potential_artist and not potential_title:
            potential_title = query
        
        # Create demo tracks
        for i in range(5):
            artist = potential_artist or f"Demo Artist {i+1}"
            title = potential_title or f"Demo Track {i+1}"
            
            track = {
                'id': f"demo_track_{i+1}",
                'name': title,
                'artists': [artist],
                'album': f"Demo Album {i+1}",
                'image': f"https://via.placeholder.com/300?text={title.replace(' ', '+')}",
                'preview_url': None,
                'external_url': f"https://open.spotify.com/track/demo_track_{i+1}"
            }
            
            tracks.append(track)
        
        return tracks
    
    def _get_demo_track(self, track_id):
        """Get a demo track for testing."""
        return {
            'id': track_id,
            'name': f"Demo Track {track_id}",
            'artists': ["Demo Artist"],
            'album': "Demo Album",
            'image': f"https://via.placeholder.com/300?text=Demo+Track",
            'preview_url': None,
            'external_url': f"https://open.spotify.com/track/{track_id}"
        }
