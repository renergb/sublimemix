// Spotify Integration for Sublime Weekendmix Jukebox

// Global variables
let spotifyToken = null;
let spotifyTokenExpiry = null;

// Initialize Spotify integration
async function initSpotify() {
    // Check if we have a valid token
    if (!isSpotifyTokenValid()) {
        await refreshSpotifyToken();
    }
}

// Check if Spotify token is valid
function isSpotifyTokenValid() {
    if (!spotifyToken || !spotifyTokenExpiry) {
        return false;
    }
    
    // Check if token is expired (with 5 minute buffer)
    const now = new Date().getTime();
    return now < spotifyTokenExpiry - (5 * 60 * 1000);
}

// Refresh Spotify token
async function refreshSpotifyToken() {
    try {
        const response = await fetch('/api/spotify/token');
        const data = await response.json();
        
        if (data.access_token && data.expires_in) {
            spotifyToken = data.access_token;
            
            // Calculate expiry time
            const expiresIn = data.expires_in * 1000; // Convert to milliseconds
            spotifyTokenExpiry = new Date().getTime() + expiresIn;
            
            return true;
        } else {
            throw new Error('Invalid token response');
        }
    } catch (error) {
        console.error('Error refreshing Spotify token:', error);
        return false;
    }
}

// Search Spotify
async function searchSpotify(query) {
    if (!query) return [];
    
    // Ensure we have a valid token
    if (!isSpotifyTokenValid()) {
        const success = await refreshSpotifyToken();
        if (!success) {
            throw new Error('Failed to refresh Spotify token');
        }
    }
    
    try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.tracks && Array.isArray(data.tracks)) {
            return data.tracks;
        } else {
            throw new Error('Invalid search response format');
        }
    } catch (error) {
        console.error('Error searching Spotify:', error);
        throw error;
    }
}

// Get track details from Spotify
async function getSpotifyTrack(trackId) {
    if (!trackId) return null;
    
    // Ensure we have a valid token
    if (!isSpotifyTokenValid()) {
        const success = await refreshSpotifyToken();
        if (!success) {
            throw new Error('Failed to refresh Spotify token');
        }
    }
    
    try {
        const response = await fetch(`/api/spotify/track/${trackId}`);
        const data = await response.json();
        
        if (data.track) {
            return data.track;
        } else {
            throw new Error('Invalid track response format');
        }
    } catch (error) {
        console.error('Error getting Spotify track:', error);
        throw error;
    }
}

// Handle Spotify search results
function handleSpotifySearchResults(results, container) {
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    if (!results || results.length === 0) {
        container.innerHTML = '<p>Geen resultaten gevonden.</p>';
        return;
    }
    
    // Create results HTML
    let html = '';
    
    results.forEach(track => {
        const artists = track.artists.join(', ');
        
        html += `
            <div class="spotify-track" data-id="${track.id}" data-url="${track.external_url || ''}">
                <div class="spotify-track-cover">
                    <img src="${track.image || '/static/img/default-cover.jpg'}" alt="${track.name}">
                </div>
                <div class="spotify-track-info">
                    <h4>${track.name}</h4>
                    <p>${artists}</p>
                </div>
                <div class="spotify-track-actions">
                    ${track.preview_url ? `
                        <button class="btn btn-circle preview-button" data-url="${track.preview_url}" title="Preview">
                            <i class="fas fa-play"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners
    container.querySelectorAll('.spotify-track').forEach(track => {
        track.addEventListener('click', function() {
            // Toggle selected class
            container.querySelectorAll('.spotify-track').forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
            
            // Set title and artist if input fields exist
            const title = this.querySelector('h4').textContent;
            const artist = this.querySelector('p').textContent;
            
            const titleInput = document.getElementById('song-title');
            const artistInput = document.getElementById('song-artist');
            
            if (titleInput) titleInput.value = title;
            if (artistInput) artistInput.value = artist;
        });
    });
    
    // Preview buttons
    container.querySelectorAll('.preview-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const previewUrl = this.dataset.url;
            
            if (previewUrl) {
                // Stop any playing previews
                stopAllPreviews();
                
                // Create audio element
                const audio = new Audio(previewUrl);
                audio.className = 'spotify-preview';
                document.body.appendChild(audio);
                
                // Play preview
                audio.play();
                
                // Update button
                this.innerHTML = '<i class="fas fa-volume-up"></i>';
                this.classList.add('playing');
                
                // Reset button after preview ends
                audio.onended = () => {
                    this.innerHTML = '<i class="fas fa-play"></i>';
                    this.classList.remove('playing');
                    audio.remove();
                };
            }
        });
    });
}

// Stop all playing previews
function stopAllPreviews() {
    // Stop all audio elements with class 'spotify-preview'
    document.querySelectorAll('.spotify-preview').forEach(audio => {
        audio.pause();
        audio.remove();
    });
    
    // Reset all preview buttons
    document.querySelectorAll('.preview-button.playing').forEach(button => {
        button.innerHTML = '<i class="fas fa-play"></i>';
        button.classList.remove('playing');
    });
}

// Export functions
window.searchSpotify = searchSpotify;
window.getSpotifyTrack = getSpotifyTrack;
window.handleSpotifySearchResults = handleSpotifySearchResults;
window.stopAllPreviews = stopAllPreviews;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initSpotify();
});
