import feedparser
import requests
import json
from datetime import datetime
import re
from .database import Database

class PodcastFeedParser:
    def __init__(self, feed_url, db):
        """Initialize the podcast feed parser with the feed URL and database connection."""
        self.feed_url = feed_url
        self.db = db
    
    def parse_feed(self):
        """Parse the podcast RSS feed and store episodes in the database."""
        try:
            feed = feedparser.parse(self.feed_url)
            
            if not feed.entries:
                return {"success": False, "message": "No episodes found in feed", "count": 0}
            
            count = 0
            for entry in feed.entries:
                # Extract episode details
                title = entry.title
                description = entry.description if hasattr(entry, 'description') else ""
                
                # Parse publication date
                if hasattr(entry, 'published'):
                    try:
                        pub_date = datetime(*entry.published_parsed[:6]).isoformat()
                    except:
                        pub_date = entry.published
                else:
                    pub_date = datetime.now().isoformat()
                
                # Get audio URL
                audio_url = None
                if hasattr(entry, 'enclosures') and entry.enclosures:
                    for enclosure in entry.enclosures:
                        if enclosure.type and enclosure.type.startswith('audio/'):
                            audio_url = enclosure.href
                            break
                
                # Get duration if available
                duration = 0
                if hasattr(entry, 'itunes_duration'):
                    try:
                        # Handle different duration formats (HH:MM:SS, MM:SS, or seconds)
                        duration_parts = entry.itunes_duration.split(':')
                        if len(duration_parts) == 3:  # HH:MM:SS
                            duration = int(duration_parts[0]) * 3600 + int(duration_parts[1]) * 60 + int(duration_parts[2])
                        elif len(duration_parts) == 2:  # MM:SS
                            duration = int(duration_parts[0]) * 60 + int(duration_parts[1])
                        else:  # Seconds
                            duration = int(entry.itunes_duration)
                    except:
                        duration = 0
                
                # Get image URL if available
                image_url = None
                if hasattr(entry, 'image') and hasattr(entry.image, 'href'):
                    image_url = entry.image.href
                elif hasattr(feed, 'feed') and hasattr(feed.feed, 'image') and hasattr(feed.feed.image, 'href'):
                    image_url = feed.feed.image.href
                
                # Get unique identifier
                guid = entry.id if hasattr(entry, 'id') else audio_url
                
                # Add to database if we have the required fields
                if title and audio_url:
                    episode_id = self.db.add_episode(
                        title=title,
                        description=description,
                        publication_date=pub_date,
                        audio_url=audio_url,
                        duration=duration,
                        image_url=image_url,
                        guid=guid
                    )
                    if episode_id:
                        count += 1
            
            return {"success": True, "message": f"Successfully parsed {count} episodes", "count": count}
        
        except Exception as e:
            return {"success": False, "message": f"Error parsing feed: {str(e)}", "count": 0}
    
    def get_episode_details(self, episode_id):
        """Get detailed information about a specific episode."""
        return self.db.get_episode(episode_id)
    
    @staticmethod
    def estimate_ad_end_time(audio_url):
        """
        Estimate where the advertisement ends in the podcast.
        This is a placeholder function that could be improved with actual audio analysis.
        For now, we'll assume a fixed duration of 30 seconds for ads at the beginning.
        """
        return 30  # Default 30 seconds
    
    @staticmethod
    def extract_episode_number(title):
        """Extract episode number from title if available."""
        match = re.search(r'#(\d+)', title)
        if match:
            return int(match.group(1))
        return None
