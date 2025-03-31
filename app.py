from flask import Flask, jsonify, request, render_template, send_from_directory
import os
import json
import feedparser
import requests
from datetime import datetime
import time
import random

app = Flask(__name__)

# Configuration
RSS_FEED_URL = "https://omny.fm/shows/the-sublime-weekendmix-turne-edwards/playlists/podcast.rss"
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')

# Ensure data and downloads directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Data files
EPISODES_FILE = os.path.join(DATA_DIR, 'episodes.json')
FAVORITES_FILE = os.path.join(DATA_DIR, 'favorites.json')
FAVORITE_SONGS_FILE = os.path.join(DATA_DIR, 'favorite_songs.json')
DOWNLOADS_FILE = os.path.join(DATA_DIR, 'downloads.json')

# Initialize data files if they don't exist
def init_data_files():
    if not os.path.exists(EPISODES_FILE):
        with open(EPISODES_FILE, 'w') as f:
            json.dump({'episodes': []}, f)
    
    if not os.path.exists(FAVORITES_FILE):
        with open(FAVORITES_FILE, 'w') as f:
            json.dump({'favorites': []}, f)
    
    if not os.path.exists(FAVORITE_SONGS_FILE):
        with open(FAVORITE_SONGS_FILE, 'w') as f:
            json.dump({'favoriteSongs': []}, f)
    
    if not os.path.exists(DOWNLOADS_FILE):
        with open(DOWNLOADS_FILE, 'w') as f:
            json.dump({'downloads': []}, f)

# Load episodes from RSS feed
def load_episodes_from_feed():
    try:
        feed = feedparser.parse(RSS_FEED_URL)
        episodes = []
        
        for entry in feed.entries:
            # Extract episode ID from guid
            guid = entry.get('id', '')
            episode_id = guid.split('/')[-1] if guid else str(random.randint(10000, 99999))
            
            # Extract audio URL
            audio_url = None
            for link in entry.get('links', []):
                if link.get('type', '').startswith('audio/'):
                    audio_url = link.get('href')
                    break
            
            # Extract image URL
            image_url = None
            if hasattr(entry, 'image') and hasattr(entry.image, 'href'):
                image_url = entry.image.href
            elif hasattr(feed, 'image') and hasattr(feed.image, 'href'):
                image_url = feed.image.href
            
            # Extract duration
            duration_str = entry.get('itunes_duration', '0:00')
            duration_parts = duration_str.split(':')
            duration = 0
            
            if len(duration_parts) == 3:  # HH:MM:SS
                duration = int(duration_parts[0]) * 3600 + int(duration_parts[1]) * 60 + int(duration_parts[2])
            elif len(duration_parts) == 2:  # MM:SS
                duration = int(duration_parts[0]) * 60 + int(duration_parts[1])
            elif len(duration_parts) == 1:  # SS
                duration = int(duration_parts[0])
            
            # Create episode object
            episode = {
                'id': episode_id,
                'title': entry.get('title', 'Unknown Episode'),
                'description': entry.get('summary', ''),
                'date': entry.get('published', datetime.now().strftime('%a, %d %b %Y %H:%M:%S %z')),
                'audioUrl': audio_url,
                'image': image_url,
                'duration': duration,
                'adDuration': 30  # Assume 30 seconds of ads at the beginning
            }
            
            episodes.append(episode)
        
        # Save episodes to file
        with open(EPISODES_FILE, 'w') as f:
            json.dump({'episodes': episodes}, f)
        
        return episodes
    except Exception as e:
        print(f"Error loading episodes from feed: {e}")
        
        # If file exists, load from file
        if os.path.exists(EPISODES_FILE):
            with open(EPISODES_FILE, 'r') as f:
                data = json.load(f)
                return data.get('episodes', [])
        
        return []

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/episodes')
def get_episodes():
    # Check if episodes file exists and is not empty
    if os.path.exists(EPISODES_FILE):
        with open(EPISODES_FILE, 'r') as f:
            data = json.load(f)
            if data.get('episodes') and len(data.get('episodes')) > 0:
                return jsonify(data)
    
    # Load episodes from feed
    episodes = load_episodes_from_feed()
    return jsonify({'episodes': episodes})

@app.route('/api/episodes/<episode_id>')
def get_episode(episode_id):
    with open(EPISODES_FILE, 'r') as f:
        data = json.load(f)
        episodes = data.get('episodes', [])
        
        for episode in episodes:
            if episode.get('id') == episode_id:
                return jsonify({'episode': episode})
        
        return jsonify({'error': 'Episode not found'}), 404

@app.route('/api/episodes/<episode_id>/download')
def download_episode(episode_id):
    with open(EPISODES_FILE, 'r') as f:
        data = json.load(f)
        episodes = data.get('episodes', [])
        
        for episode in episodes:
            if episode.get('id') == episode_id:
                # Add to downloads
                with open(DOWNLOADS_FILE, 'r') as df:
                    downloads_data = json.load(df)
                    downloads = downloads_data.get('downloads', [])
                    
                    # Check if already downloaded
                    for download in downloads:
                        if download.get('id') == episode_id:
                            return jsonify({'status': 'already_downloaded'})
                    
                    # Add to downloads
                    download = {
                        'id': episode.get('id'),
                        'title': episode.get('title'),
                        'date': episode.get('date'),
                        'image': episode.get('image'),
                        'duration': episode.get('duration'),
                        'status': 'completed',
                        'progress': 100,
                        'localPath': os.path.join(DOWNLOADS_DIR, f"{episode.get('id')}.mp3")
                    }
                    
                    downloads.append(download)
                    
                    with open(DOWNLOADS_FILE, 'w') as df_write:
                        json.dump({'downloads': downloads}, df_write)
                    
                    return jsonify({'status': 'success', 'download': download})
        
        return jsonify({'error': 'Episode not found'}), 404

@app.route('/api/favorites')
def get_favorites():
    if os.path.exists(FAVORITES_FILE):
        with open(FAVORITES_FILE, 'r') as f:
            return jsonify(json.load(f))
    
    return jsonify({'favorites': []})

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    data = request.json
    episode_id = data.get('episodeId')
    
    if not episode_id:
        return jsonify({'error': 'Episode ID is required'}), 400
    
    # Get episode details
    with open(EPISODES_FILE, 'r') as f:
        episodes_data = json.load(f)
        episodes = episodes_data.get('episodes', [])
        
        episode = None
        for ep in episodes:
            if ep.get('id') == episode_id:
                episode = ep
                break
        
        if not episode:
            return jsonify({'error': 'Episode not found'}), 404
    
    # Add to favorites
    with open(FAVORITES_FILE, 'r') as f:
        favorites_data = json.load(f)
        favorites = favorites_data.get('favorites', [])
        
        # Check if already in favorites
        for favorite in favorites:
            if favorite.get('id') == episode_id:
                return jsonify({'status': 'already_favorite'})
        
        favorites.append(episode)
        
        with open(FAVORITES_FILE, 'w') as f_write:
            json.dump({'favorites': favorites}, f_write)
        
        return jsonify({'status': 'success', 'favorite': episode})

@app.route('/api/favorites/<episode_id>', methods=['DELETE'])
def remove_favorite(episode_id):
    with open(FAVORITES_FILE, 'r') as f:
        data = json.load(f)
        favorites = data.get('favorites', [])
        
        new_favorites = [fav for fav in favorites if fav.get('id') != episode_id]
        
        with open(FAVORITES_FILE, 'w') as f_write:
            json.dump({'favorites': new_favorites}, f_write)
        
        return jsonify({'status': 'success'})

@app.route('/api/favorite-songs')
def get_favorite_songs():
    if os.path.exists(FAVORITE_SONGS_FILE):
        with open(FAVORITE_SONGS_FILE, 'r') as f:
            return jsonify(json.load(f))
    
    return jsonify({'favoriteSongs': []})

@app.route('/api/favorite-songs', methods=['POST'])
def add_favorite_song():
    data = request.json
    
    required_fields = ['episodeId', 'timestamp', 'title', 'artist']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Generate ID if not provided
    if 'id' not in data:
        data['id'] = str(int(time.time() * 1000))
    
    # Add to favorite songs
    with open(FAVORITE_SONGS_FILE, 'r') as f:
        favorite_songs_data = json.load(f)
        favorite_songs = favorite_songs_data.get('favoriteSongs', [])
        
        favorite_songs.append(data)
        
        with open(FAVORITE_SONGS_FILE, 'w') as f_write:
            json.dump({'favoriteSongs': favorite_songs}, f_write)
        
        return jsonify({'status': 'success', 'favoriteSong': data})

@app.route('/api/favorite-songs/<song_id>', methods=['DELETE'])
def remove_favorite_song(song_id):
    with open(FAVORITE_SONGS_FILE, 'r') as f:
        data = json.load(f)
        favorite_songs = data.get('favoriteSongs', [])
        
        new_favorite_songs = [song for song in favorite_songs if song.get('id') != song_id]
        
        with open(FAVORITE_SONGS_FILE, 'w') as f_write:
            json.dump({'favoriteSongs': new_favorite_songs}, f_write)
        
        return jsonify({'status': 'success'})

@app.route('/api/downloads')
def get_downloads():
    if os.path.exists(DOWNLOADS_FILE):
        with open(DOWNLOADS_FILE, 'r') as f:
            return jsonify(json.load(f))
    
    return jsonify({'downloads': []})

@app.route('/api/downloads/<episode_id>', methods=['DELETE'])
def remove_download(episode_id):
    with open(DOWNLOADS_FILE, 'r') as f:
        data = json.load(f)
        downloads = data.get('downloads', [])
        
        # Find download to remove
        download_to_remove = None
        for download in downloads:
            if download.get('id') == episode_id:
                download_to_remove = download
                break
        
        if download_to_remove:
            # Remove from downloads list
            new_downloads = [dl for dl in downloads if dl.get('id') != episode_id]
            
            with open(DOWNLOADS_FILE, 'w') as f_write:
                json.dump({'downloads': new_downloads}, f_write)
            
            # Remove file if it exists
            local_path = download_to_remove.get('localPath')
            if local_path and os.path.exists(local_path):
                try:
                    os.remove(local_path)
                except Exception as e:
                    print(f"Error removing file: {e}")
        
        return jsonify({'status': 'success'})

@app.route('/api/spotify/search')
def search_spotify():
    query = request.args.get('q')
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    # Mock Spotify search results
    tracks = [
        {
            'id': '1',
            'name': f'Track matching "{query}"',
            'artists': ['Artist 1', 'Artist 2'],
            'album': {
                'name': 'Album 1',
                'image': '/static/img/default-cover.jpg'
            },
            'preview_url': 'https://p.scdn.co/mp3-preview/sample',
            'external_url': 'https://open.spotify.com/track/sample'
        },
        {
            'id': '2',
            'name': f'Another track for "{query}"',
            'artists': ['Artist 3'],
            'album': {
                'name': 'Album 2',
                'image': '/static/img/default-cover.jpg'
            },
            'preview_url': 'https://p.scdn.co/mp3-preview/sample2',
            'external_url': 'https://open.spotify.com/track/sample2'
        }
    ]
    
    return jsonify({'tracks': tracks})

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# Initialize data files on startup
init_data_files()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
