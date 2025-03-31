import feedparser
import re
import time
import requests
from datetime import datetime

class PodcastParser:
    """Parser for podcast feeds."""
    
    def __init__(self):
        """Initialize the podcast parser."""
        pass
    
    def parse_feed(self, feed_url):
        """Parse a podcast feed and return episodes."""
        try:
            # Parse feed
            feed = feedparser.parse(feed_url)
            
            if not feed or not feed.entries:
                raise Exception("Failed to parse feed or no entries found")
            
            episodes = []
            
            for i, entry in enumerate(feed.entries):
                # Extract episode data
                episode = self._parse_entry(entry, i)
                
                if episode:
                    episodes.append(episode)
            
            return episodes
        
        except Exception as e:
            print(f"Error parsing feed: {e}")
            return []
    
    def _parse_entry(self, entry, index):
        """Parse a feed entry and return episode data."""
        try:
            # Extract ID from guid or generate one
            episode_id = self._extract_id(entry)
            
            if not episode_id:
                episode_id = f"episode_{index}"
            
            # Extract title
            title = entry.title if hasattr(entry, 'title') else f"Episode {index}"
            
            # Extract date
            date = self._extract_date(entry)
            
            # Extract audio URL
            audio_url = self._extract_audio_url(entry)
            
            # Extract image URL
            image_url = self._extract_image_url(entry)
            
            # Extract duration
            duration = self._extract_duration(entry)
            
            # Extract description
            description = self._extract_description(entry)
            
            return {
                'id': episode_id,
                'title': title,
                'date': date,
                'audioUrl': audio_url,
                'image': image_url,
                'duration': duration,
                'description': description
            }
        
        except Exception as e:
            print(f"Error parsing entry: {e}")
            return None
    
    def _extract_id(self, entry):
        """Extract episode ID from entry."""
        if hasattr(entry, 'id'):
            # Try to extract ID from guid
            guid = entry.id
            
            # Extract ID from URL if possible
            match = re.search(r'([^\/]+)$', guid)
            if match:
                return match.group(1)
            
            return guid
        
        return None
    
    def _extract_date(self, entry):
        """Extract episode date from entry."""
        if hasattr(entry, 'published_parsed'):
            # Convert time tuple to datetime
            dt = datetime(*entry.published_parsed[:6])
            return dt.isoformat()
        
        if hasattr(entry, 'published'):
            return entry.published
        
        return datetime.now().isoformat()
    
    def _extract_audio_url(self, entry):
        """Extract audio URL from entry."""
        # Check for enclosures
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enclosure in entry.enclosures:
                if 'url' in enclosure and enclosure.get('type', '').startswith('audio/'):
                    return enclosure['url']
            
            # If no audio enclosure found, return first enclosure URL
            if 'url' in entry.enclosures[0]:
                return entry.enclosures[0]['url']
        
        # Check for media content
        if hasattr(entry, 'media_content') and entry.media_content:
            for media in entry.media_content:
                if 'url' in media:
                    return media['url']
        
        # Check for links
        if hasattr(entry, 'links'):
            for link in entry.links:
                if link.get('type', '').startswith('audio/') and 'href' in link:
                    return link['href']
        
        # Check for content
        if hasattr(entry, 'content') and entry.content:
            for content in entry.content:
                if 'value' in content:
                    # Try to extract audio URL from HTML
                    match = re.search(r'src=[\'"]([^\'"]+\.mp3)[\'"]', content['value'])
                    if match:
                        return match.group(1)
        
        # Check for summary
        if hasattr(entry, 'summary'):
            # Try to extract audio URL from HTML
            match = re.search(r'src=[\'"]([^\'"]+\.mp3)[\'"]', entry.summary)
            if match:
                return match.group(1)
        
        return None
    
    def _extract_image_url(self, entry):
        """Extract image URL from entry."""
        # Check for image in media content
        if hasattr(entry, 'media_content') and entry.media_content:
            for media in entry.media_content:
                if 'url' in media and media.get('type', '').startswith('image/'):
                    return media['url']
        
        # Check for image in media thumbnail
        if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
            for thumbnail in entry.media_thumbnail:
                if 'url' in thumbnail:
                    return thumbnail['url']
        
        # Check for image in links
        if hasattr(entry, 'links'):
            for link in entry.links:
                if link.get('type', '').startswith('image/') and 'href' in link:
                    return link['href']
        
        # Check for image in content
        if hasattr(entry, 'content') and entry.content:
            for content in entry.content:
                if 'value' in content:
                    # Try to extract image URL from HTML
                    match = re.search(r'src=[\'"]([^\'"]+\.(jpg|jpeg|png|gif))[\'"]', content['value'])
                    if match:
                        return match.group(1)
        
        # Check for image in summary
        if hasattr(entry, 'summary'):
            # Try to extract image URL from HTML
            match = re.search(r'src=[\'"]([^\'"]+\.(jpg|jpeg|png|gif))[\'"]', entry.summary)
            if match:
                return match.group(1)
        
        # Check for image in feed
        if hasattr(entry, 'feed') and hasattr(entry.feed, 'image') and hasattr(entry.feed.image, 'href'):
            return entry.feed.image.href
        
        return None
    
    def _extract_duration(self, entry):
        """Extract episode duration from entry."""
        # Check for itunes duration
        if hasattr(entry, 'itunes_duration'):
            return entry.itunes_duration
        
        # Check for media content duration
        if hasattr(entry, 'media_content') and entry.media_content:
            for media in entry.media_content:
                if 'duration' in media:
                    duration_seconds = int(media['duration'])
                    return self._format_duration(duration_seconds)
        
        return None
    
    def _extract_description(self, entry):
        """Extract episode description from entry."""
        # Check for summary
        if hasattr(entry, 'summary'):
            return entry.summary
        
        # Check for description
        if hasattr(entry, 'description'):
            return entry.description
        
        # Check for content
        if hasattr(entry, 'content') and entry.content:
            for content in entry.content:
                if 'value' in content:
                    return content['value']
        
        return None
    
    def _format_duration(self, seconds):
        """Format duration in seconds to HH:MM:SS."""
        if not seconds:
            return None
        
        try:
            seconds = int(seconds)
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            seconds = seconds % 60
            
            if hours > 0:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            else:
                return f"{minutes}:{seconds:02d}"
        except:
            return None
