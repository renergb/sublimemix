// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    window.episodes = [];
    window.favorites = [];
    window.favoriteSongs = [];
    window.downloads = [];
    window.currentEpisode = null;
    window.isShuffleEnabled = false;
    window.isContinuousEnabled = true;
    window.playbackHistory = [];
    
    // Initialize application
    initApp();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize player controls
    initPlayerControls();
    
    // Initialize modals
    initModals();
    
    // Load episodes
    loadEpisodes();
    
    // Load favorites
    loadFavorites();
    
    // Load favorite songs
    loadFavoriteSongs();
    
    // Load downloads
    loadDownloads();
});

// Initialize application
function initApp() {
    console.log('Initializing application');
    
    // Set default section
    const hash = window.location.hash || '#home';
    const section = hash.substring(1);
    showSection(section);
    
    // Activate corresponding nav item
    document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');
    
    // Initialize refresh button
    document.getElementById('refresh-button').addEventListener('click', function() {
        loadEpisodes(true);
    });
    
    // Initialize shuffle button
    document.getElementById('shuffle-button').addEventListener('click', function() {
        toggleShuffle();
    });
    
    // Initialize continuous button
    document.getElementById('continuous-button').addEventListener('click', function() {
        toggleContinuous();
    });
    
    // Initialize download all button
    document.getElementById('download-all-button')?.addEventListener('click', function() {
        downloadAllEpisodes();
    });
}

// Initialize navigation
function initNavigation() {
    // Add click event to nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get section
            const section = this.dataset.section;
            
            // Update hash
            window.location.hash = section;
            
            // Show section
            showSection(section);
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Handle hash change
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash || '#home';
        const section = hash.substring(1);
        showSection(section);
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.classList.remove('active');
        });
        document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');
    });
}

// Show section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show requested section
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
    } else {
        // Default to home if section not found
        document.getElementById('home-section').classList.add('active');
    }
}

// Initialize player controls
function initPlayerControls() {
    // Play button
    document.getElementById('play-button').addEventListener('click', function() {
        if (window.wavesurfer) {
            window.wavesurfer.playPause();
            
            // Update button icon
            if (window.wavesurfer.isPlaying()) {
                this.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                this.innerHTML = '<i class="fas fa-play"></i>';
            }
        }
    });
    
    // Previous button
    document.getElementById('previous-button').addEventListener('click', function() {
        playPreviousEpisode();
    });
    
    // Next button
    document.getElementById('next-button').addEventListener('click', function() {
        playNextEpisode();
    });
    
    // Volume slider
    document.getElementById('volume-slider').addEventListener('input', function() {
        if (window.wavesurfer) {
            window.wavesurfer.setVolume(this.value / 100);
        }
    });
    
    // Favorite button
    document.getElementById('favorite-button').addEventListener('click', function() {
        toggleFavorite();
    });
    
    // Mark song button
    document.getElementById('mark-song-button').addEventListener('click', function() {
        openSongMarkerModal();
    });
}

// Initialize modals
function initModals() {
    // Song marker modal
    const songMarkerModal = document.getElementById('song-marker-modal');
    const closeButton = songMarkerModal.querySelector('.close');
    const cancelButton = document.getElementById('cancel-marker-button');
    
    closeButton.addEventListener('click', function() {
        songMarkerModal.style.display = 'none';
    });
    
    cancelButton.addEventListener('click', function() {
        songMarkerModal.style.display = 'none';
    });
    
    document.getElementById('save-marker-button').addEventListener('click', function() {
        saveSongMarker();
    });
    
    document.getElementById('search-spotify-button').addEventListener('click', function() {
        searchSpotify();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === songMarkerModal) {
            songMarkerModal.style.display = 'none';
        }
    });
}

// Load episodes
function loadEpisodes(forceRefresh = false) {
    console.log('Loading episodes');
    
    // Show loading
    document.querySelector('.episodes-container').innerHTML = '<div class="loading">Afleveringen laden...</div>';
    
    // Fetch episodes from API
    fetch('/api/episodes')
        .then(response => response.json())
        .then(data => {
            if (data.episodes && Array.isArray(data.episodes)) {
                window.episodes = data.episodes;
                console.log(`Loaded ${window.episodes.length} episodes`);
                
                // Update UI
                updateEpisodesUI();
                
                // Enable player controls
                document.getElementById('previous-button').disabled = false;
                document.getElementById('next-button').disabled = false;
                
                // Load first episode if none is playing
                if (!window.currentEpisode && window.episodes.length > 0) {
                    loadEpisode(window.episodes[0]);
                }
                
                // Update home section
                updateHomeSection();
            }
        })
        .catch(error => {
            console.error('Error loading episodes:', error);
            document.querySelector('.episodes-container').innerHTML = '<div class="error">Fout bij het laden van afleveringen. Probeer het later opnieuw.</div>';
        });
}

// Update episodes UI
function updateEpisodesUI() {
    const episodesContainer = document.querySelector('.episodes-container');
    
    if (!window.episodes || window.episodes.length === 0) {
        episodesContainer.innerHTML = '<div class="empty">Geen afleveringen gevonden</div>';
        return;
    }
    
    // Clear container
    episodesContainer.innerHTML = '';
    
    // Add episodes
    window.episodes.forEach(episode => {
        const episodeElement = document.createElement('div');
        episodeElement.className = 'episode';
        episodeElement.dataset.id = episode.id;
        
        const isFavorite = window.favorites.some(fav => fav.id === episode.id);
        
        episodeElement.innerHTML = `
            <div class="episode-image">
                <img src="${episode.image || '/static/img/default-cover.jpg'}" alt="${episode.title}">
            </div>
            <div class="episode-info">
                <h3>${episode.title}</h3>
                <p class="episode-date">${formatDate(episode.date)}</p>
                <p class="episode-duration">${formatDuration(episode.duration)}</p>
            </div>
            <div class="episode-actions">
                <button class="play-episode" data-id="${episode.id}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="favorite-episode ${isFavorite ? 'active' : ''}" data-id="${episode.id}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="download-episode" data-id="${episode.id}">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;
        
        episodesContainer.appendChild(episodeElement);
        
        // Add event listeners
        episodeElement.querySelector('.play-episode').addEventListener('click', function() {
            const episodeId = this.dataset.id;
            const episode = window.episodes.find(ep => ep.id === episodeId);
            
            if (episode) {
                loadEpisode(episode);
            }
        });
        
        episodeElement.querySelector('.favorite-episode').addEventListener('click', function() {
            const episodeId = this.dataset.id;
            toggleFavoriteEpisode(episodeId);
        });
        
        episodeElement.querySelector('.download-episode').addEventListener('click', function() {
            const episodeId = this.dataset.id;
            downloadEpisode(episodeId);
        });
    });
}

// Load favorites
function loadFavorites() {
    console.log('Loading favorites');
    
    // Show loading
    document.querySelector('.favorites-container').innerHTML = '<div class="loading">Favorieten laden...</div>';
    
    // Fetch favorites from API
    fetch('/api/favorites')
        .then(response => response.json())
        .then(data => {
            if (data.favorites && Array.isArray(data.favorites)) {
                window.favorites = data.favorites;
                console.log(`Loaded ${window.favorites.length} favorites`);
                
                // Update UI
                updateFavoritesUI();
                
                // Update episodes UI to reflect favorites
                updateEpisodesUI();
                
                // Update home section
                updateHomeSection();
            }
        })
        .catch(error => {
            console.error('Error loading favorites:', error);
            document.querySelector('.favorites-container').innerHTML = '<div class="error">Fout bij het laden van favorieten. Probeer het later opnieuw.</div>';
        });
}

// Update favorites UI
function updateFavoritesUI() {
    const favoritesContainer = document.querySelector('.favorites-container');
    
    if (!window.favorites || window.favorites.length === 0) {
        favoritesContainer.innerHTML = '<div class="empty">Geen favorieten gevonden</div>';
        return;
    }
    
    // Clear container
    favoritesContainer.innerHTML = '';
    
    // Add favorites
    window.favorites.forEach(favorite => {
        const episodeElement = document.createElement('div');
        episodeElement.className = 'episode';
        episodeElement.dataset.id = favorite.id;
        
        episodeElement.innerHTML = `
            <div class="episode-image">
                <img src="${favorite.image || '/static/img/default-cover.jpg'}" alt="${favorite.title}">
            </div>
            <div class="episode-info">
                <h3>${favorite.title}</h3>
                <p class="episode-date">${formatDate(favorite.date)}</p>
                <p class="episode-duration">${formatDuration(favorite.duration)}</p>
            </div>
            <div class="episode-actions">
                <button class="play-episode" data-id="${favorite.id}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="favorite-episode active" data-id="${favorite.id}">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="download-episode" data-id="${favorite.id}">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;
        
        favoritesContainer.appendChild(episodeElement);
        
        // Add event listeners
        episodeElement.querySelector('.play-episode').addEventListener('click', function() {
            const episodeId = this.dataset.id;
            const episode = window.episodes.find(ep => ep.id === episodeId);
            
            if (episode) {
                loadEpisode(episode);
            }
        });
        
        episodeElement.querySelector('.favorite-episode').addEventListener('click', function() {
            const episodeId = this.dataset.id;
            toggleFavoriteEpisode(episodeId);
        });
        
        episodeElement.querySelector('.download-episode').addEventListener('click', function() {
            const episodeId = this.dataset.id;
            downloadEpisode(episodeId);
        });
    });
}

// Load favorite songs
function loadFavoriteSongs() {
    console.log('Loading favorite songs');
    
    // Show loading
    document.querySelector('.favorite-songs-container').innerHTML = '<div class="loading">Favoriete nummers laden...</div>';
    
    // Fetch favorite songs from API
    fetch('/api/favorite-songs')
        .then(response => response.json())
        .then(data => {
            if (data.favoriteSongs && Array.isArray(data.favoriteSongs)) {
                window.favoriteSongs = data.favoriteSongs;
                console.log(`Loaded ${window.favoriteSongs.length} favorite songs`);
                
                // Update UI
                updateFavoriteSongsUI();
            }
        })
        .catch(error => {
            console.error('Error loading favorite songs:', error);
            document.querySelector('.favorite-songs-container').innerHTML = '<div class="error">Fout bij het laden van favoriete nummers. Probeer het later opnieuw.</div>';
        });
}

// Update favorite songs UI
function updateFavoriteSongsUI() {
    const favoriteSongsContainer = document.querySelector('.favorite-songs-container');
    
    if (!window.favoriteSongs || window.favoriteSongs.length === 0) {
        favoriteSongsContainer.innerHTML = '<div class="empty">Geen favoriete nummers gevonden</div>';
        return;
    }
    
    // Clear container
    favoriteSongsContainer.innerHTML = '';
    
    // Add favorite songs
    window.favoriteSongs.forEach(song => {
        const songElement = document.createElement('div');
        songElement.className = 'song';
        songElement.dataset.id = song.id;
        
        songElement.innerHTML = `
            <div class="song-info">
                <h3>${song.title}</h3>
                <p class="song-artist">${song.artist}</p>
                <p class="song-episode">${song.episodeTitle}</p>
                <p class="song-timestamp">${formatTime(song.timestamp)}</p>
            </div>
            <div class="song-actions">
                <button class="play-song" data-id="${song.id}" data-episode-id="${song.episodeId}" data-timestamp="${song.timestamp}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="remove-song" data-id="${song.id}">
                    <i class="fas fa-trash"></i>
                </button>
                ${song.spotifyUrl ? `<a href="${song.spotifyUrl}" target="_blank" class="spotify-link"><i class="fab fa-spotify"></i></a>` : ''}
            </div>
        `;
        
        favoriteSongsContainer.appendChild(songElement);
        
        // Add event listeners
        songElement.querySelector('.play-song').addEventListener('click', function() {
            const episodeId = this.dataset.episodeId;
            const timestamp = parseFloat(this.dataset.timestamp);
            
            const episode = window.episodes.find(ep => ep.id === episodeId);
            
            if (episode) {
                loadEpisode(episode, timestamp);
            }
        });
        
        songElement.querySelector('.remove-song').addEventListener('click', function() {
            const songId = this.dataset.id;
            removeFavoriteSong(songId);
        });
    });
}

// Load downloads
function loadDownloads() {
    console.log('Loading downloads');
    
    // Show loading
    document.querySelector('.downloads-container').innerHTML = '<div class="loading">Downloads laden...</div>';
    
    // Fetch downloads from API
    fetch('/api/downloads')
        .then(response => response.json())
        .then(data => {
            if (data.downloads && Array.isArray(data.downloads)) {
                window.downloads = data.downloads;
                console.log(`Loaded ${window.downloads.length} downloads`);
                
                // Update UI
                updateDownloadsUI();
            }
        })
        .catch(error => {
            console.error('Error loading downloads:', error);
            document.querySelector('.downloads-container').innerHTML = '<div class="error">Fout bij het laden van downloads. Probeer het later opnieuw.</div>';
        });
}

// Update downloads UI
function updateDownloadsUI() {
    const downloadsContainer = document.querySelector('.downloads-container');
    
    if (!window.downloads || window.downloads.length === 0) {
        downloadsContainer.innerHTML = '<div class="empty">Geen downloads gevonden</div>';
        return;
    }
    
    // Clear container
    downloadsContainer.innerHTML = '';
    
    // Add downloads
    window.downloads.forEach(download => {
        const downloadElement = document.createElement('div');
        downloadElement.className = 'episode';
        downloadElement.dataset.id = download.id;
        
        const isFavorite = window.favorites.some(fav => fav.id === download.id);
        
        downloadElement.innerHTML = `
            <div class="episode-image">
                <img src="${download.image || '/static/img/default-cover.jpg'}" alt="${download.title}">
            </div>
            <div class="episode-info">
                <h3>${download.title}</h3>
                <p class="episode-date">${formatDate(download.date)}</p>
                <p class="episode-duration">${formatDuration(download.duration)}</p>
                <p class="download-status">${download.status}</p>
                ${download.progress ? `<div class="progress-bar"><div class="progress" style="width: ${download.progress}%"></div></div>` : ''}
            </div>
            <div class="episode-actions">
                <button class="play-episode" data-id="${download.id}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="favorite-episode ${isFavorite ? 'active' : ''}" data-id="${download.id}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="remove-download" data-id="${download.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        downloadsContainer.appendChild(downloadElement);
        
        // Add event listeners
        downloadElement.querySelector('.play-episode').addEventListener('click', function() {
            const episodeId = this.dataset.id;
            const episode = window.episodes.find(ep => ep.id === episodeId);
            
            if (episode) {
                loadEpisode(episode);
            }
        });
        
        downloadElement.querySelector('.favorite-episode').addEventListener('click', function() {
            const episodeId = this.dataset.id;
            toggleFavoriteEpisode(episodeId);
        });
        
        downloadElement.querySelector('.remove-download').addEventListener('click', function() {
            const episodeId = this.dataset.id;
            removeDownload(episodeId);
        });
    });
}

// Update home section
function updateHomeSection() {
    // Update recent episodes
    const recentEpisodesElement = document.getElementById('recent-episodes');
    
    if (window.playbackHistory.length === 0) {
        recentEpisodesElement.innerHTML = '<p>Geen recente afleveringen</p>';
    } else {
        recentEpisodesElement.innerHTML = '';
        
        // Get last 5 unique episodes
        const uniqueEpisodes = [];
        const uniqueEpisodeIds = new Set();
        
        for (const episodeId of window.playbackHistory) {
            if (!uniqueEpisodeIds.has(episodeId)) {
                const episode = window.episodes.find(ep => ep.id === episodeId);
                
                if (episode) {
                    uniqueEpisodes.push(episode);
                    uniqueEpisodeIds.add(episodeId);
                    
                    if (uniqueEpisodes.length >= 5) {
                        break;
                    }
                }
            }
        }
        
        // Add recent episodes
        uniqueEpisodes.forEach(episode => {
            const episodeElement = document.createElement('div');
            episodeElement.className = 'home-episode';
            episodeElement.dataset.id = episode.id;
            
            episodeElement.innerHTML = `
                <div class="home-episode-image">
                    <img src="${episode.image || '/static/img/default-cover.jpg'}" alt="${episode.title}">
                </div>
                <div class="home-episode-info">
                    <h4 class="home-episode-title">${episode.title}</h4>
                    <p class="home-episode-date">${formatDate(episode.date)}</p>
                </div>
            `;
            
            recentEpisodesElement.appendChild(episodeElement);
            
            // Add click event
            episodeElement.addEventListener('click', function() {
                const episodeId = this.dataset.id;
                const episode = window.episodes.find(ep => ep.id === episodeId);
                
                if (episode) {
                    loadEpisode(episode);
                }
            });
        });
    }
    
    // Update favorite episodes
    const favoriteEpisodesElement = document.getElementById('favorite-episodes');
    
    if (window.favorites.length === 0) {
        favoriteEpisodesElement.innerHTML = '<p>Geen favorieten</p>';
    } else {
        favoriteEpisodesElement.innerHTML = '';
        
        // Get last 5 favorites
        const recentFavorites = window.favorites.slice(0, 5);
        
        // Add favorite episodes
        recentFavorites.forEach(episode => {
            const episodeElement = document.createElement('div');
            episodeElement.className = 'home-episode';
            episodeElement.dataset.id = episode.id;
            
            episodeElement.innerHTML = `
                <div class="home-episode-image">
                    <img src="${episode.image || '/static/img/default-cover.jpg'}" alt="${episode.title}">
                </div>
                <div class="home-episode-info">
                    <h4 class="home-episode-title">${episode.title}</h4>
                    <p class="home-episode-date">${formatDate(episode.date)}</p>
                </div>
            `;
            
            favoriteEpisodesElement.appendChild(episodeElement);
            
            // Add click event
            episodeElement.addEventListener('click', function() {
                const episodeId = this.dataset.id;
                const episode = window.episodes.find(ep => ep.id === episodeId);
                
                if (episode) {
                    loadEpisode(episode);
                }
            });
        });
    }
}

// Load episode
function loadEpisode(episode, startTime = 0) {
    console.log(`Loading episode: ${episode.title}`);
    
    // Update current episode
    window.currentEpisode = episode;
    
    // Add to playback history
    window.playbackHistory.unshift(episode.id);
    
    // Update now playing
    updateNowPlaying(episode);
    
    // Load audio in wavesurfer
    if (window.wavesurfer) {
        window.wavesurfer.load(episode.audioUrl);
        
        // Set start time and play when ready
        window.wavesurfer.once('ready', function() {
            // Skip ads if at beginning
            if (startTime === 0 && episode.adDuration) {
                startTime = episode.adDuration;
            }
            
            // Set start time
            if (startTime > 0) {
                window.wavesurfer.setCurrentTime(startTime);
            }
            
            // Play
            window.wavesurfer.play();
            
            // Update play button
            document.getElementById('play-button').innerHTML = '<i class="fas fa-pause"></i>';
            
            // Enable player controls
            document.getElementById('play-button').disabled = false;
            document.getElementById('favorite-button').disabled = false;
            document.getElementById('mark-song-button').disabled = false;
            
            // Update favorite button
            updateFavoriteButton();
        });
    }
    
    // Update home section
    updateHomeSection();
}

// Update now playing
function updateNowPlaying(episode) {
    const nowPlaying = document.querySelector('.now-playing');
    
    nowPlaying.innerHTML = `
        <div class="episode-image">
            <img src="${episode.image || '/static/img/default-cover.jpg'}" alt="${episode.title}">
        </div>
        <div class="episode-info">
            <h3>${episode.title}</h3>
            <p>${formatDate(episode.date)}</p>
        </div>
    `;
}

// Play next episode
function playNextEpisode() {
    if (!window.currentEpisode || !window.episodes || window.episodes.length === 0) {
        return;
    }
    
    let nextEpisode;
    
    if (window.isShuffleEnabled) {
        // Get random episode
        const availableEpisodes = window.episodes.filter(ep => ep.id !== window.currentEpisode.id);
        
        if (availableEpisodes.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableEpisodes.length);
            nextEpisode = availableEpisodes[randomIndex];
        }
    } else {
        // Get next episode in list
        const currentIndex = window.episodes.findIndex(ep => ep.id === window.currentEpisode.id);
        
        if (currentIndex !== -1 && currentIndex < window.episodes.length - 1) {
            nextEpisode = window.episodes[currentIndex + 1];
        } else if (window.isContinuousEnabled) {
            // Loop back to first episode
            nextEpisode = window.episodes[0];
        }
    }
    
    if (nextEpisode) {
        loadEpisode(nextEpisode);
    }
}

// Play previous episode
function playPreviousEpisode() {
    if (!window.currentEpisode || !window.episodes || window.episodes.length === 0) {
        return;
    }
    
    // If current time is more than 3 seconds, restart current episode
    if (window.wavesurfer && window.wavesurfer.getCurrentTime() > 3) {
        window.wavesurfer.setCurrentTime(0);
        return;
    }
    
    let previousEpisode;
    
    if (window.playbackHistory.length > 1) {
        // Get previous episode from history
        const previousEpisodeId = window.playbackHistory[1];
        previousEpisode = window.episodes.find(ep => ep.id === previousEpisodeId);
    } else {
        // Get previous episode in list
        const currentIndex = window.episodes.findIndex(ep => ep.id === window.currentEpisode.id);
        
        if (currentIndex > 0) {
            previousEpisode = window.episodes[currentIndex - 1];
        } else if (window.isContinuousEnabled) {
            // Loop back to last episode
            previousEpisode = window.episodes[window.episodes.length - 1];
        }
    }
    
    if (previousEpisode) {
        loadEpisode(previousEpisode);
    }
}

// Toggle shuffle
function toggleShuffle() {
    window.isShuffleEnabled = !window.isShuffleEnabled;
    
    // Update button
    const shuffleButton = document.getElementById('shuffle-button');
    
    if (window.isShuffleEnabled) {
        shuffleButton.classList.add('active');
    } else {
        shuffleButton.classList.remove('active');
    }
}

// Toggle continuous
function toggleContinuous() {
    window.isContinuousEnabled = !window.isContinuousEnabled;
    
    // Update button
    const continuousButton = document.getElementById('continuous-button');
    
    if (window.isContinuousEnabled) {
        continuousButton.classList.add('active');
    } else {
        continuousButton.classList.remove('active');
    }
}

// Toggle favorite
function toggleFavorite() {
    if (!window.currentEpisode) {
        return;
    }
    
    toggleFavoriteEpisode(window.currentEpisode.id);
}

// Toggle favorite episode
function toggleFavoriteEpisode(episodeId) {
    const episode = window.episodes.find(ep => ep.id === episodeId);
    
    if (!episode) {
        return;
    }
    
    const isFavorite = window.favorites.some(fav => fav.id === episodeId);
    
    if (isFavorite) {
        // Remove from favorites
        window.favorites = window.favorites.filter(fav => fav.id !== episodeId);
        
        // Update API
        fetch(`/api/favorites/${episodeId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    console.log(`Removed episode ${episodeId} from favorites`);
                }
            })
            .catch(error => {
                console.error('Error removing favorite:', error);
            });
    } else {
        // Add to favorites
        window.favorites.push(episode);
        
        // Update API
        fetch('/api/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ episodeId })
        })
            .then(response => {
                if (response.ok) {
                    console.log(`Added episode ${episodeId} to favorites`);
                }
            })
            .catch(error => {
                console.error('Error adding favorite:', error);
            });
    }
    
    // Update UI
    updateFavoritesUI();
    updateEpisodesUI();
    updateHomeSection();
    updateFavoriteButton();
}

// Update favorite button
function updateFavoriteButton() {
    if (!window.currentEpisode) {
        return;
    }
    
    const favoriteButton = document.getElementById('favorite-button');
    const isFavorite = window.favorites.some(fav => fav.id === window.currentEpisode.id);
    
    if (isFavorite) {
        favoriteButton.innerHTML = '<i class="fas fa-heart"></i>';
        favoriteButton.classList.add('active');
    } else {
        favoriteButton.innerHTML = '<i class="far fa-heart"></i>';
        favoriteButton.classList.remove('active');
    }
}

// Open song marker modal
function openSongMarkerModal() {
    if (!window.wavesurfer || !window.currentEpisode) {
        return;
    }
    
    const currentTime = window.wavesurfer.getCurrentTime();
    const modal = document.getElementById('song-marker-modal');
    
    // Set timestamp
    document.getElementById('marker-timestamp').textContent = formatTime(currentTime);
    
    // Clear inputs
    document.getElementById('song-title').value = '';
    document.getElementById('song-artist').value = '';
    
    // Clear Spotify results
    document.getElementById('spotify-results').innerHTML = '';
    
    // Show modal
    modal.style.display = 'block';
}

// Save song marker
function saveSongMarker() {
    if (!window.wavesurfer || !window.currentEpisode) {
        return;
    }
    
    const currentTime = window.wavesurfer.getCurrentTime();
    const title = document.getElementById('song-title').value;
    const artist = document.getElementById('song-artist').value;
    
    if (!title || !artist) {
        alert('Vul een titel en artiest in');
        return;
    }
    
    // Get selected Spotify track
    const selectedTrack = document.querySelector('.spotify-track.selected');
    let spotifyUrl = null;
    let spotifyId = null;
    
    if (selectedTrack) {
        spotifyUrl = selectedTrack.dataset.url;
        spotifyId = selectedTrack.dataset.id;
    }
    
    // Create song marker
    const marker = {
        id: Date.now().toString(),
        episodeId: window.currentEpisode.id,
        episodeTitle: window.currentEpisode.title,
        timestamp: currentTime,
        title,
        artist,
        spotifyUrl,
        spotifyId
    };
    
    // Add to favorite songs
    window.favoriteSongs.push(marker);
    
    // Update API
    fetch('/api/favorite-songs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(marker)
    })
        .then(response => {
            if (response.ok) {
                console.log(`Added song marker at ${formatTime(currentTime)}`);
                
                // Add marker to wavesurfer
                window.wavesurfer.markers.add([{
                    time: currentTime,
                    label: `${title} - ${artist}`,
                    color: '#ff5500'
                }]);
                
                // Update UI
                updateFavoriteSongsUI();
                
                // Close modal
                document.getElementById('song-marker-modal').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error adding song marker:', error);
        });
}

// Remove favorite song
function removeFavoriteSong(songId) {
    // Remove from favorite songs
    window.favoriteSongs = window.favoriteSongs.filter(song => song.id !== songId);
    
    // Update API
    fetch(`/api/favorite-songs/${songId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (response.ok) {
                console.log(`Removed song ${songId} from favorites`);
                
                // Update UI
                updateFavoriteSongsUI();
            }
        })
        .catch(error => {
            console.error('Error removing favorite song:', error);
        });
}

// Download episode
function downloadEpisode(episodeId) {
    const episode = window.episodes.find(ep => ep.id === episodeId);
    
    if (!episode) {
        return;
    }
    
    // Check if already downloaded
    if (window.downloads.some(dl => dl.id === episodeId)) {
        alert('Deze aflevering is al gedownload of wordt momenteel gedownload');
        return;
    }
    
    // Add to downloads
    const download = {
        ...episode,
        status: 'downloading',
        progress: 0
    };
    
    window.downloads.push(download);
    
    // Update UI
    updateDownloadsUI();
    
    // Start download
    fetch(`/api/episodes/${episodeId}/download`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Download failed');
        })
        .then(data => {
            console.log(`Started download for episode ${episodeId}`);
            
            // Simulate download progress
            const interval = setInterval(() => {
                const downloadIndex = window.downloads.findIndex(dl => dl.id === episodeId);
                
                if (downloadIndex !== -1) {
                    window.downloads[downloadIndex].progress += 10;
                    
                    if (window.downloads[downloadIndex].progress >= 100) {
                        window.downloads[downloadIndex].progress = 100;
                        window.downloads[downloadIndex].status = 'completed';
                        clearInterval(interval);
                    }
                    
                    // Update UI
                    updateDownloadsUI();
                } else {
                    clearInterval(interval);
                }
            }, 1000);
        })
        .catch(error => {
            console.error('Error downloading episode:', error);
            
            // Update download status
            const downloadIndex = window.downloads.findIndex(dl => dl.id === episodeId);
            
            if (downloadIndex !== -1) {
                window.downloads[downloadIndex].status = 'failed';
                window.downloads[downloadIndex].progress = 0;
                
                // Update UI
                updateDownloadsUI();
            }
        });
}

// Download all episodes
function downloadAllEpisodes() {
    if (!window.episodes || window.episodes.length === 0) {
        return;
    }
    
    // Confirm
    if (!confirm(`Weet je zeker dat je alle ${window.episodes.length} afleveringen wilt downloaden? Dit kan veel schijfruimte in beslag nemen.`)) {
        return;
    }
    
    // Get episodes that are not already downloaded
    const episodesToDownload = window.episodes.filter(ep => !window.downloads.some(dl => dl.id === ep.id));
    
    if (episodesToDownload.length === 0) {
        alert('Alle afleveringen zijn al gedownload of worden momenteel gedownload');
        return;
    }
    
    // Download each episode
    episodesToDownload.forEach(episode => {
        downloadEpisode(episode.id);
    });
}

// Remove download
function removeDownload(episodeId) {
    // Confirm
    if (!confirm('Weet je zeker dat je deze download wilt verwijderen?')) {
        return;
    }
    
    // Remove from downloads
    window.downloads = window.downloads.filter(dl => dl.id !== episodeId);
    
    // Update API
    fetch(`/api/downloads/${episodeId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (response.ok) {
                console.log(`Removed download ${episodeId}`);
                
                // Update UI
                updateDownloadsUI();
            }
        })
        .catch(error => {
            console.error('Error removing download:', error);
        });
}

// Format date
function formatDate(dateString) {
    if (!dateString) {
        return '';
    }
    
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL');
}

// Format duration
function formatDuration(seconds) {
    if (!seconds) {
        return '00:00';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Format time
function formatTime(seconds) {
    if (!seconds) {
        return '0:00';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
