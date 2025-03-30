import os
import sqlite3
import json
import threading
from datetime import datetime

class Database:
    """Database class for managing podcast episodes, favorites, and playback history."""
    
    def __init__(self, db_path=None):
        """Initialize the database connection."""
        if db_path is None:
            # Use the directory of this file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(os.path.dirname(current_dir), 'sublime_jukebox.db')
        
        self.db_path = db_path
        self.local = threading.local()
        
        # Initialize database if it doesn't exist
        self._init_db()
    
    def get_connection(self):
        """Get a thread-local database connection."""
        if not hasattr(self.local, 'connection'):
            self.local.connection = sqlite3.connect(self.db_path)
            self.local.connection.row_factory = sqlite3.Row
        return self.local.connection
    
    def _init_db(self):
        """Initialize the database with required tables."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create episodes table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            publication_date TEXT,
            audio_url TEXT NOT NULL,
            image_url TEXT,
            duration INTEGER DEFAULT 0
        )
        ''')
        
        # Create favorites table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            episode_id INTEGER NOT NULL,
            added_date TEXT NOT NULL,
            FOREIGN KEY (episode_id) REFERENCES episodes (id),
            UNIQUE (episode_id)
        )
        ''')
        
        # Create song_favorites table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS song_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            episode_id INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,
            song_title TEXT NOT NULL,
            artist TEXT NOT NULL,
            spotify_url TEXT,
            added_date TEXT NOT NULL,
            FOREIGN KEY (episode_id) REFERENCES episodes (id)
        )
        ''')
        
        # Create playback_history table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS playback_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            episode_id INTEGER NOT NULL,
            timestamp INTEGER DEFAULT 0,
            played_date TEXT NOT NULL,
            FOREIGN KEY (episode_id) REFERENCES episodes (id)
        )
        ''')
        
        conn.commit()
    
    def add_episode(self, episode_data):
        """Add a new episode to the database."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Check if episode already exists
        cursor.execute('SELECT id FROM episodes WHERE id = ?', (episode_data['id'],))
        if cursor.fetchone():
            # Update existing episode
            cursor.execute('''
            UPDATE episodes
            SET title = ?, description = ?, publication_date = ?, audio_url = ?, image_url = ?, duration = ?
            WHERE id = ?
            ''', (
                episode_data['title'],
                episode_data.get('description', ''),
                episode_data.get('publication_date', ''),
                episode_data['audio_url'],
                episode_data.get('image_url', ''),
                episode_data.get('duration', 0),
                episode_data['id']
            ))
        else:
            # Insert new episode
            cursor.execute('''
            INSERT INTO episodes (id, title, description, publication_date, audio_url, image_url, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                episode_data['id'],
                episode_data['title'],
                episode_data.get('description', ''),
                episode_data.get('publication_date', ''),
                episode_data['audio_url'],
                episode_data.get('image_url', ''),
                episode_data.get('duration', 0)
            ))
        
        conn.commit()
        return episode_data['id']
    
    def get_episode(self, episode_id):
        """Get a specific episode by ID."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM episodes WHERE id = ?', (episode_id,))
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
    
    def get_all_episodes(self):
        """Get all episodes."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM episodes ORDER BY publication_date DESC')
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    
    def add_episode_favorite(self, episode_id):
        """Add an episode to favorites."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Check if episode exists
        cursor.execute('SELECT id FROM episodes WHERE id = ?', (episode_id,))
        if not cursor.fetchone():
            return False
        
        # Check if already in favorites
        cursor.execute('SELECT id FROM favorites WHERE episode_id = ?', (episode_id,))
        if cursor.fetchone():
            return False
        
        # Add to favorites
        cursor.execute('''
        INSERT INTO favorites (episode_id, added_date)
        VALUES (?, ?)
        ''', (episode_id, datetime.now().isoformat()))
        
        conn.commit()
        return True
    
    def remove_episode_favorite(self, episode_id):
        """Remove an episode from favorites."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM favorites WHERE episode_id = ?', (episode_id,))
        
        if cursor.rowcount > 0:
            conn.commit()
            return True
        return False
    
    def is_episode_favorite(self, episode_id):
        """Check if an episode is in favorites."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM favorites WHERE episode_id = ?', (episode_id,))
        return cursor.fetchone() is not None
    
    def get_favorite_episodes(self):
        """Get all favorite episodes."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT e.* FROM episodes e
        JOIN favorites f ON e.id = f.episode_id
        ORDER BY f.added_date DESC
        ''')
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    
    def add_song_favorite(self, episode_id, timestamp, song_title, artist, spotify_url=None):
        """Add a favorite song."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Check if episode exists
        cursor.execute('SELECT id FROM episodes WHERE id = ?', (episode_id,))
        if not cursor.fetchone():
            return None
        
        # Add to song favorites
        cursor.execute('''
        INSERT INTO song_favorites (episode_id, timestamp, song_title, artist, spotify_url, added_date)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            episode_id,
            timestamp,
            song_title,
            artist,
            spotify_url,
            datetime.now().isoformat()
        ))
        
        conn.commit()
        return cursor.lastrowid
    
    def update_song_favorite(self, song_id, **kwargs):
        """Update a favorite song."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Check if song exists
        cursor.execute('SELECT id FROM song_favorites WHERE id = ?', (song_id,))
        if not cursor.fetchone():
            return False
        
        # Build update query
        fields = []
        values = []
        
        for key, value in kwargs.items():
            if key in ['song_title', 'artist', 'spotify_url', 'timestamp']:
                fields.append(f"{key} = ?")
                values.append(value)
        
        if not fields:
            return False
        
        values.append(song_id)
        
        query = f"UPDATE song_favorites SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, values)
        
        conn.commit()
        return True
    
    def remove_song_favorite(self, song_id):
        """Remove a song from favorites."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM song_favorites WHERE id = ?', (song_id,))
        
        if cursor.rowcount > 0:
            conn.commit()
            return True
        return False
    
    def get_favorite_songs(self, episode_id=None):
        """Get all favorite songs, optionally filtered by episode."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if episode_id:
            cursor.execute('''
            SELECT sf.*, e.title as episode_title FROM song_favorites sf
            JOIN episodes e ON sf.episode_id = e.id
            WHERE sf.episode_id = ?
            ORDER BY sf.added_date DESC
            ''', (episode_id,))
        else:
            cursor.execute('''
            SELECT sf.*, e.title as episode_title FROM song_favorites sf
            JOIN episodes e ON sf.episode_id = e.id
            ORDER BY sf.added_date DESC
            ''')
        
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    
    def add_to_playback_history(self, episode_id, timestamp=0):
        """Add an episode to playback history."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Check if episode exists
        cursor.execute('SELECT id FROM episodes WHERE id = ?', (episode_id,))
        if not cursor.fetchone():
            return None
        
        # Add to history
        cursor.execute('''
        INSERT INTO playback_history (episode_id, timestamp, played_date)
        VALUES (?, ?, ?)
        ''', (episode_id, timestamp, datetime.now().isoformat()))
        
        conn.commit()
        return cursor.lastrowid
    
    def get_playback_history(self, limit=10):
        """Get playback history."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT ph.*, e.title as episode_title FROM playback_history ph
        JOIN episodes e ON ph.episode_id = e.id
        ORDER BY ph.played_date DESC
        LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    
    def close(self):
        """Close the database connection."""
        if hasattr(self.local, 'connection'):
            self.local.connection.close()
            del self.local.connection
