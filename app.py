from flask import Flask, render_template, jsonify, request, send_file, abort
import os
import json
import time
import feedparser
import requests
import random
import threading
import base64
from datetime import datetime
import re
from urllib.parse import quote

# Import models
from models.database import Database
from models.podcast_parser import PodcastParser
from models.spotify_integration import SpotifyIntegration

# Initialize Flask app
app = Flask(__name__)

# Initialize database
db = Database()

# Initialize podcast parser
podcast_parser = PodcastParser()

# Initialize Spotify integration
spotify_integration = SpotifyIntegration()

# Constants
PODCAST_FEED_URL = "https://omny.fm/shows/the-sublime-weekendmix-turne-edwards/playlists/podcast.rss"
DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "downloads")

# Ensure download directory exists
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

# API Routes
@app.route('/api/episodes', methods=['GET'])
def get_episodes():
    refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if refresh or not db.get_episodes():
        # Fetch episodes from feed
        episodes = podcast_parser.parse_feed(PODCAST_FEED_URL)
        db.save_episodes(episodes)
    else:
        episodes = db.get_episodes()
    
    return jsonify({"episodes": episodes})

@app.route('/api/episodes/<episode_id>', methods=['GET'])
def get_episode(episode_id):
    episode = db.get_episode(episode_id)
    
    if not episode:
        return jsonify({"error": "Episode not found"}), 404
    
    return jsonify({"episode": episode})

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    favorites = db.get_favorites()
    return jsonify({"favorites": favorites})

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    data = request.json
    episode_id = data.get('episodeId')
    
    if not episode_id:
        return jsonify({"error": "Episode ID is required"}), 400
    
    favorites = db.add_favorite(episode_id)
    return jsonify({"success": True, "favorites": favorites})

@app.route('/api/favorites', methods=['DELETE'])
def remove_favorite():
    data = request.json
    episode_id = data.get('episodeId')
    
    if not episode_id:
        return jsonify({"error": "Episode ID is required"}), 400
    
    favorites = db.remove_favorite(episode_id)
    return jsonify({"success": True, "favorites": favorites})

@app.route('/api/favorite-songs', methods=['GET'])
def get_favorite_songs():
    favorite_songs = db.get_favorite_songs()
    return jsonify({"favoriteSongs": favorite_songs})

@app.route('/api/favorite-songs', methods=['POST'])
def add_favorite_song():
    data = request.json
    song = data.get('song')
    
    if not song or not song.get('episodeId') or song.get('timestamp') is None:
        return jsonify({"error": "Song data is incomplete"}), 400
    
    # Add song to database
    song_id = db.add_favorite_song(song)
    
    # Get the saved song
    saved_song = db.get_favorite_song(song_id)
    
    return jsonify({"success": True, "song": saved_song})

@app.route('/api/favorite-songs/<song_id>', methods=['DELETE'])
def remove_favorite_song(song_id):
    success = db.remove_favorite_song(song_id)
    
    if not success:
        return jsonify({"error": "Song not found"}), 404
    
    return jsonify({"success": True})

@app.route('/api/episodes/<episode_id>/download', methods=['POST'])
def download_episode(episode_id):
    episode = db.get_episode(episode_id)
    
    if not episode:
        return jsonify({"error": "Episode not found"}), 404
    
    # Generate task ID
    task_id = f"download_{int(time.time())}_{random.randint(1000, 9999)}"
    
    # Add to downloads
    db.add_download(task_id, episode_id)
    
    # Start download in background
    threading.Thread(target=download_episode_task, args=(task_id, episode)).start()
    
    return jsonify({"success": True, "taskId": task_id})

@app.route('/api/downloads', methods=['GET'])
def get_downloads():
    downloads = db.get_downloads()
    return jsonify({"downloads": downloads})

@app.route('/api/downloads/<task_id>/status', methods=['GET'])
def get_download_status(task_id):
    download = db.get_download(task_id)
    
    if not download:
        return jsonify({"error": "Download not found"}), 404
    
    return jsonify(download)

@app.route('/api/downloads/<task_id>/cancel', methods=['POST'])
def cancel_download(task_id):
    success = db.update_download_status(task_id, 'cancelled')
    
    if not success:
        return jsonify({"error": "Download not found"}), 404
    
    return jsonify({"success": True})

@app.route('/api/downloads/<task_id>', methods=['DELETE'])
def delete_download(task_id):
    download = db.get_download(task_id)
    
    if not download:
        return jsonify({"error": "Download not found"}), 404
    
    # Delete local file if exists
    if download.get('local_path') and os.path.exists(download['local_path']):
        try:
            os.remove(download['local_path'])
        except Exception as e:
            print(f"Error deleting file: {e}")
    
    # Remove from database
    success = db.remove_download(task_id)
    
    return jsonify({"success": success})

@app.route('/api/downloads/<task_id>/file', methods=['GET'])
def get_download_file(task_id):
    download = db.get_download(task_id)
    
    if not download or download.get('status') != 'completed' or not download.get('local_path'):
        return jsonify({"error": "Download file not found"}), 404
    
    if not os.path.exists(download['local_path']):
        return jsonify({"error": "Download file not found"}), 404
    
    return send_file(download['local_path'], as_attachment=False)

@app.route('/api/downloads/all', methods=['POST'])
def download_all_episodes():
    episodes = db.get_episodes()
    
    if not episodes:
        return jsonify({"error": "No episodes found"}), 404
    
    task_ids = []
    
    for episode in episodes:
        # Generate task ID
        task_id = f"download_{int(time.time())}_{random.randint(1000, 9999)}"
        
        # Add to downloads
        db.add_download(task_id, episode['id'])
        
        # Start download in background
        threading.Thread(target=download_episode_task, args=(task_id, episode)).start()
        
        task_ids.append(task_id)
        
        # Small delay to prevent overwhelming the server
        time.sleep(0.1)
    
    return jsonify({"success": True, "taskIds": task_ids})

@app.route('/api/spotify/token', methods=['GET'])
def get_spotify_token():
    token = spotify_integration.get_token()
    
    if not token:
        return jsonify({"error": "Failed to get Spotify token"}), 500
    
    return jsonify(token)

@app.route('/api/spotify/search', methods=['GET'])
def search_spotify():
    query = request.args.get('q')
    
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    try:
        tracks = spotify_integration.search(query)
        return jsonify({"tracks": tracks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/spotify/track/<track_id>', methods=['GET'])
def get_spotify_track(track_id):
    try:
        track = spotify_integration.get_track(track_id)
        return jsonify({"track": track})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Helper functions
def download_episode_task(task_id, episode):
    try:
        # Update status to downloading
        db.update_download_status(task_id, 'downloading', progress=0)
        
        # Get audio URL
        audio_url = episode.get('audioUrl')
        
        if not audio_url:
            raise Exception("Audio URL not found")
        
        # Create filename
        filename = f"{episode['id']}.mp3"
        filepath = os.path.join(DOWNLOAD_DIR, filename)
        
        # Download file with progress updates
        response = requests.get(audio_url, stream=True)
        total_size = int(response.headers.get('content-length', 0))
        
        if total_size == 0:
            raise Exception("Invalid content length")
        
        downloaded = 0
        last_progress = 0
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    # Update progress every 5%
                    progress = int((downloaded / total_size) * 100)
                    if progress >= last_progress + 5:
                        db.update_download_status(task_id, 'downloading', progress=progress)
                        last_progress = progress
                
                # Check if download was cancelled
                download = db.get_download(task_id)
                if download.get('status') == 'cancelled':
                    # Delete partial file
                    f.close()
                    if os.path.exists(filepath):
                        os.remove(filepath)
                    return
        
        # Update status to completed
        db.update_download_status(task_id, 'completed', progress=100, local_path=filepath)
    
    except Exception as e:
        print(f"Download error: {e}")
        db.update_download_status(task_id, 'failed', error=str(e))

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
