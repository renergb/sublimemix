/* app.js - Updated with integrated improvements */

// Global variables
let episodes = [];
let favorites = [];
let favoriteSongs = [];
let currentEpisode = null;
let isPlaying = false;
let isRandom = false;
let audioPlayer = new Audio();
let playHistory = [];
let currentIndex = -1;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initializeNavigation();
    initializeErrorHandling();
    initializePlayer();
    loadEpisodes();
    loadFavorites();
    loadFavoriteSongs();
    setupEventListeners();
    
    // Initialize mobile responsiveness
    if (typeof window.layoutManager !== 'undefined') {
        window.layoutManager.init();
    }
    
    // Initialize downloads component
    if (typeof window.downloadsComponent !== 'undefined') {
        window.downloadsComponent.init();
    }
});

// Initialize navigation
function initializeNavigation() {
    // Create router if not already created by navigation_fix.js
    if (typeof window.router === 'undefined') {
        window.router = {
            navigateTo: function(route) {
                window.location.hash = route;
            },
            getCurrentRoute: function() {
                return window.location.hash.substring(1) || 'home';
            }
        };
        
        // Handle hash change
        window.addEventListener('hashchange', handleRouteChange);
        
        // Initial route
        handleRouteChange();
    }
}

// Initialize error handling
function initializeErrorHandling() {
    // Create error handler if not already created by error_handling.js
    if (typeof window.errorHandler === 'undefined') {
        window.errorHandler = {
            showError: function(message, type = 'error', duration = 5000) {
                const container = document.getElementById('error-container');
                if (!container) return;
                
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.textContent = message;
                
                container.appendChild(notification);
                
                setTimeout(() => {
                    notification.classList.add('fade-out');
                    setTimeout(() => {
                        if (container.contains(notification)) {
                            container.removeChild(notification);
                        }
                    }, 300);
                }, duration);
                
                return notification;
            },
            showNotification: function(message, type = 'info', duration = 3000) {
                return this.showError(message, type, duration);
            }
        };
    }
}

// Handle route change
function handleRouteChange() {
    const route = window.location.hash.substring(1) || 'home';
    
    // Update active section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeSection = document.getElementById(`${route}-section`);
    if (activeSection) {
        activeSection.classList.add('active');
    } else {
        // Default to home if section not found
        document.getElementById('home-section').classList.add('active');
    }
    
    // Update active nav item
    document.querySelectorAll('nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`nav a[href="#${route}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Load section-specific content
    if (route === 'episodes') {
        renderEpisodes();
    } else if (route === 'favorites') {
        renderFavorites();
    } else if (route === 'favorite-songs') {
        renderFavoriteSongs();
    } else if (route === 'downloads') {
        renderDownloads();
    } else if (route === 'home') {
        renderHome();
    }
    
    // Close mobile sidebar if open
    if (typeof window.mobileNavHandler !== 'undefined') {
        window.mobileNavHandler.closeSidebar();
    }
}

// Initialize audio player
function initializePlayer() {
    // Set up audio player event listeners
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', playNext);
    audioPlayer.addEventListener('error', handlePlaybackError);
    
    // Set up player controls
    document.getElementById('play-pause-button').addEventListener('click', togglePlayPause);
    document.getElementById('next-button').addEventListener('click', playNext);
    document.getElementById('previous-button').addEventListener('click', playPrevious);
    
    // Progress bar interaction
    const progressContainer = document.querySelector('.progress-bar-container');
    progressContainer.addEventListener('click', setProgress);
    
    // Volume control
    const volumeSlider = document.querySelector('.volume-slider');
    volumeSlider.addEventListener('click', setVolume);
    
    // Set initial volume
    audioPlayer.volume = 0.7;
}

// Load episodes from API
async function loadEpisodes() {
    try {
        showLoading('episodes-section');
        
        const response = await fetch('/api/episodes');
        if (!response.ok) {
            throw new Error('Failed to load episodes');
        }
        
        const data = await response.json();
        episodes = data.episodes || [];
        
        hideLoading('episodes-section');
        
        // Render episodes if on episodes page
        if (window.location.hash === '#episodes') {
            renderEpisodes();
        }
        
        // Render home if on home page
        if (window.location.hash === '#home' || window.location.hash === '') {
            renderHome();
        }
    } catch (error) {
        hideLoading('episodes-section');
        window.errorHandler.showError('Error loading episodes: ' + error.message);
    }
}

// Load favorites from local storage
function loadFavorites() {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
        favorites = JSON.parse(storedFavorites);
    }
    
    // Render favorites if on favorites page
    if (window.location.hash === '#favorites') {
        renderFavorites();
    }
}

// Load favorite songs from local storage
function loadFavoriteSongs() {
    const storedFavoriteSongs = localStorage.getItem('favoriteSongs');
    if (storedFavoriteSongs) {
        favoriteSongs = JSON.parse(storedFavoriteSongs);
    }
    
    // Render favorite songs if on favorite songs page
    if (window.location.hash === '#favorite-songs') {
        renderFavoriteSongs();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('episode-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderEpisodes();
        });
    }
    
    // Sort select
    const sortSelect = document.getElementById('episode-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            renderEpisodes();
        });
    }
    
    // Refresh button
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            const currentRoute = window.location.hash.substring(1) || 'home';
            
            if (currentRoute === 'episodes') {
                loadEpisodes();
            } else if (currentRoute === 'favorites') {
                renderFavorites();
            } else if (currentRoute === 'favorite-songs') {
                renderFavoriteSongs();
            } else if (currentRoute === 'downloads') {
                if (typeof window.refreshDownloads === 'function') {
                    window.refreshDownloads();
                }
            } else if (currentRoute === 'home') {
                loadEpisodes();
            }
        });
    }
    
    // Go to episodes button (in empty states)
    document.querySelectorAll('#go-to-episodes').forEach(button => {
        button.addEventListener('click', () => {
            window.router.navigateTo('episodes');
        });
    });
    
    // Song marker modal
    const songMarkerModal = document.getElementById('song-marker-modal');
    const modalClose = songMarkerModal.querySelector('.modal-close');
    
    modalClose.addEventListener('click', () => {
        songMarkerModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === songMarkerModal) {
            songMarkerModal.style.display = 'none';
        }
    });
    
    // Song marker form
    const songMarkerForm = document.getElementById('song-marker-form');
    songMarkerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        saveFavoriteSong();
    });
    
    // Search Spotify button
    const searchSpotifyButton = document.getElementById('search-spotify-button');
    searchSpotifyButton.addEventListener('click', searchSpotify);
}

// Render home page
function renderHome() {
    if (episodes.length === 0) return;
    
    // Featured episodes (random selection of 4)
    const featuredContainer = document.querySelector('#home-section .episode-grid');
    featuredContainer.innerHTML = '';
    
    const randomEpisodes = [...episodes].sort(() => 0.5 - Math.random()).slice(0, 4);
    
    randomEpisodes.forEach(episode => {
        const episodeCard = createEpisodeCard(episode);
        featuredContainer.appendChild(episodeCard);
    });
    
    // Recent episodes (latest 5)
    const recentContainer = document.querySelector('#home-section .episode-list');
    recentContainer.innerHTML = '';
    
    const recentEpisodes = [...episodes].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    recentEpisodes.forEach(episode => {
        const episodeItem = createEpisodeItem(episode);
        recentContainer.appendChild(episodeItem);
    });
}

// Render episodes list
function renderEpisodes() {
    const container = document.querySelector('#episodes-section .episode-list');
    container.innerHTML = '';
    
    if (episodes.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">🎵</div>
            <h3>Geen afleveringen gevonden</h3>
            <p>Er zijn momenteel geen afleveringen beschikbaar.</p>
        `;
        container.appendChild(emptyState);
        return;
    }
    
    // Filter episodes based on search
    const searchInput = document.getElementById('episode-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filteredEpisodes = episodes;
    if (searchTerm) {
        filteredEpisodes = episodes.filter(episode => 
            episode.title.toLowerCase().includes(searchTerm) ||
            episode.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort episodes
    const sortSelect = document.getElementById('episode-sort');
    const sortValue = sortSelect ? sortSelect.value : 'date-desc';
    
    filteredEpisodes.sort((a, b) => {
        if (sortValue === 'date-desc') {
            return new Date(b.date) - new Date(a.date);
        } else if (sortValue === 'date-asc') {
            return new Date(a.date) - new Date(b.date);
        } else if (sortValue === 'title-asc') {
            return a.title.localeCompare(b.title);
        } else if (sortValue === 'title-desc') {
            return b.title.localeCompare(a.title);
        }
        return 0;
    });
    
    // Create episode items
    filteredEpisodes.forEach(episode => {
        const episodeItem = createEpisodeItem(episode);
        container.appendChild(episodeItem);
    });
    
    // Show empty state if no results
    if (filteredEpisodes.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">🔍</div>
            <h3>Geen resultaten gevonden</h3>
            <p>Er zijn geen afleveringen gevonden die overeenkomen met je zoekopdracht.</p>
            <button id="clear-search" class="primary-button">Wis zoekopdracht</button>
        `;
        container.appendChild(emptyState);
        
        // Add event listener to clear search button
        document.getElementById('clear-search').addEventListener('click', () => {
            document.getElementById('episode-search').value = '';
            renderEpisodes();
        });
    }
}

// Render favorites list
function renderFavorites() {
    const container = document.querySelector('#favorites-section .episode-list');
    const emptyState = document.querySelector('#favorites-section .empty-state');
    
    container.innerHTML = '';
    
    if (favorites.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    // Get full episode data for favorites
    const favoriteEpisodes = favorites.map(favoriteId => {
        return episodes.find(episode => episode.id === favoriteId);
    }).filter(episode => episode !== undefined);
    
    // Create episode items
    favoriteEpisodes.forEach(episode => {
        const episodeItem = createEpisodeItem(episode);
        container.appendChild(episodeItem);
    });
}

// Render favorite songs list
function renderFavoriteSongs() {
    const container = document.querySelector('#favorite-songs-section .song-list');
    const emptyState = document.querySelector('#favorite-songs-section .empty-state');
    
    container.innerHTML = '';
    
    if (favoriteSongs.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    // Create song items
    favoriteSongs.forEach(song => {
        const songItem = createSongItem(song);
        container.appendChild(songItem);
    });
}

// Render downloads section
function renderDownloads() {
    // If using download_optimization.js, this will be handled by that component
    if (typeof window.downloadsComponent !== 'undefined') {
        window.downloadsComponent.render();
        return;
    }
    
    // Fallback implementation if download_optimization.js is not loaded
    const container = document.querySelector('#downloads-section .downloads-container');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📥</div>
            <h3>Download functionaliteit wordt geladen...</h3>
            <p>Als je dit bericht blijft zien, is de download module mogelijk niet correct geladen.</p>
        </div>
    `;
}

// Create episode card (for featured episodes)
function createEpisodeCard(episode) {
    const card = document.createElement('div');
    card.className = 'episode-card';
    card.dataset.id = episode.id;
    
    const isFavorite = favorites.includes(episode.id);
    
    card.innerHTML = `
        <div class="episode-image">
            <img src="${episode.image || '/static/img/placeholder.jpg'}" alt="${episode.title}">
            <button class="play-button">▶️</button>
        </div>
        <div class="episode-info">
            <h3>${episode.title}</h3>
            <p>${formatDate(episode.date)}</p>
        </div>
        <div class="episode-actions">
            <button class="favorite-button ${isFavorite ? 'active' : ''}" title="${isFavorite ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}">
                ${isFavorite ? '★' : '☆'}
            </button>
            <button class="download-button" title="Download aflevering">📥</button>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.play-button').addEventListener('click', () => {
        playEpisode(episode.id);
    });
    
    card.querySelector('.favorite-button').addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFavorite(episode.id);
    });
    
    card.querySelector('.download-button').addEventListener('click', (event) => {
        event.stopPropagation();
        downloadEpisode(episode.id, episode.title);
    });
    
    return card;
}

// Create episode item (for lists)
function createEpisodeItem(episode) {
    const item = document.createElement('div');
    item.className = 'episode-item';
    item.dataset.id = episode.id;
    
    const isFavorite = favorites.includes(episode.id);
    
    item.innerHTML = `
        <img class="episode-image" src="${episode.image || '/static/img/placeholder.jpg'}" alt="${episode.title}">
        <div class="episode-info">
            <h3>${episode.title}</h3>
            <p>${formatDate(episode.date)} • ${formatDuration(episode.duration)}</p>
        </div>
        <div class="episode-actions">
            <button class="play-button" title="Afspelen">▶️</button>
            <button class="favorite-button ${isFavorite ? 'active' : ''}" title="${isFavorite ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}">
                ${isFavorite ? '★' : '☆'}
            </button>
            <button class="download-button" title="Download aflevering">📥</button>
        </div>
    `;
    
    // Add event listeners
    item.querySelector('.play-button').addEventListener('click', () => {
        playEpisode(episode.id);
    });
    
    item.querySelector('.favorite-button').addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFavorite(episode.id);
    });
    
    item.querySelector('.download-button').addEventListener('click', (event) => {
        event.stopPropagation();
        downloadEpisode(episode.id, episode.title);
    });
    
    return item;
}

// Create song item
function createSongItem(song) {
    const item = document.createElement('div');
    item.className = 'song-item';
    
    item.innerHTML = `
        <div class="song-info">
            <h3>${song.title}</h3>
            <p>${song.artist}</p>
            <p class="song-episode">From: ${song.episodeTitle}</p>
            <p class="song-timestamp">at ${formatTime(song.timestamp)}</p>
        </div>
        <div class="song-actions">
            ${song.spotifyId ? `
                <a href="https://open.spotify.com/track/${song.spotifyId}" target="_blank" class="spotify-link" title="Open in Spotify">
                    <img src="/static/img/spotify.png" alt="Spotify">
                </a>
            ` : ''}
            <button class="play-episode-button" title="Afspelen vanaf dit punt">▶️</button>
            <button class="remove-song-button" title="Verwijder uit favorieten">🗑️</button>
        </div>
    `;
    
    // Add event listeners
    item.querySelector('.play-episode-button').addEventListener('click', () => {
        playEpisodeFromTimestamp(song.episodeId, song.timestamp);
    });
    
    item.querySelector('.remove-song-button').addEventListener('click', () => {
        removeFavoriteSong(song);
        renderFavoriteSongs();
    });
    
    return item;
}

// Play episode
function playEpisode(episodeId) {
    const episode = episodes.find(ep => ep.id === episodeId);
    if (!episode) return;
    
    // Update current episode
    currentEpisode = episode;
    
    // Update player UI
    document.getElementById('player-title').textContent = episode.title;
    document.getElementById('player-date').textContent = formatDate(episode.date);
    document.getElementById('player-cover').src = episode.image || '/static/img/placeholder.jpg';
    
    // Update audio source
    audioPlayer.src = episode.audioUrl;
    audioPlayer.currentTime = 0;
    
    // Start playing
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            updatePlayPauseButton();
            
            // Add to play history
            addToPlayHistory(episodeId);
        })
        .catch(error => {
            window.errorHandler.showError('Error playing episode: ' + error.message);
        });
}

// Play episode from timestamp
function playEpisodeFromTimestamp(episodeId, timestamp) {
    const episode = episodes.find(ep => ep.id === episodeId);
    if (!episode) return;
    
    // Update current episode
    currentEpisode = episode;
    
    // Update player UI
    document.getElementById('player-title').textContent = episode.title;
    document.getElementById('player-date').textContent = formatDate(episode.date);
    document.getElementById('player-cover').src = episode.image || '/static/img/placeholder.jpg';
    
    // Update audio source
    audioPlayer.src = episode.audioUrl;
    audioPlayer.currentTime = timestamp;
    
    // Start playing
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            updatePlayPauseButton();
            
            // Add to play history
            addToPlayHistory(episodeId);
        })
        .catch(error => {
            window.errorHandler.showError('Error playing episode: ' + error.message);
        });
}

// Toggle play/pause
function togglePlayPause() {
    if (!currentEpisode) {
        // If no episode is selected, play a random one
        playRandom();
        return;
    }
    
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
    } else {
        audioPlayer.play()
            .catch(error => {
                window.errorHandler.showError('Error playing episode: ' + error.message);
            });
        isPlaying = true;
    }
    
    updatePlayPauseButton();
}

// Update play/pause button
function updatePlayPauseButton() {
    const button = document.getElementById('play-pause-button');
    button.textContent = isPlaying ? '⏸️' : '▶️';
    button.setAttribute('aria-label', isPlaying ? 'Pauzeren' : 'Afspelen');
}

// Play next episode
function playNext() {
    if (isRandom) {
        playRandom();
        return;
    }
    
    if (!currentEpisode || episodes.length === 0) return;
    
    // Find current index
    const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
    
    // Get next index (loop back to start if at end)
    const nextIndex = (currentIndex + 1) % episodes.length;
    
    // Play next episode
    playEpisode(episodes[nextIndex].id);
}

// Play previous episode
function playPrevious() {
    if (!currentEpisode || episodes.length === 0) return;
    
    // If current time is more than 3 seconds, restart current episode
    if (audioPlayer.currentTime > 3) {
        audioPlayer.currentTime = 0;
        return;
    }
    
    // Find current index
    const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
    
    // Get previous index (loop to end if at start)
    const prevIndex = (currentIndex - 1 + episodes.length) % episodes.length;
    
    // Play previous episode
    playEpisode(episodes[prevIndex].id);
}

// Play random episode
function playRandom() {
    if (episodes.length === 0) return;
    
    // Get random episode (excluding current one if possible)
    let randomIndex;
    if (episodes.length > 1 && currentEpisode) {
        do {
            randomIndex = Math.floor(Math.random() * episodes.length);
        } while (episodes[randomIndex].id === currentEpisode.id);
    } else {
        randomIndex = Math.floor(Math.random() * episodes.length);
    }
    
    // Play random episode
    playEpisode(episodes[randomIndex].id);
}

// Update progress bar
function updateProgress() {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration || 0;
    
    // Update progress bar
    const progressPercent = (currentTime / duration) * 100;
    document.querySelector('.progress-bar').style.width = `${progressPercent}%`;
    
    // Update time display
    document.getElementById('current-time').textContent = formatTime(currentTime);
    document.getElementById('total-time').textContent = formatTime(duration);
    
    // Skip ads at beginning if enabled
    if (currentTime < 30 && isAdSection(currentTime)) {
        audioPlayer.currentTime = 30; // Skip first 30 seconds (typical ad length)
    }
}

// Set progress when clicking on progress bar
function setProgress(e) {
    const progressBar = document.querySelector('.progress-bar-container');
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    
    audioPlayer.currentTime = (clickX / width) * duration;
}

// Set volume when clicking on volume slider
function setVolume(e) {
    const volumeSlider = document.querySelector('.volume-slider');
    const width = volumeSlider.clientWidth;
    const clickX = e.offsetX;
    
    audioPlayer.volume = clickX / width;
    document.querySelector('.volume-level').style.width = `${(clickX / width) * 100}%`;
    
    // Update volume button icon
    updateVolumeIcon();
}

// Update volume icon based on current volume
function updateVolumeIcon() {
    const volumeButton = document.getElementById('volume-button');
    
    if (audioPlayer.volume === 0) {
        volumeButton.textContent = '🔇';
    } else if (audioPlayer.volume < 0.5) {
        volumeButton.textContent = '🔉';
    } else {
        volumeButton.textContent = '🔊';
    }
}

// Check if current time is in ad section
function isAdSection(time) {
    // Simple implementation: consider first 30 seconds as potential ad
    return time < 30;
}

// Toggle favorite status
function toggleFavorite(episodeId) {
    const index = favorites.indexOf(episodeId);
    
    if (index === -1) {
        // Add to favorites
        favorites.push(episodeId);
        window.errorHandler.showNotification('Toegevoegd aan favorieten', 'success');
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        window.errorHandler.showNotification('Verwijderd uit favorieten', 'info');
    }
    
    // Save to local storage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update UI
    document.querySelectorAll(`.episode-item[data-id="${episodeId}"] .favorite-button, .episode-card[data-id="${episodeId}"] .favorite-button`).forEach(button => {
        if (index === -1) {
            button.classList.add('active');
            button.textContent = '★';
            button.title = 'Verwijder uit favorieten';
        } else {
            button.classList.remove('active');
            button.textContent = '☆';
            button.title = 'Voeg toe aan favorieten';
        }
    });
    
    // Update favorites view if active
    if (window.location.hash === '#favorites') {
        renderFavorites();
    }
}

// Mark current song as favorite
function markCurrentSong() {
    if (!currentEpisode || !isPlaying) {
        window.errorHandler.showNotification('Geen aflevering wordt momenteel afgespeeld', 'error');
        return;
    }
    
    // Show song marker modal
    const modal = document.getElementById('song-marker-modal');
    modal.style.display = 'flex';
    
    // Set current timestamp
    document.getElementById('song-timestamp').value = formatTime(audioPlayer.currentTime);
    
    // Focus artist input
    document.getElementById('song-artist').focus();
}

// Save favorite song
function saveFavoriteSong() {
    const artist = document.getElementById('song-artist').value.trim();
    const title = document.getElementById('song-title').value.trim();
    const timestamp = audioPlayer.currentTime;
    
    if (!artist || !title) {
        window.errorHandler.showNotification('Vul zowel artiest als titel in', 'error');
        return;
    }
    
    // Create song object
    const song = {
        id: Date.now().toString(),
        artist,
        title,
        timestamp,
        episodeId: currentEpisode.id,
        episodeTitle: currentEpisode.title,
        date: new Date().toISOString(),
        spotifyId: document.querySelector('.spotify-result.selected')?.dataset.spotifyId
    };
    
    // Add to favorite songs
    favoriteSongs.push(song);
    
    // Save to local storage
    localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));
    
    // Close modal
    document.getElementById('song-marker-modal').style.display = 'none';
    
    // Clear form
    document.getElementById('song-artist').value = '';
    document.getElementById('song-title').value = '';
    document.getElementById('spotify-results').style.display = 'none';
    document.querySelector('.spotify-results-list').innerHTML = '';
    
    // Show notification
    window.errorHandler.showNotification('Nummer toegevoegd aan favorieten', 'success');
    
    // Update favorite songs view if active
    if (window.location.hash === '#favorite-songs') {
        renderFavoriteSongs();
    }
}

// Remove favorite song
function removeFavoriteSong(song) {
    const index = favoriteSongs.findIndex(s => s.id === song.id);
    
    if (index !== -1) {
        favoriteSongs.splice(index, 1);
        
        // Save to local storage
        localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));
        
        // Show notification
        window.errorHandler.showNotification('Nummer verwijderd uit favorieten', 'info');
    }
}

// Search Spotify for song
async function searchSpotify() {
    const artist = document.getElementById('song-artist').value.trim();
    const title = document.getElementById('song-title').value.trim();
    
    if (!artist || !title) {
        window.errorHandler.showNotification('Vul zowel artiest als titel in', 'error');
        return;
    }
    
    try {
        // Show loading
        const resultsContainer = document.getElementById('spotify-results');
        const resultsList = resultsContainer.querySelector('.spotify-results-list');
        
        resultsList.innerHTML = '<p>Zoeken naar resultaten...</p>';
        resultsContainer.style.display = 'block';
        
        // Search Spotify
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(artist + ' ' + title)}`);
        
        if (!response.ok) {
            throw new Error('Failed to search Spotify');
        }
        
        const data = await response.json();
        
        // Display results
        resultsList.innerHTML = '';
        
        if (data.tracks.length === 0) {
            resultsList.innerHTML = '<p>Geen resultaten gevonden</p>';
            return;
        }
        
        data.tracks.forEach(track => {
            const resultItem = document.createElement('div');
            resultItem.className = 'spotify-result';
            resultItem.dataset.spotifyId = track.id;
            
            resultItem.innerHTML = `
                <div class="spotify-result-info">
                    <h4>${track.name}</h4>
                    <p>${track.artists.join(', ')}</p>
                </div>
                <div class="spotify-result-actions">
                    <button class="preview-button" data-preview-url="${track.preview_url || ''}">▶️</button>
                    <button class="select-button">Selecteer</button>
                </div>
            `;
            
            // Add event listeners
            resultItem.querySelector('.preview-button').addEventListener('click', (event) => {
                const previewUrl = event.target.dataset.previewUrl;
                if (previewUrl) {
                    // Create and play audio preview
                    const previewAudio = new Audio(previewUrl);
                    previewAudio.play();
                } else {
                    window.errorHandler.showNotification('Geen preview beschikbaar', 'error');
                }
            });
            
            resultItem.querySelector('.select-button').addEventListener('click', () => {
                // Remove selected class from all results
                document.querySelectorAll('.spotify-result').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Add selected class to this result
                resultItem.classList.add('selected');
                
                // Update form with track info
                document.getElementById('song-artist').value = track.artists.join(', ');
                document.getElementById('song-title').value = track.name;
            });
            
            resultsList.appendChild(resultItem);
        });
    } catch (error) {
        window.errorHandler.showError('Error searching Spotify: ' + error.message);
    }
}

// Download episode
function downloadEpisode(episodeId, episodeTitle) {
    // If using download_optimization.js, use its download function
    if (typeof window.downloadEpisode === 'function') {
        window.downloadEpisode(episodeId, episodeTitle);
        return;
    }
    
    // Fallback implementation
    try {
        fetch(`/api/episodes/${episodeId}/download`, {
            method: 'POST'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Download failed');
            }
            return response.json();
        })
        .then(data => {
            window.errorHandler.showNotification(`Download gestart: ${episodeTitle}`, 'success');
            
            // Navigate to downloads section
            window.router.navigateTo('downloads');
        })
        .catch(error => {
            window.errorHandler.showError('Error downloading episode: ' + error.message);
        });
    } catch (error) {
        window.errorHandler.showError('Error downloading episode: ' + error.message);
    }
}

// Add to play history
function addToPlayHistory(episodeId) {
    // Remove episode from history if already exists
    const index = playHistory.indexOf(episodeId);
    if (index !== -1) {
        playHistory.splice(index, 1);
    }
    
    // Add to beginning of history
    playHistory.unshift(episodeId);
    
    // Limit history size
    if (playHistory.length > 50) {
        playHistory.pop();
    }
    
    // Update current index
    currentIndex = 0;
}

// Handle playback error
function handlePlaybackError(error) {
    window.errorHandler.showError('Error playing episode: ' + error.message);
    isPlaying = false;
    updatePlayPauseButton();
}

// Show loading indicator
function showLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    // Create loading indicator if it doesn't exist
    let loadingIndicator = section.querySelector('.loading-indicator');
    
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <p>Laden...</p>
        `;
        section.appendChild(loadingIndicator);
    }
    
    loadingIndicator.style.display = 'flex';
}

// Hide loading indicator
function hideLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const loadingIndicator = section.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Format duration (seconds to HH:MM:SS or MM:SS)
function formatDuration(seconds) {
    if (!seconds) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Make functions available globally
window.playEpisode = playEpisode;
window.toggleFavorite = toggleFavorite;
window.markCurrentSong = markCurrentSong;
window.downloadEpisode = downloadEpisode;
