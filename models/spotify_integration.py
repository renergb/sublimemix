import os
import json
import requests
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

class SpotifyIntegration:
    def __init__(self, client_id=None, client_secret=None):
        """
        Initialize Spotify integration.
        If client_id and client_secret are not provided, will try to use environment variables.
        """
        self.client_id = client_id or os.environ.get('SPOTIFY_CLIENT_ID')
        self.client_secret = client_secret or os.environ.get('SPOTIFY_CLIENT_SECRET')
        self.sp = None
        
        # Initialize Spotify client if credentials are available
        if self.client_id and self.client_secret:
            try:
                client_credentials_manager = SpotifyClientCredentials(
                    client_id=self.client_id,
                    client_secret=self.client_secret
                )
                self.sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
            except Exception as e:
                print(f"Error initializing Spotify client: {str(e)}")
    
    def is_configured(self):
        """Check if Spotify integration is properly configured."""
        return self.sp is not None
    
    def search_track(self, artist, title):
        """
        Search for a track on Spotify by artist and title.
        Returns a list of potential matches with their Spotify URLs.
        """
        if not self.is_configured():
            return {"success": False, "message": "Spotify integration not configured", "tracks": []}
        
        try:
            query = f"artist:{artist} track:{title}"
            results = self.sp.search(q=query, type='track', limit=5)
            
            tracks = []
            for item in results['tracks']['items']:
                track_info = {
                    'id': item['id'],
                    'name': item['name'],
                    'artist': item['artists'][0]['name'],
                    'album': item['album']['name'],
                    'url': item['external_urls']['spotify'],
                    'preview_url': item['preview_url'],
                    'image_url': item['album']['images'][0]['url'] if item['album']['images'] else None
                }
                tracks.append(track_info)
            
            return {
                "success": True,
                "message": f"Found {len(tracks)} potential matches",
                "tracks": tracks
            }
        
        except Exception as e:
            return {
                "success": False,
                "message": f"Error searching Spotify: {str(e)}",
                "tracks": []
            }
    
    def get_track_by_id(self, track_id):
        """Get detailed information about a specific track by its Spotify ID."""
        if not self.is_configured():
            return {"success": False, "message": "Spotify integration not configured"}
        
        try:
            track = self.sp.track(track_id)
            
            track_info = {
                'id': track['id'],
                'name': track['name'],
                'artist': track['artists'][0]['name'],
                'album': track['album']['name'],
                'url': track['external_urls']['spotify'],
                'preview_url': track['preview_url'],
                'image_url': track['album']['images'][0]['url'] if track['album']['images'] else None
            }
            
            return {
                "success": True,
                "track": track_info
            }
        
        except Exception as e:
            return {
                "success": False,
                "message": f"Error getting track: {str(e)}"
            }
