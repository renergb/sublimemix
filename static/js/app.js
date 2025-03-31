// Main Application JavaScript for Sublime Weekendmix Jukebox

// Global variables
let episodes = [];
let favorites = [];
let favoriteSongs = [];
let downloads = {};
let currentEpisode = null;
let isPlaying = false;
let isRandom = false;
let isContinuous = true;
let wavesurfer = null;
let songMarkers = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initNavigation();
    
    // Initialize player controls
    initPlayerControls();
    
    // Initialize waveform visualization
    initWaveform();
    
    // Initialize song marker modal
    initSongMarkerModal();
    
    // Load episodes
    loadEpisodes();
    
    // Load favorites
    loadFavorites();
    
    // Load favorite songs
    loadFavoriteSongs();
    
    // Load downloads
    loadDownloads();
});

// Navigation Functions
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Get page id from href
            const pageId = this.getAttribute('href').substring(1);
            
            // Update page title
            document.getElementById('page-title').textContent = this.textContent.trim();
            
            // Show corresponding page
            const pages = document.querySelectorAll('.content-page');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(pageId + '-page').classList.add('active');
            
            // Update URL hash
            window.location.hash = pageId;
        });
    });
    
    // Handle initial hash
    const hash = window.location.hash.substring(1) || 'home';
    const activeLink = document.querySelector(`.nav-link[href="#${hash}"]`);
    if (activeLink) {
        activeLink.click();
    } else {
        document.querySelector('.nav-link').click();
    }
    
    // Refresh button
    document.getElementById('refresh-button').addEventListener('click', function() {
        loadEpisodes(true);
    });
}

// Player Control Functions
function initPlayerControls() {
    // Play/Pause button
    document.getElementById('play-button').addEventListener('click', function() {
        if (!currentEpisode) return;
        
        if (isPlaying) {
            pauseEpisode();
        } else {
            playEpisode();
        }
    });
    
    // Previous button
    document.getElementById('prev-button').addEventListener('click', function() {
        playPreviousEpisode();
    });
    
    // Next button
    document.getElementById('next-button').addEventListener('click', function() {
        playNextEpisode();
    });
    
    // Favorite button
    document.getElementById('favorite-button').addEventListener('click', function() {
        if (!currentEpisode) return;
        
        toggleFavorite(currentEpisode.id);
    });
    
    // Mark song button
    document.getElementById('mark-song-button').addEventListener('click', function() {
        if (!currentEpisode || !wavesurfer) return;
        
        openSongMarkerModal();
    });
    
    // Volume slider
    document.getElementById('volume-slider').addEventListener('input', function() {
        if (!wavesurfer) return;
        
        const volume = this.value / 100;
        wavesurfer.setVolume(volume);
        
        // Save to localStorage
        localStorage.setItem('volume', volume);
    });
    
    // Progress bar
    document.getElementById('progress-bar').addEventListener('click', function(e) {
        if (!wavesurfer) return;
        
        const percent = e.offsetX / this.offsetWidth;
        wavesurfer.seekTo(percent);
    });
    
    // Random button
    document.getElementById('random-button').addEventListener('click', function() {
        isRandom = !isRandom;
        this.classList.toggle('active', isRandom);
        
        // Save to localStorage
        localStorage.setItem('isRandom', isRandom);
    });
    
    // Continuous button
    document.getElementById('continuous-button').addEventListener('click', function() {
        isContinuous = !isContinuous;
        this.classList.toggle('active', isContinuous);
        
        // Save to localStorage
        localStorage.setItem('isContinuous', isContinuous);
    });
    
    // Load settings from localStorage
    const savedVolume = localStorage.getItem('volume');
    if (savedVolume !== null) {
        document.getElementById('volume-slider').value = savedVolume * 100;
    }
    
    isRandom = localStorage.getItem('isRandom') === 'true';
    document.getElementById('random-button').classList.toggle('active', isRandom);
    
    isContinuous = localStorage.getItem('isContinuous') !== 'false';
    document.getElementById('continuous-button').classList.toggle('active', isContinuous);
}

// API Functions
async function loadEpisodes(refresh = false) {
    try {
        const episodesPage = document.getElementById('episodes-page');
        episodesPage.querySelector('.episode-grid').innerHTML = '<p class="loading-message">Afleveringen laden...</p>';
        
        const response = await fetch(`/api/episodes${refresh ? '?refresh=true' : ''}`);
        const data = await response.json();
        
        if (data.episodes && Array.isArray(data.episodes)) {
            episodes = data.episodes;
            
            // Render episodes
            renderEpisodes();
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading episodes:', error);
        document.getElementById('episodes-list').innerHTML = `
            <p class="empty-message">Fout bij het laden van afleveringen. Probeer het later opnieuw.</p>
        `;
    }
}

async function loadFavorites() {
    try {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        
        if (data.favorites && Array.isArray(data.favorites)) {
            favorites = data.favorites;
            
            // Render favorites
            renderFavorites();
            
            // Update favorite button if current episode is favorite
            updateFavoriteButton();
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        document.getElementById('favorites-list').innerHTML = `
            <p class="empty-message">Fout bij het laden van favorieten. Probeer het later opnieuw.</p>
        `;
    }
}

async function loadFavoriteSongs() {
    try {
        const response = await fetch('/api/favorite-songs');
        const data = await response.json();
        
        if (data.favoriteSongs && Array.isArray(data.favoriteSongs)) {
            favoriteSongs = data.favoriteSongs;
            
            // Render favorite songs
            renderFavoriteSongs();
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading favorite songs:', error);
        document.getElementById('favorite-songs-list').innerHTML = `
            <p class="empty-message">Fout bij het laden van favoriete nummers. Probeer het later opnieuw.</p>
        `;
    }
}

async function loadDownloads() {
    try {
        const response = await fetch('/api/downloads');
        const data = await response.json();
        
        if (data.downloads && typeof data.downloads === 'object') {
            downloads = data.downloads;
            
            // Render downloads
            renderDownloads();
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading downloads:', error);
        document.getElementById('downloads-list').innerHTML = `
            <p class="empty-message">Fout bij het laden van downloads. Probeer het later opnieuw.</p>
        `;
    }
}

async function toggleFavorite(episodeId) {
    if (!episodeId) return;
    
    try {
        const isFavorite = favorites.includes(episodeId);
        const method = isFavorite ? 'DELETE' : 'POST';
        
        const response = await fetch('/api/favorites', {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ episodeId: episodeId })
        });
        
        const data = await response.json();
        
        if (data.success && data.favorites) {
            favorites = data.favorites;
            
            // Update UI
            renderFavorites();
            updateFavoriteButton();
        } else {
            throw new Error('Failed to update favorite');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Fout bij het bijwerken van favorieten. Probeer het later opnieuw.');
    }
}

async function saveSongMarker(episodeId, timestamp, title, artist, spotifyId = null, spotifyUrl = null) {
    if (!episodeId || timestamp === undefined) return;
    
    try {
        const song = {
            episodeId: episodeId,
            timestamp: timestamp,
            title: title,
            artist: artist,
            spotifyId: spotifyId,
            spotifyUrl: spotifyUrl,
            createdAt: new Date().toISOString()
        };
        
        const response = await fetch('/api/favorite-songs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ song: song })
        });
        
        const data = await response.json();
        
        if (data.success && data.song) {
            // Add to favorite songs
            favoriteSongs.push(data.song);
            
            // Update UI
            renderFavoriteSongs();
            
            // Add marker to waveform
            addSongMarkerToWaveform(data.song);
            
            return data.song;
        } else {
            throw new Error('Failed to save song marker');
        }
    } catch (error) {
        console.error('Error saving song marker:', error);
        alert('Fout bij het opslaan van nummer marker. Probeer het later opnieuw.');
        return null;
    }
}

async function downloadEpisode(episodeId) {
    if (!episodeId) return;
    
    try {
        const response = await fetch(`/api/episodes/${episodeId}/download`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success && data.taskId) {
            // Add to downloads
            downloads[data.taskId] = {
                episodeId: episodeId,
                status: 'pending',
                progress: 0,
                createdAt: new Date().toISOString()
            };
            
            // Update UI
            renderDownloads();
            
            // Start polling for status
            pollDownloadStatus(data.taskId);
            
            return data.taskId;
        } else {
            throw new Error('Failed to start download');
        }
    } catch (error) {
        console.error('Error downloading episode:', error);
        alert('Fout bij het starten van download. Probeer het later opnieuw.');
        return null;
    }
}

function pollDownloadStatus(taskId) {
    if (!taskId || !downloads[taskId]) return;
    
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`/api/downloads/${taskId}/status`);
            const data = await response.json();
            
            if (data.status) {
                // Update download status
                downloads[taskId] = data;
                
                // Update UI
                updateDownloadItem(taskId);
                
                // Stop polling if completed or failed
                if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
                    clearInterval(interval);
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error polling download status:', error);
            clearInterval(interval);
        }
    }, 2000);
}

// Rendering Functions
function renderEpisodes() {
    const episodesList = document.getElementById('episodes-list');
    
    if (episodes.length === 0) {
        episodesList.innerHTML = '<p class="empty-message">Geen afleveringen gevonden.</p>';
        return;
    }
    
    let html = '';
    
    episodes.forEach(episode => {
        html += createEpisodeCard(episode);
    });
    
    episodesList.innerHTML = html;
    
    // Add event listeners
    episodesList.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', function() {
            const episodeId = this.dataset.id;
            const episode = episodes.find(ep => ep.id === episodeId);
            
            if (episode) {
                loadAndPlayEpisode(episode);
            }
        });
        
        const favoriteBtn = card.querySelector('.favorite-button');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const episodeId = this.dataset.id;
                toggleFavorite(episodeId);
            });
        }
        
        const downloadBtn = card.querySelector('.download-button');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const episodeId = this.dataset.id;
                downloadEpisode(episodeId);
            });
        }
    });
}

function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    const favoriteEpisodes = document.getElementById('favorite-episodes');
    
    // Filter episodes that are favorites
    const favEpisodes = episodes.filter(ep => favorites.includes(ep.id));
    
    if (favEpisodes.length === 0) {
        favoritesList.innerHTML = '<p class="empty-message">Geen favoriete afleveringen gevonden.</p>';
        favoriteEpisodes.innerHTML = '<p class="empty-message">Geen favorieten</p>';
        return;
    }
    
    let favoritesHtml = '';
    let recentHtml = '';
    
    favEpisodes.forEach(episode => {
        favoritesHtml += createEpisodeCard(episode);
        
        // Add to recent favorites (max 3)
        if (recentHtml.split('episode-card').length <= 3) {
            recentHtml += createEpisodeCard(episode);
        }
    });
    
    favoritesList.innerHTML = favoritesHtml;
    favoriteEpisodes.innerHTML = recentHtml || '<p class="empty-message">Geen favorieten</p>';
    
    // Add event listeners to favorites list
    favoritesList.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', function() {
            const episodeId = this.dataset.id;
            const episode = episodes.find(ep => ep.id === episodeId);
            
            if (episode) {
                loadAndPlayEpisode(episode);
            }
        });
        
        const favoriteBtn = card.querySelector('.favorite-button');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const episodeId = this.dataset.id;
                toggleFavorite(episodeId);
            });
        }
        
        const downloadBtn = card.querySelector('.download-button');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const episodeId = this.dataset.id;
                downloadEpisode(episodeId);
            });
        }
    });
    
    // Add event listeners to favorite episodes in home page
    favoriteEpisodes.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', function() {
            const episodeId = this.dataset.id;
            const episode = episodes.find(ep => ep.id === episodeId);
            
            if (episode) {
                loadAndPlayEpisode(episode);
            }
        });
    });
}

function renderFavoriteSongs() {
    const songsList = document.getElementById('favorite-songs-list');
    
    if (favoriteSongs.length === 0) {
        songsList.innerHTML = '<p class="empty-message">Geen favoriete nummers gevonden.</p>';
        return;
    }
    
    let html = '';
    
    // Group songs by episode
    const songsByEpisode = {};
    
    favoriteSongs.forEach(song => {
        if (!songsByEpisode[song.episodeId]) {
            songsByEpisode[song.episodeId] = [];
        }
        
        songsByEpisode[song.episodeId].push(song);
    });
    
    // Render songs grouped by episode
    for (const episodeId in songsByEpisode) {
        const episode = episodes.find(ep => ep.id === episodeId);
        const episodeSongs = songsByEpisode[episodeId];
        
        html += `
            <div class="episode-songs">
                <h3>${episode ? episode.title : 'Onbekende aflevering'}</h3>
                <div class="songs-list">
        `;
        
        episodeSongs.forEach(song => {
            const timestamp = formatTime(song.timestamp);
            
            html += `
                <div class="song-item" data-episode-id="${episodeId}" data-timestamp="${song.timestamp}">
                    <div class="song-info">
                        <h4>${song.title || 'Onbekende titel'}</h4>
                        <p>${song.artist || 'Onbekende artiest'}</p>
                        <span class="song-timestamp">${timestamp}</span>
                    </div>
                    <div class="song-actions">
                        <button class="btn btn-circle play-song-button" title="Afspelen">
                            <i class="fas fa-play"></i>
                        </button>
                        ${song.spotifyUrl ? `
                            <a href="${song.spotifyUrl}" target="_blank" class="btn btn-circle" title="Open in Spotify">
                                <i class="fab fa-spotify"></i>
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    songsList.innerHTML = html;
    
    // Add event listeners
    songsList.querySelectorAll('.play-song-button').forEach(button => {
        button.addEventListener('click', function() {
            const songItem = this.closest('.song-item');
            const episodeId = songItem.dataset.episodeId;
            const timestamp = parseFloat(songItem.dataset.timestamp);
            
            const episode = episodes.find(ep => ep.id === episodeId);
            
            if (episode) {
                loadAndPlayEpisode(episode, timestamp);
            }
        });
    });
}

function renderDownloads() {
    const downloadsList = document.getElementById('downloads-list');
    
    if (Object.keys(downloads).length === 0) {
        downloadsList.innerHTML = '<p class="empty-message">Geen downloads gevonden.</p>';
        return;
    }
    
    let html = '';
    
    // Group downloads by status
    const activeDownloads = [];
    const completedDownloads = [];
    const failedDownloads = [];
    
    for (const taskId in downloads) {
        const download = downloads[taskId];
        
        if (download.status === 'pending' || download.status === 'downloading') {
            activeDownloads.push({ taskId, ...download });
        } else if (download.status === 'completed') {
            completedDownloads.push({ taskId, ...download });
        } else {
            failedDownloads.push({ taskId, ...download });
        }
    }
    
    // Render active downloads
    if (activeDownloads.length > 0) {
        html += '<h3>Actieve Downloads</h3><div class="downloads-section">';
        
        activeDownloads.forEach(download => {
            html += createDownloadItem(download.taskId, download);
        });
        
        html += '</div>';
    }
    
    // Render completed downloads
    if (completedDownloads.length > 0) {
        html += '<h3>Voltooide Downloads</h3><div class="downloads-section">';
        
        completedDownloads.forEach(download => {
            html += createDownloadItem(download.taskId, download);
        });
        
        html += '</div>';
    }
    
    // Render failed downloads
    if (failedDownloads.length > 0) {
        html += '<h3>Mislukte Downloads</h3><div class="downloads-section">';
        
        failedDownloads.forEach(download => {
            html += createDownloadItem(download.taskId, download);
        });
        
        html += '</div>';
    }
    
    downloadsList.innerHTML = html;
    
    // Add event listeners
    downloadsList.querySelectorAll('.download-item').forEach(item => {
        const taskId = item.dataset.taskId;
        
        const cancelBtn = item.querySelector('.cancel-download-button');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                cancelDownload(taskId);
            });
        }
        
        const deleteBtn = item.querySelector('.delete-download-button');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                deleteDownload(taskId);
            });
        }
        
        const playBtn = item.querySelector('.play-download-button');
        if (playBtn) {
            playBtn.addEventListener('click', function() {
                playDownload(taskId);
            });
        }
    });
    
    // Download all button
    document.getElementById('download-all-button').addEventListener('click', function() {
        downloadAllEpisodes();
    });
}

function updateDownloadItem(taskId) {
    const downloadItem = document.querySelector(`.download-item[data-task-id="${taskId}"]`);
    if (!downloadItem) return;
    
    const download = downloads[taskId];
    if (!download) return;
    
    // Update progress
    const progressBar = downloadItem.querySelector('.download-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${download.progress || 0}%`;
    }
    
    // Update status
    const statusElement = downloadItem.querySelector('.download-status');
    if (statusElement) {
        let statusText = 'Onbekend';
        
        switch (download.status) {
            case 'pending':
                statusText = 'Wachten...';
                break;
            case 'downloading':
                statusText = `Downloaden (${download.progress || 0}%)`;
                break;
            case 'completed':
                statusText = 'Voltooid';
                break;
            case 'failed':
                statusText = `Mislukt: ${download.error || 'Onbekende fout'}`;
                break;
            case 'cancelled':
                statusText = 'Geannuleerd';
                break;
        }
        
        statusElement.textContent = statusText;
    }
    
    // Update actions
    const actionsElement = downloadItem.querySelector('.download-actions');
    if (actionsElement) {
        if (download.status === 'completed') {
            actionsElement.innerHTML = `
                <button class="btn btn-circle play-download-button" title="Afspelen">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn btn-circle delete-download-button" title="Verwijderen">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else if (download.status === 'pending' || download.status === 'downloading') {
            actionsElement.innerHTML = `
                <button class="btn btn-circle cancel-download-button" title="Annuleren">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else {
            actionsElement.innerHTML = `
                <button class="btn btn-circle delete-download-button" title="Verwijderen">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
    }
    
    // Add event listeners
    const cancelBtn = downloadItem.querySelector('.cancel-download-button');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            cancelDownload(taskId);
        });
    }
    
    const deleteBtn = downloadItem.querySelector('.delete-download-button');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            deleteDownload(taskId);
        });
    }
    
    const playBtn = downloadItem.querySelector('.play-download-button');
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            playDownload(taskId);
        });
    }
}

// Helper Functions
function createEpisodeCard(episode) {
    const isFavorite = favorites.includes(episode.id);
    const date = new Date(episode.date).toLocaleDateString('nl-NL');
    
    return `
        <div class="episode-card" data-id="${episode.id}">
            <div class="episode-cover">
                <img src="${episode.image || '/static/img/default-cover.jpg'}" alt="${episode.title}">
            </div>
            <div class="episode-info">
                <h3>${episode.title}</h3>
                <p>${date}</p>
                <p>${episode.duration || ''}</p>
            </div>
            <div class="episode-actions">
                <button class="btn btn-circle favorite-button ${isFavorite ? 'favorite' : ''}" data-id="${episode.id}" title="${isFavorite ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="btn btn-circle download-button" data-id="${episode.id}" title="Download">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </div>
    `;
}

function createDownloadItem(taskId, download) {
    const episode = episodes.find(ep => ep.id === download.episodeId);
    const title = episode ? episode.title : download.episode_title || 'Onbekende aflevering';
    
    let statusText = 'Onbekend';
    let actions = '';
    
    switch (download.status) {
        case 'pending':
            statusText = 'Wachten...';
            actions = `
                <button class="btn btn-circle cancel-download-button" title="Annuleren">
                    <i class="fas fa-times"></i>
                </button>
            `;
            break;
        case 'downloading':
            statusText = `Downloaden (${download.progress || 0}%)`;
            actions = `
                <button class="btn btn-circle cancel-download-button" title="Annuleren">
                    <i class="fas fa-times"></i>
                </button>
            `;
            break;
        case 'completed':
            statusText = 'Voltooid';
            actions = `
                <button class="btn btn-circle play-download-button" title="Afspelen">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn btn-circle delete-download-button" title="Verwijderen">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            break;
        case 'failed':
            statusText = `Mislukt: ${download.error || 'Onbekende fout'}`;
            actions = `
                <button class="btn btn-circle delete-download-button" title="Verwijderen">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            break;
        case 'cancelled':
            statusText = 'Geannuleerd';
            actions = `
                <button class="btn btn-circle delete-download-button" title="Verwijderen">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            break;
    }
    
    return `
        <div class="download-item" data-task-id="${taskId}">
            <div class="download-info">
                <h4>${title}</h4>
                <p class="download-status">${statusText}</p>
            </div>
            <div class="download-progress">
                <div class="download-progress-bar" style="width: ${download.progress || 0}%"></div>
            </div>
            <div class="download-actions">
                ${actions}
            </div>
        </div>
    `;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateFavoriteButton() {
    const favoriteButton = document.getElementById('favorite-button');
    
    if (!currentEpisode) {
        favoriteButton.classList.remove('favorite');
        favoriteButton.innerHTML = '<i class="far fa-heart"></i>';
        return;
    }
    
    const isFavorite = favorites.includes(currentEpisode.id);
    
    if (isFavorite) {
        favoriteButton.classList.add('favorite');
        favoriteButton.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        favoriteButton.classList.remove('favorite');
        favoriteButton.innerHTML = '<i class="far fa-heart"></i>';
    }
}

// Player Functions
function loadAndPlayEpisode(episode, startTime = 0) {
    if (!episode || !episode.audioUrl) return;
    
    currentEpisode = episode;
    
    // Update player info
    document.getElementById('episode-title').textContent = episode.title;
    document.getElementById('episode-date').textContent = new Date(episode.date).toLocaleDateString('nl-NL');
    document.getElementById('episode-cover').src = episode.image || '/static/img/default-cover.jpg';
    
    // Update favorite button
    updateFavoriteButton();
    
    // Load audio in waveform
    if (wavesurfer) {
        wavesurfer.load(episode.audioUrl);
        
        // Set start time after loading
        wavesurfer.on('ready', function() {
            if (startTime > 0) {
                wavesurfer.seekTo(startTime / wavesurfer.getDuration());
            }
            
            // Skip ads at beginning (first 30 seconds)
            if (startTime === 0) {
                wavesurfer.seekTo(30 / wavesurfer.getDuration());
            }
            
            // Start playing
            wavesurfer.play();
            
            // Load song markers for this episode
            loadSongMarkersForEpisode(episode.id);
        });
    }
    
    // Add to recent episodes
    addToRecentEpisodes(episode);
}

function playEpisode() {
    if (!wavesurfer) return;
    
    wavesurfer.play();
    isPlaying = true;
    
    // Update play button
    document.getElementById('play-button').innerHTML = '<i class="fas fa-pause"></i>';
}

function pauseEpisode() {
    if (!wavesurfer) return;
    
    wavesurfer.pause();
    isPlaying = false;
    
    // Update play button
    document.getElementById('play-button').innerHTML = '<i class="fas fa-play"></i>';
}

function playNextEpisode() {
    if (!currentEpisode || episodes.length === 0) return;
    
    let nextEpisode;
    
    if (isRandom) {
        // Get random episode
        const randomIndex = Math.floor(Math.random() * episodes.length);
        nextEpisode = episodes[randomIndex];
    } else {
        // Get next episode in list
        const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
        const nextIndex = (currentIndex + 1) % episodes.length;
        nextEpisode = episodes[nextIndex];
    }
    
    if (nextEpisode) {
        loadAndPlayEpisode(nextEpisode);
    }
}

function playPreviousEpisode() {
    if (!currentEpisode || episodes.length === 0) return;
    
    // Get previous episode in list
    const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
    const prevIndex = (currentIndex - 1 + episodes.length) % episodes.length;
    const prevEpisode = episodes[prevIndex];
    
    if (prevEpisode) {
        loadAndPlayEpisode(prevEpisode);
    }
}

function addToRecentEpisodes(episode) {
    // Get recent episodes from localStorage
    let recentEpisodes = JSON.parse(localStorage.getItem('recentEpisodes') || '[]');
    
    // Remove episode if already in list
    recentEpisodes = recentEpisodes.filter(ep => ep.id !== episode.id);
    
    // Add episode to beginning of list
    recentEpisodes.unshift(episode);
    
    // Limit to 5 episodes
    recentEpisodes = recentEpisodes.slice(0, 5);
    
    // Save to localStorage
    localStorage.setItem('recentEpisodes', JSON.stringify(recentEpisodes));
    
    // Render recent episodes
    renderRecentEpisodes(recentEpisodes);
}

function renderRecentEpisodes(recentEpisodes) {
    const recentList = document.getElementById('recent-episodes');
    
    if (!recentEpisodes || recentEpisodes.length === 0) {
        recentList.innerHTML = '<p class="empty-message">Geen recente afleveringen</p>';
        return;
    }
    
    let html = '';
    
    recentEpisodes.forEach(episode => {
        html += createEpisodeCard(episode);
    });
    
    recentList.innerHTML = html;
    
    // Add event listeners
    recentList.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', function() {
            const episodeId = this.dataset.id;
            const episode = recentEpisodes.find(ep => ep.id === episodeId);
            
            if (episode) {
                loadAndPlayEpisode(episode);
            }
        });
    });
}

// Download Functions
async function cancelDownload(taskId) {
    if (!taskId || !downloads[taskId]) return;
    
    try {
        const response = await fetch(`/api/downloads/${taskId}/cancel`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update download status
            downloads[taskId].status = 'cancelled';
            
            // Update UI
            updateDownloadItem(taskId);
        } else {
            throw new Error('Failed to cancel download');
        }
    } catch (error) {
        console.error('Error cancelling download:', error);
        alert('Fout bij het annuleren van download. Probeer het later opnieuw.');
    }
}

async function deleteDownload(taskId) {
    if (!taskId || !downloads[taskId]) return;
    
    try {
        const response = await fetch(`/api/downloads/${taskId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove from downloads
            delete downloads[taskId];
            
            // Update UI
            renderDownloads();
        } else {
            throw new Error('Failed to delete download');
        }
    } catch (error) {
        console.error('Error deleting download:', error);
        alert('Fout bij het verwijderen van download. Probeer het later opnieuw.');
    }
}

function playDownload(taskId) {
    if (!taskId || !downloads[taskId] || downloads[taskId].status !== 'completed') return;
    
    const download = downloads[taskId];
    const episode = episodes.find(ep => ep.id === download.episodeId);
    
    if (episode) {
        // Use local file URL if available
        if (download.local_path) {
            const localUrl = `/api/downloads/${taskId}/file`;
            
            // Create temporary episode object with local URL
            const localEpisode = {
                ...episode,
                audioUrl: localUrl
            };
            
            loadAndPlayEpisode(localEpisode);
        } else {
            // Fall back to streaming URL
            loadAndPlayEpisode(episode);
        }
    }
}

async function downloadAllEpisodes() {
    if (episodes.length === 0) return;
    
    const confirmDownload = confirm(`Weet u zeker dat u alle ${episodes.length} afleveringen wilt downloaden? Dit kan veel schijfruimte in beslag nemen.`);
    
    if (!confirmDownload) return;
    
    try {
        const response = await fetch('/api/downloads/all', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success && data.taskIds) {
            alert(`Download van ${data.taskIds.length} afleveringen gestart.`);
            
            // Reload downloads
            loadDownloads();
        } else {
            throw new Error('Failed to start downloads');
        }
    } catch (error) {
        console.error('Error downloading all episodes:', error);
        alert('Fout bij het starten van downloads. Probeer het later opnieuw.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load recent episodes from localStorage
    const recentEpisodes = JSON.parse(localStorage.getItem('recentEpisodes') || '[]');
    renderRecentEpisodes(recentEpisodes);
});
