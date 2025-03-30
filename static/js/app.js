// Global variables
let player = null;
let currentEpisode = null;
let episodes = [];
let favorites = [];
let favoriteSongs = [];
let isPlaying = false;
let isContinuous = true;
let isRandom = false;
let playedEpisodes = [];
let currentTimestamp = 0;
let markSongModal = null;
let spotifyResultsModal = null;

// DOM elements
const playerTitle = document.getElementById('player-title');
const playerDate = document.getElementById('player-date');
const playerCover = document.getElementById('player-cover');
const playButton = document.getElementById('btn-play');
const prevButton = document.getElementById('btn-previous');
const nextButton = document.getElementById('btn-next');
const progressBar = document.getElementById('progress-bar');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');
const volumeSlider = document.getElementById('volume-slider');
const favoriteButton = document.getElementById('btn-favorite');
const markSongButton = document.getElementById('btn-mark-song');
const randomButton = document.getElementById('btn-random');
const continuousButton = document.getElementById('btn-continuous');
const refreshButton = document.getElementById('btn-refresh');

// Navigation elements
const navHome = document.getElementById('nav-home');
const navEpisodes = document.getElementById('nav-episodes');
const navFavorites = document.getElementById('nav-favorites');
const navSongs = document.getElementById('nav-songs');

// Content views
const viewHome = document.getElementById('view-home');
const viewEpisodes = document.getElementById('view-episodes');
const viewFavorites = document.getElementById('view-favorites');
const viewSongs = document.getElementById('view-songs');
const contentTitle = document.getElementById('content-title');

// Content containers
const episodesContainer = document.getElementById('episodes-container');
const favoritesContainer = document.getElementById('favorites-container');
const songsContainer = document.getElementById('songs-container');
const recentEpisodesList = document.getElementById('recent-episodes');
const favoriteEpisodesList = document.getElementById('favorite-episodes');

// Modal elements
const songTitleInput = document.getElementById('song-title');
const songArtistInput = document.getElementById('song-artist');
const songTimestampDisplay = document.getElementById('song-timestamp');
const saveSongButton = document.getElementById('btn-save-song');
const spotifyResultsContainer = document.getElementById('spotify-results-container');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap modals
    markSongModal = new bootstrap.Modal(document.getElementById('markSongModal'));
    spotifyResultsModal = new bootstrap.Modal(document.getElementById('spotifyResultsModal'));
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadEpisodes();
    loadFavorites();
    loadFavoriteSongs();
    loadRecentEpisodes();
    
    // Set up navigation
    setupNavigation();
});

// Set up event listeners
function setupEventListeners() {
    // Player controls
    playButton.addEventListener('click', togglePlay);
    prevButton.addEventListener('click', playPrevious);
    nextButton.addEventListener('click', playNext);
    volumeSlider.addEventListener('input', updateVolume);
    favoriteButton.addEventListener('click', toggleFavorite);
    markSongButton.addEventListener('click', openMarkSongModal);
    randomButton.addEventListener('click', toggleRandom);
    continuousButton.addEventListener('click', toggleContinuous);
    refreshButton.addEventListener('click', refreshEpisodes);
    
    // Progress bar
    document.querySelector('.progress').addEventListener('click', seekAudio);
    
    // Mark song modal
    saveSongButton.addEventListener('click', saveFavoriteSong);
}

// Set up navigation
function setupNavigation() {
    // Navigation click handlers
    navHome.addEventListener('click', () => showView('home'));
    navEpisodes.addEventListener('click', () => showView('episodes'));
    navFavorites.addEventListener('click', () => showView('favorites'));
    navSongs.addEventListener('click', () => showView('songs'));
}

// Show a specific view
function showView(viewName) {
    // Hide all views
    viewHome.classList.remove('active');
    viewEpisodes.classList.remove('active');
    viewFavorites.classList.remove('active');
    viewSongs.classList.remove('active');
    
    // Remove active class from all nav items
    navHome.classList.remove('active');
    navEpisodes.classList.remove('active');
    navFavorites.classList.remove('active');
    navSongs.classList.remove('active');
    
    // Show the selected view
    switch (viewName) {
        case 'home':
            viewHome.classList.add('active');
            navHome.classList.add('active');
            contentTitle.textContent = 'Home';
            break;
        case 'episodes':
            viewEpisodes.classList.add('active');
            navEpisodes.classList.add('active');
            contentTitle.textContent = 'Alle Afleveringen';
            break;
        case 'favorites':
            viewFavorites.classList.add('active');
            navFavorites.classList.add('active');
            contentTitle.textContent = 'Favorieten';
            break;
        case 'songs':
            viewSongs.classList.add('active');
            navSongs.classList.add('active');
            contentTitle.textContent = 'Favoriete Nummers';
            break;
    }
}

// API Functions
async function fetchAPI(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`/api/${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Er is een fout opgetreden bij het communiceren met de server.' };
    }
}

// Load episodes from the API
async function loadEpisodes() {
    const result = await fetchAPI('episodes');
    if (result.success) {
        episodes = result.episodes;
        renderEpisodes();
    } else {
        episodesContainer.innerHTML = `<div class="alert alert-danger">Fout bij het laden van afleveringen: ${result.message}</div>`;
    }
}

// Refresh episodes from the RSS feed
async function refreshEpisodes() {
    refreshButton.disabled = true;
    refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Vernieuwen...';
    
    const result = await fetchAPI('episodes/refresh');
    
    refreshButton.disabled = false;
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Vernieuwen';
    
    if (result.success) {
        loadEpisodes();
        alert(`Afleveringen vernieuwd! ${result.count} afleveringen gevonden.`);
    } else {
        alert(`Fout bij het vernieuwen van afleveringen: ${result.message}`);
    }
}

// Render episodes in the episodes view
function renderEpisodes() {
    if (episodes.length === 0) {
        episodesContainer.innerHTML = '<div class="alert alert-info">Geen afleveringen gevonden.</div>';
        return;
    }
    
    let html = '';
    episodes.forEach(episode => {
        const isFavorite = favorites.some(fav => fav.id === episode.id);
        const duration = formatTime(episode.duration);
        const date = new Date(episode.publication_date).toLocaleDateString('nl-NL');
        
        html += `
            <div class="episode-card" data-id="${episode.id}">
                <img src="${episode.image_url || '/static/img/default-cover.jpg'}" alt="${episode.title}">
                <div class="episode-card-body">
                    <div class="episode-card-title">${episode.title}</div>
                    <div class="episode-card-date">${date}</div>
                    <div class="episode-card-duration">${duration}</div>
                    <div class="episode-card-actions">
                        <button class="play" onclick="playEpisode(${episode.id})">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="favorite ${isFavorite ? 'active' : ''}" onclick="toggleEpisodeFavorite(${episode.id}, this)">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    episodesContainer.innerHTML = html;
}

// Load favorite episodes
async function loadFavorites() {
    const result = await fetchAPI('favorites/episodes');
    if (result.success) {
        favorites = result.favorites;
        renderFavorites();
    } else {
        favoritesContainer.innerHTML = `<div class="alert alert-danger">Fout bij het laden van favorieten: ${result.message}</div>`;
    }
}

// Render favorite episodes
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<div class="alert alert-info">Geen favoriete afleveringen gevonden.</div>';
        favoriteEpisodesList.innerHTML = '<li class="list-group-item text-center">Geen favorieten</li>';
        return;
    }
    
    let html = '';
    let listHtml = '';
    
    favorites.slice(0, 5).forEach(episode => {
        listHtml += `
            <li class="list-group-item d-flex justify-content-between align-items-center" onclick="playEpisode(${episode.id})">
                ${episode.title}
                <button class="btn btn-sm" onclick="event.stopPropagation(); toggleEpisodeFavorite(${episode.id})">
                    <i class="fas fa-heart text-success"></i>
                </button>
            </li>
        `;
    });
    
    favorites.forEach(episode => {
        const duration = formatTime(episode.duration);
        const date = new Date(episode.publication_date).toLocaleDateString('nl-NL');
        
        html += `
            <div class="episode-card" data-id="${episode.id}">
                <img src="${episode.image_url || '/static/img/default-cover.jpg'}" alt="${episode.title}">
                <div class="episode-card-body">
                    <div class="episode-card-title">${episode.title}</div>
                    <div class="episode-card-date">${date}</div>
                    <div class="episode-card-duration">${duration}</div>
                    <div class="episode-card-actions">
                        <button class="play" onclick="playEpisode(${episode.id})">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="favorite active" onclick="toggleEpisodeFavorite(${episode.id}, this)">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    favoritesContainer.innerHTML = html;
    favoriteEpisodesList.innerHTML = listHtml || '<li class="list-group-item text-center">Geen favorieten</li>';
}

// Load favorite songs
async function loadFavoriteSongs() {
    const result = await fetchAPI('favorites/songs');
    if (result.success) {
        favoriteSongs = result.favorites;
        renderFavoriteSongs();
    } else {
        songsContainer.innerHTML = `<div class="alert alert-danger">Fout bij het laden van favoriete nummers: ${result.message}</div>`;
    }
}

// Render favorite songs
function renderFavoriteSongs() {
    if (favoriteSongs.length === 0) {
        songsContainer.innerHTML = '<div class="alert alert-info">Geen favoriete nummers gevonden.</div>';
        return;
    }
    
    let html = '';
    favoriteSongs.forEach(song => {
        const hasSpotify = song.spotify_url ? true : false;
        
        html += `
            <div class="song-item">
                <div class="song-item-info">
                    <div class="song-item-title">${song.song_title}</div>
                    <div class="song-item-artist">${song.artist}</div>
                    <div class="song-item-episode">
                        <small>Uit: ${song.episode_title} @ ${formatTime(song.timestamp)}</small>
                    </div>
                </div>
                <div class="song-item-actions">
                    <button onclick="playEpisodeAtTimestamp(${song.episode_id}, ${song.timestamp})">
                        <i class="fas fa-play"></i>
                    </button>
                    ${hasSpotify ? `<a href="${song.spotify_url}" target="_blank"><i class="fab fa-spotify"></i></a>` : ''}
                    <button onclick="removeFavoriteSong(${song.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    songsContainer.innerHTML = html;
}

// Load recent episodes
async function loadRecentEpisodes() {
    const result = await fetchAPI('history');
    if (result.success && result.history.length > 0) {
        const history = result.history;
        let html = '';
        
        history.slice(0, 5).forEach(item => {
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center" onclick="playEpisode(${item.episode_id})">
                    ${item.title}
                    <small>${formatTime(item.timestamp)}</small>
                </li>
            `;
        });
        
        recentEpisodesList.innerHTML = html;
    } else {
        recentEpisodesList.innerHTML = '<li class="list-group-item text-center">Geen recente afleveringen</li>';
    }
}

// Toggle episode favorite status
async function toggleEpisodeFavorite(episodeId, buttonElement) {
    const isFavorite = favorites.some(fav => fav.id === episodeId);
    let result;
    
    if (isFavorite) {
        result = await fetchAPI(`favorites/episodes/${episodeId}`, 'DELETE');
        if (result.success) {
            favorites = favorites.filter(fav => fav.id !== episodeId);
        }
    } else {
        result = await fetchAPI(`favorites/episodes/${episodeId}`, 'POST');
        if (result.success) {
            // Reload favorites to get the full episode data
            await loadFavorites();
        }
    }
    
    // Update UI
    if (result.success) {
        // Update button if provided
        if (buttonElement) {
            buttonElement.classList.toggle('active', !isFavorite);
        }
        
        // Update favorite button in player if this is the current episode
        if (currentEpisode && currentEpisode.id === episodeId) {
            favoriteButton.classList.toggle('active', !isFavorite);
        }
        
        // Re-render episodes and favorites
        renderEpisodes();
        renderFavorites();
    } else {
        alert(`Fout bij het bijwerken van favorieten: ${result.message}`);
    }
}

// Play an episode
async function playEpisode(episodeId) {
    // Get episode details
    const episode = episodes.find(ep => ep.id === episodeId);
    if (!episode) return;
    
    // Stop current playback if any
    if (player) {
        player.stop();
    }
    
    // Update current episode
    currentEpisode = episode;
    
    // Update player UI
    playerTitle.textContent = episode.title;
    playerDate.textContent = new Date(episode.publication_date).toLocaleDateString('nl-NL');
    playerCover.src = episode.image_url || '/static/img/default-cover.jpg';
    
    // Update favorite button
    const isFavorite = favorites.some(fav => fav.id === episode.id);
    favoriteButton.classList.toggle('active', isFavorite);
    
    // Create new Howl instance for the audio
    player = new Howl({
        src: [episode.audio_url],
        html5: true,
        preload: true,
        onplay: () => {
            isPlaying = true;
            playButton.classList.add('playing');
            updatePlaybackUI();
        },
        onpause: () => {
            isPlaying = false;
            playButton.classList.remove('playing');
        },
        onstop: () => {
            isPlaying = false;
            playButton.classList.remove('playing');
        },
        onend: () => {
            isPlaying = false;
            playButton.classList.remove('playing');
            
            // Add to played episodes
            if (!playedEpisodes.includes(episode.id)) {
                playedEpisodes.push(episode.id);
            }
            
            // Play next episode if continuous play is enabled
            if (isContinuous) {
                playNext();
            }
        },
        onload: () => {
            // Update total time display
            totalTimeDisplay.textContent = formatTime(player.duration());
            
            // Skip ads if needed
            if (episode.ad_end_time && episode.ad_end_time > 0) {
                player.seek(episode.ad_end_time);
            }
        }
    });
    
    // Start playback
    player.play();
    
    // Add to playback history
    await fetchAPI('history', 'POST', { episode_id: episode.id });
    
    // Update recent episodes
    loadRecentEpisodes();
    
    // Set up progress update interval
    setInterval(updateProgress, 1000);
}

// Play episode at specific timestamp
function playEpisodeAtTimestamp(episodeId, timestamp) {
    playEpisode(episodeId).then(() => {
        if (player) {
            player.seek(timestamp);
        }
    });
}

// Toggle play/pause
function togglePlay() {
    if (!player) {
        // If no episode is playing, play a random one
        if (episodes.length > 0) {
            const randomIndex = Math.floor(Math.random() * episodes.length);
            playEpisode(episodes[randomIndex].id);
        }
        return;
    }
    
    if (isPlaying) {
        player.pause();
    } else {
        player.play();
    }
}

// Play previous episode
function playPrevious() {
    if (!currentEpisode || episodes.length === 0) return;
    
    let index = episodes.findIndex(ep => ep.id === currentEpisode.id);
    if (index === -1) index = 0;
    
    // Go to previous episode
    index = (index - 1 + episodes.length) % episodes.length;
    playEpisode(episodes[index].id);
}

// Play next episode
function playNext() {
    if (episodes.length === 0) return;
    
    if (isRandom) {
        // Play a random episode that hasn't been played yet
        const unplayedEpisodes = episodes.filter(ep => !playedEpisodes.includes(ep.id));
        
        // If all episodes have been played, reset the played list
        if (unplayedEpisodes.length === 0) {
            playedEpisodes = [];
            playNext();
            return;
        }
        
        // Play a random unplayed episode
        const randomIndex = Math.floor(Math.random() * unplayedEpisodes.length);
        playEpisode(unplayedEpisodes[randomIndex].id);
    } else {
        // Play the next episode in sequence
        if (!currentEpisode) {
            // If no episode is playing, play the first one
            playEpisode(episodes[0].id);
            return;
        }
        
        let index = episodes.findIndex(ep => ep.id === currentEpisode.id);
        if (index === -1) index = 0;
        
        // Go to next episode
        index = (index + 1) % episodes.length;
        playEpisode(episodes[index].id);
    }
}

// Update volume
function updateVolume() {
    if (player) {
        player.volume(volumeSlider.value / 100);
    }
}

// Update progress bar
function updateProgress() {
    if (player && isPlaying) {
        const currentTime = player.seek();
        const duration = player.duration();
        const percentage = (currentTime / duration) * 100;
        
        progressBar.style.width = `${percentage}%`;
        currentTimeDisplay.textContent = formatTime(currentTime);
        currentTimestamp = currentTime;
    }
}

// Seek audio to a specific position
function seekAudio(event) {
    if (!player) return;
    
    const progressContainer = document.querySelector('.progress');
    const rect = progressContainer.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const seekTime = percentage * player.duration();
    
    player.seek(seekTime);
    updateProgress();
}

// Toggle favorite status for current episode
function toggleFavorite() {
    if (currentEpisode) {
        toggleEpisodeFavorite(currentEpisode.id);
    }
}

// Open mark song modal
function openMarkSongModal() {
    if (!player || !currentEpisode) return;
    
    // Get current timestamp
    const timestamp = player.seek();
    songTimestampDisplay.textContent = formatTime(timestamp);
    
    // Clear previous inputs
    songTitleInput.value = '';
    songArtistInput.value = '';
    
    // Show modal
    markSongModal.show();
}

// Save favorite song
async function saveFavoriteSong() {
    if (!currentEpisode) return;
    
    const songTitle = songTitleInput.value.trim();
    const songArtist = songArtistInput.value.trim();
    const timestamp = player.seek();
    
    if (!songTitle || !songArtist) {
        alert('Vul alstublieft zowel de titel als de artiest in.');
        return;
    }
    
    // Save song to favorites
    const result = await fetchAPI('favorites/songs', 'POST', {
        episode_id: currentEpisode.id,
        timestamp: timestamp,
        song_title: songTitle,
        artist: songArtist
    });
    
    if (result.success) {
        // Close modal
        markSongModal.hide();
        
        // Search for song on Spotify
        searchSpotify(songTitle, songArtist, result.song_id);
        
        // Reload favorite songs
        loadFavoriteSongs();
    } else {
        alert(`Fout bij het opslaan van favoriet nummer: ${result.message}`);
    }
}

// Search for a song on Spotify
async function searchSpotify(title, artist, songId) {
    const result = await fetchAPI(`spotify/search?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
    
    if (result.success && result.tracks.length > 0) {
        // Render Spotify results
        let html = `<h5>Resultaten voor "${title}" door ${artist}</h5>`;
        
        result.tracks.forEach(track => {
            html += `
                <div class="spotify-track">
                    <img src="${track.image_url || '/static/img/default-cover.jpg'}" alt="${track.name}">
                    <div class="spotify-track-info">
                        <div class="spotify-track-title">${track.name}</div>
                        <div class="spotify-track-artist">${track.artist}</div>
                        <div class="spotify-track-album">${track.album}</div>
                    </div>
                    <div class="spotify-track-actions">
                        ${track.preview_url ? `<button onclick="previewSpotifyTrack('${track.preview_url}')"><i class="fas fa-play"></i></button>` : ''}
                        <a href="${track.url}" target="_blank"><i class="fab fa-spotify"></i></a>
                        <button onclick="linkSpotifyTrack(${songId}, '${track.url}')"><i class="fas fa-link"></i></button>
                    </div>
                </div>
            `;
        });
        
        spotifyResultsContainer.innerHTML = html;
        spotifyResultsModal.show();
    } else if (result.success) {
        alert(`Geen resultaten gevonden op Spotify voor "${title}" door ${artist}.`);
    } else {
        console.error('Spotify search error:', result.message);
    }
}

// Link a Spotify track to a favorite song
async function linkSpotifyTrack(songId, spotifyUrl) {
    const result = await fetchAPI(`favorites/songs/${songId}`, 'PUT', {
        spotify_url: spotifyUrl
    });
    
    if (result.success) {
        alert('Spotify link toegevoegd aan favoriet nummer!');
        spotifyResultsModal.hide();
        loadFavoriteSongs();
    } else {
        alert(`Fout bij het toevoegen van Spotify link: ${result.message}`);
    }
}

// Preview a Spotify track
function previewSpotifyTrack(previewUrl) {
    // Pause current playback
    if (player && isPlaying) {
        player.pause();
    }
    
    // Create a temporary audio element
    const audio = new Audio(previewUrl);
    audio.play();
}

// Remove a favorite song
async function removeFavoriteSong(songId) {
    if (confirm('Weet u zeker dat u dit nummer wilt verwijderen uit uw favorieten?')) {
        const result = await fetchAPI(`favorites/songs/${songId}`, 'DELETE');
        
        if (result.success) {
            loadFavoriteSongs();
        } else {
            alert(`Fout bij het verwijderen van favoriet nummer: ${result.message}`);
        }
    }
}

// Toggle random playback
function toggleRandom() {
    isRandom = !isRandom;
    randomButton.classList.toggle('active', isRandom);
    
    // Reset played episodes when turning random on
    if (isRandom) {
        playedEpisodes = [];
        if (currentEpisode) {
            playedEpisodes.push(currentEpisode.id);
        }
    }
}

// Toggle continuous playback
function toggleContinuous() {
    isContinuous = !isContinuous;
    continuousButton.classList.toggle('active', isContinuous);
}

// Update playback UI
function updatePlaybackUI() {
    // Update random button
    randomButton.classList.toggle('active', isRandom);
    
    // Update continuous button
    continuousButton.classList.toggle('active', isContinuous);
}

// Format time in seconds to MM:SS format
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
