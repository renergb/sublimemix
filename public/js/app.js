// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const shazamBtn = document.getElementById('shazam-btn');
    const playlistEl = document.getElementById('playlist');
    const currentTrackEl = document.getElementById('current-track');
    const prevBtn = document.getElementById('prev-btn');
    const playBtn = document.getElementById('play-btn');
    const nextBtn = document.getElementById('next-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userProfile = document.querySelector('.user-profile');
    const usernameEl = document.getElementById('username');
    
    // Shazam Modal Elements
    const shazamModal = document.getElementById('shazam-modal');
    const closeBtn = document.querySelector('.close-btn');
    const recognitionResult = document.getElementById('recognition-result');
    const recognizedSong = document.getElementById('recognized-song');
    const addToPlaylistBtn = document.getElementById('add-to-playlist');
    
    // Sample playlist data (will be replaced with API data)
    let playlist = [
        { id: 1, title: 'Dancing Queen', artist: 'ABBA', duration: '3:51' },
        { id: 2, title: 'Bohemian Rhapsody', artist: 'Queen', duration: '5:55' },
        { id: 3, title: 'Billie Jean', artist: 'Michael Jackson', duration: '4:54' }
    ];
    
    let currentTrackIndex = -1;
    let isPlaying = false;
    
    // Initialize the application
    function init() {
        renderPlaylist();
        setupEventListeners();
        checkLoginStatus();
    }
    
    // Render the playlist
    function renderPlaylist() {
        playlistEl.innerHTML = '';
        
        if (playlist.length === 0) {
            playlistEl.innerHTML = '<li class="empty-playlist">Geen nummers in de afspeellijst</li>';
            return;
        }
        
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.dataset.id = track.id;
            li.dataset.index = index;
            
            li.innerHTML = `
                <div class="track-info">
                    <strong>${track.title}</strong> - ${track.artist}
                </div>
                <div class="track-controls">
                    <span class="duration">${track.duration}</span>
                    <button class="play-track-btn" data-index="${index}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="remove-track-btn" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            playlistEl.appendChild(li);
        });
        
        // Add event listeners to the newly created buttons
        document.querySelectorAll('.play-track-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                playTrack(index);
            });
        });
        
        document.querySelectorAll('.remove-track-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                removeTrack(index);
            });
        });
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search functionality
        searchBtn.addEventListener('click', searchTracks);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchTracks();
            }
        });
        
        // Player controls
        playBtn.addEventListener('click', togglePlay);
        prevBtn.addEventListener('click', playPrevious);
        nextBtn.addEventListener('click', playNext);
        volumeSlider.addEventListener('input', adjustVolume);
        
        // Shazam integration
        shazamBtn.addEventListener('click', openShazamModal);
        closeBtn.addEventListener('click', closeShazamModal);
        addToPlaylistBtn.addEventListener('click', addRecognizedToPlaylist);
        
        // User authentication
        loginBtn.addEventListener('click', login);
        logoutBtn.addEventListener('click', logout);
    }
    
    // Check login status
    function checkLoginStatus() {
        // This would normally check with a backend API
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn) {
            const username = localStorage.getItem('username') || 'Gebruiker';
            usernameEl.textContent = username;
            loginBtn.classList.add('hidden');
            userProfile.classList.remove('hidden');
        } else {
            loginBtn.classList.remove('hidden');
            userProfile.classList.add('hidden');
        }
    }
    
    // Login function
    function login() {
        // This would normally authenticate with a backend API
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', 'Demo Gebruiker');
        checkLoginStatus();
    }
    
    // Logout function
    function logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        checkLoginStatus();
    }
    
    // Search tracks function
    function searchTracks() {
        const query = searchInput.value.trim();
        
        if (!query) return;
        
        // This would normally search via an API
        console.log(`Searching for: ${query}`);
        
        // Simulate search results
        setTimeout(() => {
            // Mock search results
            const searchResults = [
                { id: 4, title: 'Shape of You', artist: 'Ed Sheeran', duration: '3:53' },
                { id: 5, title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20' }
            ];
            
            // Add search results to playlist
            playlist = [...playlist, ...searchResults];
            renderPlaylist();
            
            // Clear search input
            searchInput.value = '';
        }, 1000);
    }
    
    // Play track function
    function playTrack(index) {
        if (index < 0 || index >= playlist.length) return;
        
        currentTrackIndex = index;
        const track = playlist[currentTrackIndex];
        
        currentTrackEl.innerHTML = `
            <strong>${track.title}</strong>
            <p>${track.artist}</p>
        `;
        
        // Update play button icon
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        
        // Highlight current track in playlist
        document.querySelectorAll('#playlist li').forEach((li, i) => {
            if (i === currentTrackIndex) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
        
        // This would normally play the actual audio
        console.log(`Playing: ${track.title} by ${track.artist}`);
    }
    
    // Toggle play/pause
    function togglePlay() {
        if (currentTrackIndex === -1 && playlist.length > 0) {
            // If no track is selected, play the first one
            playTrack(0);
            return;
        }
        
        isPlaying = !isPlaying;
        
        if (isPlaying) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            // This would normally resume playback
            console.log('Resuming playback');
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            // This would normally pause playback
            console.log('Pausing playback');
        }
    }
    
    // Play previous track
    function playPrevious() {
        if (playlist.length === 0) return;
        
        let newIndex = currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = playlist.length - 1;
        }
        
        playTrack(newIndex);
    }
    
    // Play next track
    function playNext() {
        if (playlist.length === 0) return;
        
        let newIndex = currentTrackIndex + 1;
        if (newIndex >= playlist.length) {
            newIndex = 0;
        }
        
        playTrack(newIndex);
    }
    
    // Adjust volume
    function adjustVolume() {
        const volume = volumeSlider.value;
        // This would normally adjust the actual audio volume
        console.log(`Volume set to: ${volume}%`);
    }
    
    // Remove track from playlist
    function removeTrack(index) {
        if (index < 0 || index >= playlist.length) return;
        
        // If removing currently playing track
        if (index === currentTrackIndex) {
            currentTrackEl.innerHTML = '<p>Geen nummer geselecteerd</p>';
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            currentTrackIndex = -1;
        } else if (index < currentTrackIndex) {
            // If removing a track before the current one, adjust the index
            currentTrackIndex--;
        }
        
        // Remove the track and update the playlist
        playlist.splice(index, 1);
        renderPlaylist();
    }
    
    // Shazam integration functions
    function openShazamModal() {
        shazamModal.classList.remove('hidden');
        recognitionResult.classList.add('hidden');
        
        // Simulate listening for audio
        setTimeout(() => {
            // Mock recognition result
            recognizedSong.textContent = 'Don\'t Stop Believin\' - Journey';
            recognitionResult.classList.remove('hidden');
        }, 3000);
    }
    
    function closeShazamModal() {
        shazamModal.classList.add('hidden');
    }
    
    function addRecognizedToPlaylist() {
        // Add the recognized song to the playlist
        const newTrack = {
            id: Date.now(), // Use timestamp as a simple unique ID
            title: 'Don\'t Stop Believin\'',
            artist: 'Journey',
            duration: '4:11'
        };
        
        playlist.push(newTrack);
        renderPlaylist();
        closeShazamModal();
        
        // Optionally play the newly added track
        playTrack(playlist.length - 1);
    }
    
    // Initialize the app
    init();
});
