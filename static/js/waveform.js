// Waveform Visualization for Sublime Weekendmix Jukebox

// Global variables
let wavesurfer = null;
let songMarkers = [];

// Initialize waveform visualization
function initWaveform() {
    // Create WaveSurfer instance
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#1db954', // Spotify green
        progressColor: '#ffffff',
        cursorColor: '#ff5500', // Orange
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 60,
        barGap: 2,
        responsive: true,
        normalize: true,
        plugins: [
            WaveSurfer.timeline.create({
                container: '#waveform-timeline',
                primaryColor: '#b3b3b3',
                secondaryColor: '#b3b3b3',
                primaryFontColor: '#b3b3b3',
                secondaryFontColor: '#b3b3b3',
                timeInterval: 30,
                primaryLabelInterval: 5,
                secondaryLabelInterval: 1
            }),
            WaveSurfer.markers.create({
                markers: []
            })
        ]
    });

    // Event listeners
    wavesurfer.on('ready', function() {
        // Update duration
        document.getElementById('duration').textContent = formatTime(wavesurfer.getDuration());
        
        // Set volume
        const volumeSlider = document.getElementById('volume-slider');
        wavesurfer.setVolume(volumeSlider.value / 100);
        
        // Enable play button
        document.getElementById('play-button').disabled = false;
    });

    wavesurfer.on('play', function() {
        isPlaying = true;
        document.getElementById('play-button').innerHTML = '<i class="fas fa-pause"></i>';
    });

    wavesurfer.on('pause', function() {
        isPlaying = false;
        document.getElementById('play-button').innerHTML = '<i class="fas fa-play"></i>';
    });

    wavesurfer.on('audioprocess', function() {
        // Update current time
        document.getElementById('current-time').textContent = formatTime(wavesurfer.getCurrentTime());
        
        // Update progress bar
        const progress = (wavesurfer.getCurrentTime() / wavesurfer.getDuration()) * 100;
        document.getElementById('progress').style.width = `${progress}%`;
    });

    wavesurfer.on('finish', function() {
        // Play next episode if continuous play is enabled
        if (isContinuous) {
            playNextEpisode();
        } else {
            isPlaying = false;
            document.getElementById('play-button').innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    wavesurfer.on('error', function(err) {
        console.error('WaveSurfer error:', err);
        alert('Fout bij het laden van audio. Probeer het later opnieuw.');
    });
}

// Song Marker Functions
function initSongMarkerModal() {
    const modal = document.getElementById('song-marker-modal');
    const closeBtn = modal.querySelector('.close');
    const saveBtn = document.getElementById('save-marker-button');
    const cancelBtn = document.getElementById('cancel-marker-button');
    const searchBtn = document.getElementById('search-spotify-button');
    
    // Close modal when clicking close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Save marker
    saveBtn.addEventListener('click', function() {
        const title = document.getElementById('song-title').value;
        const artist = document.getElementById('song-artist').value;
        
        if (!title && !artist) {
            alert('Voer ten minste een titel of artiest in.');
            return;
        }
        
        // Get selected Spotify track
        const selectedTrack = document.querySelector('.spotify-track.selected');
        let spotifyId = null;
        let spotifyUrl = null;
        
        if (selectedTrack) {
            spotifyId = selectedTrack.dataset.id;
            spotifyUrl = selectedTrack.dataset.url;
        }
        
        // Save marker
        if (currentEpisode) {
            const timestamp = wavesurfer.getCurrentTime();
            
            saveSongMarker(
                currentEpisode.id,
                timestamp,
                title,
                artist,
                spotifyId,
                spotifyUrl
            ).then(song => {
                if (song) {
                    // Close modal
                    modal.style.display = 'none';
                    
                    // Reset form
                    document.getElementById('song-title').value = '';
                    document.getElementById('song-artist').value = '';
                    document.getElementById('spotify-results').innerHTML = '';
                    document.getElementById('spotify-results').style.display = 'none';
                }
            });
        }
    });
    
    // Cancel
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Search Spotify
    searchBtn.addEventListener('click', function() {
        const title = document.getElementById('song-title').value;
        const artist = document.getElementById('song-artist').value;
        
        if (!title && !artist) {
            alert('Voer ten minste een titel of artiest in om te zoeken.');
            return;
        }
        
        // Build search query
        let query = '';
        
        if (title) {
            query += `track:${title} `;
        }
        
        if (artist) {
            query += `artist:${artist}`;
        }
        
        // Search Spotify
        searchSpotify(query.trim());
    });
}

function openSongMarkerModal() {
    if (!currentEpisode || !wavesurfer) return;
    
    const modal = document.getElementById('song-marker-modal');
    const timestamp = wavesurfer.getCurrentTime();
    
    // Set timestamp
    document.getElementById('marker-timestamp').textContent = formatTime(timestamp);
    
    // Reset form
    document.getElementById('song-title').value = '';
    document.getElementById('song-artist').value = '';
    document.getElementById('spotify-results').innerHTML = '';
    document.getElementById('spotify-results').style.display = 'none';
    
    // Show modal
    modal.style.display = 'flex';
}

function loadSongMarkersForEpisode(episodeId) {
    if (!episodeId || !wavesurfer) return;
    
    // Clear existing markers
    wavesurfer.clearMarkers();
    songMarkers = [];
    
    // Get song markers for this episode
    const episodeSongs = favoriteSongs.filter(song => song.episodeId === episodeId);
    
    if (episodeSongs.length === 0) return;
    
    // Add markers to waveform
    episodeSongs.forEach(song => {
        addSongMarkerToWaveform(song);
    });
}

function addSongMarkerToWaveform(song) {
    if (!song || !song.timestamp || !wavesurfer) return;
    
    // Add to song markers array
    songMarkers.push(song);
    
    // Create marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'song-marker';
    markerElement.dataset.id = song.id;
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'song-marker-tooltip';
    tooltip.textContent = `${song.title} - ${song.artist}`;
    
    markerElement.appendChild(tooltip);
    
    // Add marker to waveform
    const marker = wavesurfer.addMarker({
        time: song.timestamp,
        color: '#ff5500', // Orange
        position: 'top',
        draggable: false,
        label: '',
        id: song.id
    });
    
    // Add marker element to DOM
    document.getElementById('song-markers').appendChild(markerElement);
    
    // Position marker element
    const duration = wavesurfer.getDuration();
    if (duration) {
        const position = (song.timestamp / duration) * 100;
        markerElement.style.left = `${position}%`;
    }
    
    // Add click event to marker element
    markerElement.addEventListener('click', function() {
        // Seek to marker position
        wavesurfer.seekTo(song.timestamp / wavesurfer.getDuration());
        
        // Show song info
        showSongInfo(song);
    });
}

function showSongInfo(song) {
    if (!song) return;
    
    // Create or get song info element
    let songInfo = document.getElementById('current-song-info');
    
    if (!songInfo) {
        songInfo = document.createElement('div');
        songInfo.id = 'current-song-info';
        songInfo.className = 'current-song-info';
        
        // Add to player container
        document.querySelector('.player-container').appendChild(songInfo);
    }
    
    // Set content
    songInfo.innerHTML = `
        <div class="song-info-content">
            <h4>${song.title || 'Onbekende titel'}</h4>
            <p>${song.artist || 'Onbekende artiest'}</p>
            ${song.spotifyUrl ? `
                <a href="${song.spotifyUrl}" target="_blank" class="btn btn-primary btn-sm">
                    <i class="fab fa-spotify"></i> Open in Spotify
                </a>
            ` : ''}
        </div>
        <button class="close-song-info">×</button>
    `;
    
    // Show song info
    songInfo.style.display = 'flex';
    
    // Add close button event
    songInfo.querySelector('.close-song-info').addEventListener('click', function() {
        songInfo.style.display = 'none';
    });
    
    // Auto hide after 5 seconds
    setTimeout(function() {
        songInfo.style.display = 'none';
    }, 5000);
}

// Spotify Functions
async function searchSpotify(query) {
    if (!query) return;
    
    const resultsContainer = document.getElementById('spotify-results');
    resultsContainer.innerHTML = '<p>Zoeken...</p>';
    resultsContainer.style.display = 'block';
    
    try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.tracks && Array.isArray(data.tracks)) {
            if (data.tracks.length === 0) {
                resultsContainer.innerHTML = '<p>Geen resultaten gevonden.</p>';
                return;
            }
            
            let html = '';
            
            data.tracks.forEach(track => {
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
            
            resultsContainer.innerHTML = html;
            
            // Add event listeners
            resultsContainer.querySelectorAll('.spotify-track').forEach(track => {
                track.addEventListener('click', function() {
                    // Toggle selected class
                    resultsContainer.querySelectorAll('.spotify-track').forEach(t => t.classList.remove('selected'));
                    this.classList.add('selected');
                    
                    // Set title and artist
                    const title = this.querySelector('h4').textContent;
                    const artist = this.querySelector('p').textContent;
                    
                    document.getElementById('song-title').value = title;
                    document.getElementById('song-artist').value = artist;
                });
            });
            
            // Preview buttons
            resultsContainer.querySelectorAll('.preview-button').forEach(button => {
                button.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    const previewUrl = this.dataset.url;
                    
                    if (previewUrl) {
                        // Create audio element
                        const audio = new Audio(previewUrl);
                        
                        // Play preview
                        audio.play();
                        
                        // Update button
                        this.innerHTML = '<i class="fas fa-volume-up"></i>';
                        
                        // Reset button after preview ends
                        audio.onended = () => {
                            this.innerHTML = '<i class="fas fa-play"></i>';
                        };
                    }
                });
            });
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error searching Spotify:', error);
        resultsContainer.innerHTML = '<p>Fout bij het zoeken op Spotify. Probeer het later opnieuw.</p>';
    }
}
