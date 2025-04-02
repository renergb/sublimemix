require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Shazam API configuration
const SHAZAM_API_KEY = process.env.SHAZAM_API_KEY || 'your-api-key-here';
const SHAZAM_API_HOST = 'shazam.p.rapidapi.com';

/**
 * Endpoint to search for songs by name
 * GET /api/shazam/search?term=songname
 */
router.get('/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    const options = {
      method: 'GET',
      url: 'https://shazam.p.rapidapi.com/search',
      params: {
        term: term,
        locale: 'nl-NL',
        offset: '0',
        limit: '5'
      },
      headers: {
        'X-RapidAPI-Key': SHAZAM_API_KEY,
        'X-RapidAPI-Host': SHAZAM_API_HOST
      }
    };

    const response = await axios.request(options);
    
    // Format the response to include only the data we need
    const tracks = response.data.tracks?.hits.map(hit => ({
      id: hit.track.key,
      title: hit.track.title,
      artist: hit.track.subtitle,
      coverArt: hit.track.images?.coverart,
      duration: formatDuration(hit.track.duration)
    })) || [];
    
    res.json({ tracks });
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

/**
 * Endpoint to recognize a song from audio
 * POST /api/shazam/recognize
 * Body: { base64Audio: "base64-encoded-audio-data" }
 */
router.post('/recognize', async (req, res) => {
  try {
    const { base64Audio } = req.body;
    
    if (!base64Audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }
    
    // In a real implementation, we would send the audio data to Shazam
    // For this demo, we'll simulate a successful recognition
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response data
    const recognizedSong = {
      id: '12345',
      title: 'Don\'t Stop Believin\'',
      artist: 'Journey',
      coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9a/37/10/9a371074-9e89-b44d-f4c1-1eeeae4df2a6/886443673441.jpg/400x400cc.jpg',
      duration: '4:11'
    };
    
    res.json({ success: true, song: recognizedSong });
  } catch (error) {
    console.error('Error recognizing song:', error);
    res.status(500).json({ error: 'Failed to recognize song' });
  }
});

/**
 * Endpoint to get song details
 * GET /api/shazam/song/:id
 */
router.get('/song/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const options = {
      method: 'GET',
      url: `https://shazam.p.rapidapi.com/songs/get-details`,
      params: {
        key: id,
        locale: 'nl-NL'
      },
      headers: {
        'X-RapidAPI-Key': SHAZAM_API_KEY,
        'X-RapidAPI-Host': SHAZAM_API_HOST
      }
    };

    const response = await axios.request(options);
    
    // Format the response
    const songDetails = {
      id: response.data.key,
      title: response.data.title,
      artist: response.data.subtitle,
      coverArt: response.data.images?.coverart,
      duration: formatDuration(response.data.duration),
      genres: response.data.genres?.primary,
      releaseDate: response.data.releasedate,
      lyrics: response.data.sections?.find(section => section.type === 'LYRICS')?.text || []
    };
    
    res.json({ song: songDetails });
  } catch (error) {
    console.error('Error getting song details:', error);
    res.status(500).json({ error: 'Failed to get song details' });
  }
});

/**
 * Helper function to format duration in seconds to MM:SS format
 */
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = router;
