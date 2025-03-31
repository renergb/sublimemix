import feedparser
import logging
import os
import json
from datetime import datetime

class PodcastParser:
    """Class voor het parsen van podcast feeds."""
    
    def __init__(self, feed_url, database):
        """Initialiseer de podcast parser."""
        self.feed_url = feed_url
        self.database = database
        self.logger = logging.getLogger(__name__)
    
    def parse_feed(self):
        """Parse de podcast feed en retourneer een lijst met afleveringen."""
        try:
            self.logger.info(f"Parsen van podcast feed: {self.feed_url}")
            feed = feedparser.parse(self.feed_url)
            
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
            
            # Sla episodes op in database
            self.database.save_episodes(episodes)
            
            self.logger.info(f"Succesvol {len(episodes)} afleveringen geparsed")
            return episodes
        except Exception as e:
            self.logger.error(f"Fout bij het parsen van de podcast feed: {e}")
            return []
    
    def get_episodes(self, refresh=False):
        """Haal afleveringen op, vernieuw indien nodig."""
        episodes = self.database.load_episodes()
        
        # Als er geen afleveringen zijn of refresh is True, parse de feed
        if not episodes or refresh:
            episodes = self.parse_feed()
        
        return episodes
    
    def get_episode_by_id(self, episode_id):
        """Haal een specifieke aflevering op basis van ID."""
        episodes = self.get_episodes()
        episode = next((ep for ep in episodes if ep['id'] == episode_id), None)
        return episode
