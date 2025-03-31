import feedparser
import re

def clean_html(raw_html):
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html)

class PodcastFeedParser:
    def __init__(self, feed_url, db):
        self.feed_url = feed_url
        self.db = db

    def parse_feed(self):
        feed = feedparser.parse(self.feed_url)
        episodes = []
        for entry in feed.entries:
            audio_url = None
            if 'enclosures' in entry and entry.enclosures:
                audio_url = entry.enclosures[0].get('href', '')

            if not audio_url:
                continue

            episodes.append({
                'id': hash(entry.title + audio_url),
                'title': entry.title,
                'description': clean_html(getattr(entry, 'summary', '')),
                'publication_date': entry.get('published', ''),
                'audio_url': audio_url,
                'image_url': entry.get('image', {}).get('href', '') if 'image' in entry else '',
                'duration': 0,
            })

        return {
            'success': True,
            'episodes': episodes
        }