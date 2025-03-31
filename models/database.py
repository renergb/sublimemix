import json
import os
import time
import uuid
from datetime import datetime

class Database:
    """Database class for storing and retrieving data."""
    
    def __init__(self):
        """Initialize the database."""
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.episodes_file = os.path.join(self.data_dir, "episodes.json")
        self.favorites_file = os.path.join(self.data_dir, "favorites.json")
        self.favorite_songs_file = os.path.join(self.data_dir, "favorite_songs.json")
        self.downloads_file = os.path.join(self.data_dir, "downloads.json")
        
        # Initialize data files if they don't exist
        self._init_data_files()
    
    def _init_data_files(self):
        """Initialize data files if they don't exist."""
        if not os.path.exists(self.episodes_file):
            with open(self.episodes_file, 'w') as f:
                json.dump([], f)
        
        if not os.path.exists(self.favorites_file):
            with open(self.favorites_file, 'w') as f:
                json.dump([], f)
        
        if not os.path.exists(self.favorite_songs_file):
            with open(self.favorite_songs_file, 'w') as f:
                json.dump([], f)
        
        if not os.path.exists(self.downloads_file):
            with open(self.downloads_file, 'w') as f:
                json.dump({}, f)
    
    def get_episodes(self):
        """Get all episodes."""
        try:
            with open(self.episodes_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading episodes: {e}")
            return []
    
    def save_episodes(self, episodes):
        """Save episodes to file."""
        try:
            with open(self.episodes_file, 'w') as f:
                json.dump(episodes, f)
            return True
        except Exception as e:
            print(f"Error saving episodes: {e}")
            return False
    
    def get_episode(self, episode_id):
        """Get a specific episode by ID."""
        episodes = self.get_episodes()
        for episode in episodes:
            if episode.get('id') == episode_id:
                return episode
        return None
    
    def get_favorites(self):
        """Get all favorite episodes."""
        try:
            with open(self.favorites_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading favorites: {e}")
            return []
    
    def add_favorite(self, episode_id):
        """Add an episode to favorites."""
        favorites = self.get_favorites()
        
        if episode_id not in favorites:
            favorites.append(episode_id)
            
            try:
                with open(self.favorites_file, 'w') as f:
                    json.dump(favorites, f)
            except Exception as e:
                print(f"Error saving favorites: {e}")
                return favorites
        
        return favorites
    
    def remove_favorite(self, episode_id):
        """Remove an episode from favorites."""
        favorites = self.get_favorites()
        
        if episode_id in favorites:
            favorites.remove(episode_id)
            
            try:
                with open(self.favorites_file, 'w') as f:
                    json.dump(favorites, f)
            except Exception as e:
                print(f"Error saving favorites: {e}")
                return favorites
        
        return favorites
    
    def get_favorite_songs(self):
        """Get all favorite songs."""
        try:
            with open(self.favorite_songs_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading favorite songs: {e}")
            return []
    
    def add_favorite_song(self, song):
        """Add a song to favorite songs."""
        favorite_songs = self.get_favorite_songs()
        
        # Generate ID if not provided
        if not song.get('id'):
            song['id'] = str(uuid.uuid4())
        
        # Add timestamp if not provided
        if not song.get('createdAt'):
            song['createdAt'] = datetime.now().isoformat()
        
        favorite_songs.append(song)
        
        try:
            with open(self.favorite_songs_file, 'w') as f:
                json.dump(favorite_songs, f)
            return song['id']
        except Exception as e:
            print(f"Error saving favorite songs: {e}")
            return None
    
    def get_favorite_song(self, song_id):
        """Get a specific favorite song by ID."""
        favorite_songs = self.get_favorite_songs()
        for song in favorite_songs:
            if song.get('id') == song_id:
                return song
        return None
    
    def remove_favorite_song(self, song_id):
        """Remove a song from favorite songs."""
        favorite_songs = self.get_favorite_songs()
        
        for i, song in enumerate(favorite_songs):
            if song.get('id') == song_id:
                favorite_songs.pop(i)
                
                try:
                    with open(self.favorite_songs_file, 'w') as f:
                        json.dump(favorite_songs, f)
                    return True
                except Exception as e:
                    print(f"Error saving favorite songs: {e}")
                    return False
        
        return False
    
    def get_downloads(self):
        """Get all downloads."""
        try:
            with open(self.downloads_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading downloads: {e}")
            return {}
    
    def add_download(self, task_id, episode_id):
        """Add a download task."""
        downloads = self.get_downloads()
        
        downloads[task_id] = {
            'episodeId': episode_id,
            'status': 'pending',
            'progress': 0,
            'createdAt': datetime.now().isoformat()
        }
        
        try:
            with open(self.downloads_file, 'w') as f:
                json.dump(downloads, f)
            return True
        except Exception as e:
            print(f"Error saving downloads: {e}")
            return False
    
    def get_download(self, task_id):
        """Get a specific download by task ID."""
        downloads = self.get_downloads()
        return downloads.get(task_id)
    
    def update_download_status(self, task_id, status, progress=None, error=None, local_path=None):
        """Update the status of a download task."""
        downloads = self.get_downloads()
        
        if task_id not in downloads:
            return False
        
        downloads[task_id]['status'] = status
        
        if progress is not None:
            downloads[task_id]['progress'] = progress
        
        if error is not None:
            downloads[task_id]['error'] = error
        
        if local_path is not None:
            downloads[task_id]['local_path'] = local_path
        
        try:
            with open(self.downloads_file, 'w') as f:
                json.dump(downloads, f)
            return True
        except Exception as e:
            print(f"Error saving downloads: {e}")
            return False
    
    def remove_download(self, task_id):
        """Remove a download task."""
        downloads = self.get_downloads()
        
        if task_id in downloads:
            del downloads[task_id]
            
            try:
                with open(self.downloads_file, 'w') as f:
                    json.dump(downloads, f)
                return True
            except Exception as e:
                print(f"Error saving downloads: {e}")
                return False
        
        return False
