
import os

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")



import os
import requests
from flask import Flask, jsonify, request, render_template, send_from_directory, send_file
from models.database import Database
from models.podcast_parser import PodcastFeedParser
from models.spotify_integration import SpotifyIntegration
from dotenv import load_dotenv
import threading
import time
import json
from datetime import datetime

# Load environment variables from .env file if it exists
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Initialize database
db = Database()

# Initialize podcast parser with The Sublime Weekendmix RSS feed
PODCAST_FEED_URL = "https://www.omnycontent.com/d/playlist/803f1544-419a-4fea-962b-acdb0133575d/fc3e7e4d-ccec-4eaa-ac4f-ad8800fe0af6/d17ea2a1-6ead-4392-aff0-ad8800fe4119/podcast.rss"
podcast_parser = PodcastFeedParser(PODCAST_FEED_URL, db)

# Initialize Spotify integration with credentials from environment variables
spotify = SpotifyIntegration(
    client_id=os.environ.get('SPOTIFY_CLIENT_ID'),
    client_secret=os.environ.get('SPOTIFY_CLIENT_SECRET')
)

# Create downloads directory if it doesn't exist
DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Dictionary to track download status
download_tasks = {}

# Routes
@app.route('/')
def index():
    """Render the main application page."""
    return render_template('index.html')

@app.route('/api/episodes/add', methods=['POST'])
def add_episode():
    data = request.json
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    required_fields = ['id', 'title', 'audio_url']
    for field in required_fields:
        if field not in data:
            return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

    db.add_episode(
        id=data['id'],
        title=data['title'],
        description=data.get('description', ''),
        publication_date=data.get('publication_date', ''),
        audio_url=data['audio_url'],
        image_url=data.get('image_url', ''),
        duration=data.get('duration', 0)
    )

    return jsonify({"success": True, "message": "Episode added/updated"})

# API Endpoints
@app.route('/api/episodes', methods=['GET'])
def get_episodes():
    """Get all episodes."""
    episodes = db.get_all_episodes()
    return jsonify({"success": True, "episodes": episodes})

@app.route('/api/episodes/refresh', methods=['GET'])
def refresh_episodes():
    parsed = podcast_parser.parse_feed()
    print("=== Parsed RSS result ===")
    print(parsed)

    if not parsed.get('success'):
        return jsonify({"success": False, "message": "Failed to parse RSS feed", "details": parsed}), 500

            return jsonify({"success": False, "message": "Failed to parse RSS feed"}), 500

    new_count = 0
    for item in parsed.get('episodes', []):
        # Check required fields
        if not all(k in item for k in ('id', 'title', 'audio_url')):
            continue

        db.add_episode(
            id=item['id'],
            title=item['title'],
            description=item.get('description', ''),
            publication_date=item.get('publication_date', ''),
            audio_url=item['audio_url'],
            image_url=item.get('image_url', ''),
            duration=item.get('duration', 0)
        )
        new_count += 1

    return jsonify({"success": True, "message": f"{new_count} episodes added or updated"})

@app.route('/api/episodes/<int:episode_id>', methods=['GET'])
def get_episode(episode_id):
    """Get a specific episode by ID."""
    episode = db.get_episode(episode_id)
    if episode:
        # Check if it's a favorite
        episode['is_favorite'] = db.is_episode_favorite(episode_id)
        return jsonify({"success": True, "episode": episode})
    return jsonify({"success": False, "message": "Episode not found"}), 404

@app.route('/api/episodes/random', methods=['GET'])
def get_random_episode():
    """Get a random episode."""
    episodes = db.get_all_episodes()
    if episodes:
        import random
        random_episode = random.choice(episodes)
        random_episode['is_favorite'] = db.is_episode_favorite(random_episode['id'])
        return jsonify({"success": True, "episode": random_episode})
    return jsonify({"success": False, "message": "No episodes available"}), 404

@app.route('/api/favorites/episodes', methods=['GET'])
def get_favorite_episodes():
    """Get all favorite episodes."""
    favorites = db.get_favorite_episodes()
    return jsonify({"success": True, "favorites": favorites})

@app.route('/api/favorites/episodes/<int:episode_id>', methods=['POST'])
def add_favorite_episode(episode_id):
    """Add an episode to favorites."""
    success = db.add_episode_favorite(episode_id)
    if success:
        return jsonify({"success": True, "message": "Episode added to favorites"})
    return jsonify({"success": False, "message": "Episode already in favorites or not found"}), 400

@app.route('/api/favorites/episodes/<int:episode_id>', methods=['DELETE'])
def remove_favorite_episode(episode_id):
    """Remove an episode from favorites."""
    success = db.remove_episode_favorite(episode_id)
    if success:
        return jsonify({"success": True, "message": "Episode removed from favorites"})
    return jsonify({"success": False, "message": "Episode not found in favorites"}), 404

@app.route('/api/favorites/songs', methods=['GET'])
def get_favorite_songs():
    """Get all favorite songs."""
    episode_id = request.args.get('episode_id', type=int)
    favorites = db.get_favorite_songs(episode_id)
    return jsonify({"success": True, "favorites": favorites})

@app.route('/api/favorites/songs', methods=['POST'])
def add_favorite_song():
    """Add a favorite song."""
    data = request.json
    if not data or not all(k in data for k in ('episode_id', 'timestamp', 'song_title', 'artist')):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    song_id = db.add_song_favorite(
        episode_id=data['episode_id'],
        timestamp=data['timestamp'],
        song_title=data['song_title'],
        artist=data['artist'],
        spotify_url=data.get('spotify_url')
    )
    
    return jsonify({"success": True, "message": "Song added to favorites", "song_id": song_id})

@app.route('/api/favorites/songs/<int:song_id>', methods=['PUT'])
def update_favorite_song(song_id):
    """Update a favorite song."""
    data = request.json
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400
    
    success = db.update_song_favorite(song_id, **data)
    if success:
        return jsonify({"success": True, "message": "Song updated successfully"})
    return jsonify({"success": False, "message": "Song not found or update failed"}), 404

@app.route('/api/favorites/songs/<int:song_id>', methods=['DELETE'])
def remove_favorite_song(song_id):
    """Remove a song from favorites."""
    success = db.remove_song_favorite(song_id)
    if success:
        return jsonify({"success": True, "message": "Song removed from favorites"})
    return jsonify({"success": False, "message": "Song not found in favorites"}), 404

@app.route('/api/spotify/search', methods=['GET'])
def search_spotify():
    """Search for a track on Spotify."""
    artist = request.args.get('artist')
    title = request.args.get('title')
    
    if not artist or not title:
        return jsonify({"success": False, "message": "Artist and title are required"}), 400
    
    if not spotify.is_configured():
        return jsonify({
            "success": False, 
            "message": "Spotify integration not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables."
        }), 503
    
    result = spotify.search_track(artist, title)
    return jsonify(result)

@app.route('/api/history', methods=['GET'])
def get_playback_history():
    """Get playback history."""
    limit = request.args.get('limit', default=10, type=int)
    history = db.get_playback_history(limit)
    return jsonify({"success": True, "history": history})

@app.route('/api/history', methods=['POST'])
def add_playback_history():
    """Add to playback history."""
    data = request.json
    if not data or 'episode_id' not in data:
        return jsonify({"success": False, "message": "Episode ID is required"}), 400
    
    history_id = db.add_to_playback_history(
        episode_id=data['episode_id'],
        timestamp=data.get('timestamp', 0)
    )
    
    return jsonify({"success": True, "message": "Added to playback history", "history_id": history_id})

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get application status."""
    episode_count = len(db.get_all_episodes())
    favorite_count = len(db.get_favorite_episodes())
    song_count = len(db.get_favorite_songs())
    
    spotify_status = "Configured" if spotify.is_configured() else "Not configured"
    
    return jsonify({
        "success": True,
        "status": {
            "episodes": episode_count,
            "favorites": favorite_count,
            "songs": song_count,
            "spotify": spotify_status
        }
    })

# Download functionality
@app.route('/api/episodes/<int:episode_id>/download', methods=['GET'])
def download_episode(episode_id):
    """Download a specific episode."""
    episode = db.get_episode(episode_id)
    if not episode:
        return jsonify({"success": False, "message": "Episode not found"}), 404
    
    # Check if file already exists
    filename = f"episode_{episode_id}_{episode['title'].replace(' ', '_')}.mp3"
    safe_filename = ''.join(c for c in filename if c.isalnum() or c in ['_', '-', '.']).rstrip()
    file_path = os.path.join(DOWNLOADS_DIR, safe_filename)
    
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    
    # Start download in background
    task_id = f"download_{episode_id}_{int(time.time())}"
    download_tasks[task_id] = {
        "status": "starting",
        "progress": 0,
        "episode_id": episode_id,
        "filename": safe_filename,
        "start_time": datetime.now().isoformat()
    }
    
    thread = threading.Thread(target=download_file, args=(episode['audio_url'], file_path, task_id))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "success": True, 
        "message": "Download started", 
        "task_id": task_id,
        "status_url": f"/api/downloads/{task_id}/status"
    })

@app.route('/api/downloads/all', methods=['POST'])
def download_all_episodes():
    """Start downloading all episodes."""
    episodes = db.get_all_episodes()
    if not episodes:
        return jsonify({"success": False, "message": "No episodes available"}), 404
    
    # Create a batch download task
    batch_id = f"batch_{int(time.time())}"
    download_tasks[batch_id] = {
        "status": "starting",
        "total_episodes": len(episodes),
        "completed_episodes": 0,
        "failed_episodes": 0,
        "episode_tasks": [],
        "start_time": datetime.now().isoformat()
    }
    
    # Start download thread for batch processing
    thread = threading.Thread(target=process_batch_download, args=(episodes, batch_id))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "success": True, 
        "message": f"Started downloading {len(episodes)} episodes", 
        "batch_id": batch_id,
        "status_url": f"/api/downloads/{batch_id}/status"
    })

@app.route('/api/downloads/<task_id>/status', methods=['GET'])
def get_download_status(task_id):
    """Get status of a download task."""
    if task_id not in download_tasks:
        return jsonify({"success": False, "message": "Download task not found"}), 404
    
    return jsonify({
        "success": True,
        "task": download_tasks[task_id]
    })

@app.route('/api/downloads', methods=['GET'])
def list_downloads():
    """List all downloaded files."""
    files = []
    for filename in os.listdir(DOWNLOADS_DIR):
        if filename.endswith('.mp3'):
            file_path = os.path.join(DOWNLOADS_DIR, filename)
            file_size = os.path.getsize(file_path)
            files.append({
                "filename": filename,
                "size": file_size,
                "size_mb": round(file_size / (1024 * 1024), 2),
                "download_url": f"/api/downloads/files/{filename}"
            })
    
    return jsonify({
        "success": True,
        "files": files
    })

@app.route('/api/downloads/files/<filename>', methods=['GET'])
def get_downloaded_file(filename):
    """Get a downloaded file."""
    return send_from_directory(DOWNLOADS_DIR, filename, as_attachment=True)

def download_file(url, file_path, task_id):
    """Download a file from URL to the specified path."""
    try:
        download_tasks[task_id]["status"] = "downloading"
        
        # Stream download with progress tracking
        response = requests.get(url, stream=True)
        total_size = int(response.headers.get('content-length', 0))
        
        if response.status_code != 200 or total_size == 0:
            download_tasks[task_id]["status"] = "failed"
            download_tasks[task_id]["error"] = f"Failed to download: HTTP {response.status_code}"
            return
        
        downloaded = 0
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = int((downloaded / total_size) * 100)
                        download_tasks[task_id]["progress"] = progress
        
        download_tasks[task_id]["status"] = "completed"
        download_tasks[task_id]["progress"] = 100
        download_tasks[task_id]["file_path"] = file_path
        download_tasks[task_id]["end_time"] = datetime.now().isoformat()
        
    except Exception as e:
        download_tasks[task_id]["status"] = "failed"
        download_tasks[task_id]["error"] = str(e)
        if os.path.exists(file_path):
            os.remove(file_path)

def process_batch_download(episodes, batch_id):
    """Process batch download of multiple episodes."""
    download_tasks[batch_id]["status"] = "in_progress"
    
    for episode in episodes:
        # Create filename for episode
        filename = f"episode_{episode['id']}_{episode['title'].replace(' ', '_')}.mp3"
        safe_filename = ''.join(c for c in filename if c.isalnum() or c in ['_', '-', '.']).rstrip()
        file_path = os.path.join(DOWNLOADS_DIR, safe_filename)
        
        # Create task for this episode
        task_id = f"download_{episode['id']}_{int(time.time())}"
        download_tasks[task_id] = {
            "status": "starting",
            "progress": 0,
            "episode_id": episode['id'],
            "filename": safe_filename,
            "start_time": datetime.now().isoformat(),
            "part_of_batch": batch_id
        }
        
        # Add to batch task list
        download_tasks[batch_id]["episode_tasks"].append(task_id)
        
        # Download file
        try:
            download_file(episode['audio_url'], file_path, task_id)
            if download_tasks[task_id]["status"] == "completed":
                download_tasks[batch_id]["completed_episodes"] += 1
            else:
                download_tasks[batch_id]["failed_episodes"] += 1
        except Exception as e:
            download_tasks[batch_id]["failed_episodes"] += 1
            download_tasks[task_id]["status"] = "failed"
            download_tasks[task_id]["error"] = str(e)
    
    # Update batch status
    if download_tasks[batch_id]["failed_episodes"] == 0:
        download_tasks[batch_id]["status"] = "completed"
    elif download_tasks[batch_id]["completed_episodes"] == 0:
        download_tasks[batch_id]["status"] = "failed"
    else:
        download_tasks[batch_id]["status"] = "partially_completed"
    
    download_tasks[batch_id]["end_time"] = datetime.now().isoformat()

# Run the app
if __name__ == '__main__':
    # Make sure we have episodes in the database
    if not db.get_all_episodes():
        podcast_parser.parse_feed()
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
