// Spotify integration functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Spotify search functionality
    initSpotifySearch();
});

// Initialize Spotify search
function initSpotifySearch() {
    console.log('Initializing Spotify search');
    
    // Add event listener to search button
    document.getElementById('search-spotify-button').addEventListener('click', function() {
        searchSpotify();
    });
}

// Search Spotify
function searchSpotify() {
    const title = document.getElementById('song-title').value;
    const artist = document.getElementById('song-artist').value;
    
    if (!title || !artist) {
        alert('Vul een titel en artiest in om te zoeken op Spotify');
        return;
    }
    
    const query = `${title} ${artist}`;
    const resultsContainer = document.getElementById('spotify-results');
    
    // Show loading
    resultsContainer.innerHTML = '<div class="loading">Zoeken op Spotify...</div>';
    
    // Search Spotify
    fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.tracks && data.tracks.length > 0) {
                // Clear results
                resultsContainer.innerHTML = '';
                
                // Add tracks
                data.tracks.forEach(track => {
                    const trackElement = document.createElement('div');
                    trackElement.className = 'spotify-track';
                    trackElement.dataset.id = track.id;
                    trackElement.dataset.url = track.external_url;
                    
                    trackElement.innerHTML = `
                        <img class="spotify-track-image" src="${track.album.image || '/static/img/default-cover.jpg'}" alt="${track.name}">
                        <div class="spotify-track-info">
                            <div class="spotify-track-title">${track.name}</div>
                            <div class="spotify-track-artist">${track.artists.join(', ')}</div>
                        </div>
                        <div class="spotify-track-actions">
                            <button class="preview-track" data-preview="${track.preview_url || ''}">
                                <i class="fas fa-play"></i>
                            </button>
                            <a href="${track.external_url}" target="_blank" class="open-spotify">
                                <i class="fab fa-spotify"></i>
                            </a>
                        </div>
                    `;
                    
                    resultsContainer.appendChild(trackElement);
                    
                    // Add click event
                    trackElement.addEventListener('click', function() {
                        // Deselect all tracks
                        document.querySelectorAll('.spotify-track').forEach(el => {
                            el.classList.remove('selected');
                        });
                        
                        // Select this track
                        this.classList.add('selected');
                    });
                    
                    // Add preview event
                    trackElement.querySelector('.preview-track').addEventListener('click', function(e) {
                        e.stopPropagation();
                        
                        const previewUrl = this.dataset.preview;
                        
                        if (!previewUrl) {
                            alert('Geen preview beschikbaar voor dit nummer');
                            return;
                        }
                        
                        // Create audio element if not exists
                        if (!window.previewAudio) {
                            window.previewAudio = new Audio();
                        }
                        
                        // Stop current preview if playing
                        if (!window.previewAudio.paused) {
                            window.previewAudio.pause();
                            document.querySelectorAll('.preview-track i').forEach(el => {
                                el.className = 'fas fa-play';
                            });
                            
                            // If same track, just stop
                            if (window.previewAudio.src === previewUrl) {
                                return;
                            }
                        }
                        
                        // Play preview
                        window.previewAudio.src = previewUrl;
                        window.previewAudio.play();
                        this.querySelector('i').className = 'fas fa-pause';
                        
                        // Reset icon when preview ends
                        window.previewAudio.onended = function() {
                            document.querySelectorAll('.preview-track i').forEach(el => {
                                el.className = 'fas fa-play';
                            });
                        };
                    });
                });
            } else {
                resultsContainer.innerHTML = '<div class="empty">Geen resultaten gevonden</div>';
            }
        })
        .catch(error => {
            console.error('Error searching Spotify:', error);
            resultsContainer.innerHTML = '<div class="error">Fout bij het zoeken op Spotify. Probeer het later opnieuw.</div>';
        });
}
