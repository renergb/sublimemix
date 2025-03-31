from flask import Flask, render_template, jsonify, request, send_file, redirect, url_for
import os
import json
import uuid
import time
import feedparser
import requests
from datetime import datetime
import threading
import logging
from dotenv import load_dotenv

# Laad omgevingsvariabelen
load_dotenv()

app = Flask(__name__)

# Configuratie
PODCAST_FEED_URL = "https://omny.fm/shows/the-sublime-weekendmix-turne-edwards/playlists/podcast.rss"
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')
EPISODES_FILE = os.path.join(DATA_DIR, 'episodes.json')
FAVORITES_FILE = os.path.join(DATA_DIR, 'favorites.json')
FAVORITE_SONGS_FILE = os.path.join(DATA_DIR, 'favorite_songs.json')
DOWNLOADS_FILE = os.path.join(DATA_DIR, 'downloads.json')

# Zorg ervoor dat de benodigde mappen bestaan
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Logging configuratie
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(DATA_DIR, 'app.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Actieve downloads bijhouden
active_downloads = {}

# Helper functies
def load_json_file(file_path, default=None):
    """Laad JSON-gegevens uit een bestand, of retourneer standaardwaarde als het bestand niet bestaat."""
    if default is None:
        default = []
    
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return default
    except Exception as e:
        logger.error(f"Fout bij het laden van {file_path}: {e}")
        return default

def save_json_file(file_path, data):
    """Sla JSON-gegevens op in een bestand."""
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Fout bij het opslaan van {file_path}: {e}")
        return False

def parse_podcast_feed():
    """Parse de podcast feed en retourneer een lijst met afleveringen."""
    try:
        feed = feedparser.parse(PODCAST_FEED_URL)
        
        episodes = []
        for i, entry in enumerate(feed.entries):
            # Extract episode details
            episode = {
                'id': str(i + 1),
                'title': entry.title,
                'description': entry.description,
                'date': entry.published,
                'audioUrl': entry.enclosures[0].href if entry.enclosures else None,
                'image': entry.image.href if hasattr(entry, 'image') else None,
                'duration': entry.itunes_duration if hasattr(entry, 'itunes_duration') else None,
            }
            episodes.append(episode)
        
        # Sla episodes op in JSON-bestand
        save_json_file(EPISODES_FILE, episodes)
        
        return episodes
    except Exception as e:
        logger.error(f"Fout bij het parsen van de podcast feed: {e}")
        return []

def get_episodes():
    """Haal afleveringen op, vernieuw indien nodig."""
    episodes = load_json_file(EPISODES_FILE)
    
    # Als er geen afleveringen zijn, parse de feed
    if not episodes:
        episodes = parse_podcast_feed()
    
    return episodes

def get_favorites():
    """Haal favoriete afleveringen op."""
    return load_json_file(FAVORITES_FILE)

def get_favorite_songs():
    """Haal favoriete nummers op."""
    return load_json_file(FAVORITE_SONGS_FILE)

def get_downloads():
    """Haal downloads op."""
    return load_json_file(DOWNLOADS_FILE, default={})

def update_download_status(task_id, status, progress=None, error=None):
    """Update de status van een download."""
    downloads = get_downloads()
    
    if task_id in downloads:
        downloads[task_id]['status'] = status
        
        if progress is not None:
            downloads[task_id]['progress'] = progress
        
        if error is not None:
            downloads[task_id]['error'] = error
        
        downloads[task_id]['updated_at'] = datetime.now().isoformat()
        
        save_json_file(DOWNLOADS_FILE, downloads)
        return True
    
    return False

def download_episode_task(episode_id, task_id):
    """Taak voor het downloaden van een aflevering."""
    try:
        episodes = get_episodes()
        episode = next((ep for ep in episodes if ep['id'] == episode_id), None)
        
        if not episode or not episode.get('audioUrl'):
            update_download_status(task_id, 'failed', error='Aflevering niet gevonden of geen audio URL')
            return
        
        # Update status naar 'downloading'
        update_download_status(task_id, 'downloading', progress=0)
        
        # Download het bestand
        response = requests.get(episode['audioUrl'], stream=True)
        response.raise_for_status()
        
        # Bepaal bestandsgrootte
        total_size = int(response.headers.get('content-length', 0))
        
        # Bepaal bestandsnaam
        filename = f"episode_{episode_id}.mp3"
        filepath = os.path.join(DOWNLOADS_DIR, filename)
        
        # Download het bestand in chunks en update de voortgang
        downloaded = 0
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    progress = int((downloaded / total_size) * 100) if total_size > 0 else 0
                    update_download_status(task_id, 'downloading', progress=progress)
        
        # Update status naar 'completed'
        downloads = get_downloads()
        downloads[task_id]['local_path'] = filepath
        downloads[task_id]['size'] = total_size
        save_json_file(DOWNLOADS_FILE, downloads)
        
        update_download_status(task_id, 'completed', progress=100)
        
    except Exception as e:
        logger.error(f"Fout bij het downloaden van aflevering {episode_id}: {e}")
        update_download_status(task_id, 'failed', error=str(e))

# Routes
@app.route('/')
def index():
    """Render de hoofdpagina."""
    return render_template('index.html')

@app.route('/api/episodes')
def api_episodes():
    """API endpoint voor het ophalen van afleveringen."""
    refresh = request.args.get('refresh', '').lower() == 'true'
    
    if refresh:
        episodes = parse_podcast_feed()
    else:
        episodes = get_episodes()
    
    return jsonify({'episodes': episodes})

@app.route('/api/episodes/<episode_id>')
def api_episode(episode_id):
    """API endpoint voor het ophalen van een specifieke aflevering."""
    episodes = get_episodes()
    episode = next((ep for ep in episodes if ep['id'] == episode_id), None)
    
    if episode:
        return jsonify(episode)
    else:
        return jsonify({'error': 'Aflevering niet gevonden'}), 404

@app.route('/api/favorites', methods=['GET', 'POST', 'DELETE'])
def api_favorites():
    """API endpoint voor het beheren van favorieten."""
    if request.method == 'GET':
        favorites = get_favorites()
        return jsonify({'favorites': favorites})
    
    elif request.method == 'POST':
        data = request.json
        episode_id = data.get('episodeId')
        
        if not episode_id:
            return jsonify({'error': 'Geen episode_id opgegeven'}), 400
        
        favorites = get_favorites()
        
        if episode_id not in favorites:
            favorites.append(episode_id)
            save_json_file(FAVORITES_FILE, favorites)
        
        return jsonify({'success': True, 'favorites': favorites})
    
    elif request.method == 'DELETE':
        data = request.json
        episode_id = data.get('episodeId')
        
        if not episode_id:
            return jsonify({'error': 'Geen episode_id opgegeven'}), 400
        
        favorites = get_favorites()
        
        if episode_id in favorites:
            favorites.remove(episode_id)
            save_json_file(FAVORITES_FILE, favorites)
        
        return jsonify({'success': True, 'favorites': favorites})

@app.route('/api/favorite-songs', methods=['GET', 'POST', 'DELETE'])
def api_favorite_songs():
    """API endpoint voor het beheren van favoriete nummers."""
    if request.method == 'GET':
        favorite_songs = get_favorite_songs()
        return jsonify({'favoriteSongs': favorite_songs})
    
    elif request.method == 'POST':
        data = request.json
        song = data.get('song')
        
        if not song or not isinstance(song, dict):
            return jsonify({'error': 'Geen geldig nummer opgegeven'}), 400
        
        # Zorg ervoor dat het nummer een ID heeft
        if 'id' not in song:
            song['id'] = str(uuid.uuid4())
        
        favorite_songs = get_favorite_songs()
        favorite_songs.append(song)
        save_json_file(FAVORITE_SONGS_FILE, favorite_songs)
        
        return jsonify({'success': True, 'song': song})
    
    elif request.method == 'DELETE':
        data = request.json
        song_id = data.get('songId')
        
        if not song_id:
            return jsonify({'error': 'Geen song_id opgegeven'}), 400
        
        favorite_songs = get_favorite_songs()
        favorite_songs = [song for song in favorite_songs if song.get('id') != song_id]
        save_json_file(FAVORITE_SONGS_FILE, favorite_songs)
        
        return jsonify({'success': True})

@app.route('/api/spotify/search')
def api_spotify_search():
    """API endpoint voor het zoeken naar nummers op Spotify."""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({'error': 'Geen zoekopdracht opgegeven'}), 400
    
    try:
        # Simuleer Spotify API resultaten
        # In een echte implementatie zou je hier de Spotify API aanroepen
        tracks = [
            {
                'id': 'track1',
                'name': f'Resultaat 1 voor {query}',
                'artists': ['Artiest 1', 'Artiest 2'],
                'preview_url': 'https://example.com/preview1.mp3'
            },
            {
                'id': 'track2',
                'name': f'Resultaat 2 voor {query}',
                'artists': ['Artiest 3'],
                'preview_url': 'https://example.com/preview2.mp3'
            },
            {
                'id': 'track3',
                'name': f'Resultaat 3 voor {query}',
                'artists': ['Artiest 4', 'Artiest 5'],
                'preview_url': None
            }
        ]
        
        return jsonify({'tracks': tracks})
    
    except Exception as e:
        logger.error(f"Fout bij het zoeken op Spotify: {e}")
        return jsonify({'error': 'Fout bij het zoeken op Spotify', 'details': str(e)}), 500

@app.route('/api/episodes/<episode_id>/download', methods=['POST'])
def api_download_episode(episode_id):
    """API endpoint voor het downloaden van een aflevering."""
    episodes = get_episodes()
    episode = next((ep for ep in episodes if ep['id'] == episode_id), None)
    
    if not episode:
        return jsonify({'error': 'Aflevering niet gevonden'}), 404
    
    # Genereer een unieke task ID
    task_id = str(uuid.uuid4())
    
    # Sla de download informatie op
    downloads = get_downloads()
    downloads[task_id] = {
        'episode_id': episode_id,
        'episode_title': episode['title'],
        'status': 'pending',
        'progress': 0,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    save_json_file(DOWNLOADS_FILE, downloads)
    
    # Start de download in een aparte thread
    thread = threading.Thread(target=download_episode_task, args=(episode_id, task_id))
    thread.daemon = True
    thread.start()
    
    # Houd de thread bij in active_downloads
    active_downloads[task_id] = thread
    
    return jsonify({
        'success': True,
        'taskId': task_id,
        'episodeId': episode_id
    })

@app.route('/api/downloads/all', methods=['POST'])
def api_download_all_episodes():
    """API endpoint voor het downloaden van alle afleveringen."""
    episodes = get_episodes()
    task_ids = []
    
    for episode in episodes:
        # Genereer een unieke task ID
        task_id = str(uuid.uuid4())
        
        # Sla de download informatie op
        downloads = get_downloads()
        downloads[task_id] = {
            'episode_id': episode['id'],
            'episode_title': episode['title'],
            'status': 'pending',
            'progress': 0,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        save_json_file(DOWNLOADS_FILE, downloads)
        
        # Start de download in een aparte thread
        thread = threading.Thread(target=download_episode_task, args=(episode['id'], task_id))
        thread.daemon = True
        thread.start()
        
        # Houd de thread bij in active_downloads
        active_downloads[task_id] = thread
        
        task_ids.append(task_id)
    
    return jsonify({
        'success': True,
        'taskIds': task_ids
    })

@app.route('/api/downloads/<task_id>/status', methods=['GET'])
def api_download_status(task_id):
    """API endpoint voor het ophalen van de downloadstatus."""
    downloads = get_downloads()
    
    if task_id in downloads:
        return jsonify(downloads[task_id])
    else:
        return jsonify({'error': 'Download niet gevonden'}), 404

@app.route('/api/downloads/<task_id>/cancel', methods=['POST'])
def api_cancel_download(task_id):
    """API endpoint voor het annuleren van een download."""
    downloads = get_downloads()
    
    if task_id in downloads:
        # Update status naar 'cancelled'
        update_download_status(task_id, 'cancelled')
        
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Download niet gevonden'}), 404

@app.route('/api/downloads/<task_id>', methods=['DELETE'])
def api_delete_download(task_id):
    """API endpoint voor het verwijderen van een download."""
    downloads = get_downloads()
    
    if task_id in downloads:
        # Verwijder het gedownloade bestand als het bestaat
        if 'local_path' in downloads[task_id]:
            try:
                os.remove(downloads[task_id]['local_path'])
            except Exception as e:
                logger.error(f"Fout bij het verwijderen van bestand: {e}")
        
        # Verwijder de download uit de lijst
        del downloads[task_id]
        save_json_file(DOWNLOADS_FILE, downloads)
        
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Download niet gevonden'}), 404

@app.route('/api/downloads', methods=['GET'])
def api_downloads():
    """API endpoint voor het ophalen van alle downloads."""
    downloads = get_downloads()
    return jsonify({'downloads': downloads})

@app.route('/api/downloads/<task_id>/file', methods=['GET'])
def api_download_file(task_id):
    """API endpoint voor het downloaden van een gedownload bestand."""
    downloads = get_downloads()
    
    if task_id in downloads and downloads[task_id]['status'] == 'completed' and 'local_path' in downloads[task_id]:
        return send_file(
            downloads[task_id]['local_path'],
            as_attachment=True,
            download_name=os.path.basename(downloads[task_id]['local_path'])
        )
    else:
        return jsonify({'error': 'Bestand niet gevonden of download niet voltooid'}), 404

@app.route('/api/health')
def api_health():
    """API endpoint voor health check."""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    """Handler voor 404 fouten."""
    return jsonify({'error': 'Pagina niet gevonden'}), 404

@app.errorhandler(500)
def server_error(e):
    """Handler voor 500 fouten."""
    logger.error(f"Server error: {e}")
    return jsonify({'error': 'Server error', 'details': str(e)}), 500

# Start de applicatie
if __name__ == '__main__':
    # Zorg ervoor dat we episodes hebben bij het opstarten
    get_episodes()
    
    # Start de applicatie
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
