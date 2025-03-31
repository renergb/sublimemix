// WaveSurfer initialization and waveform functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize WaveSurfer
    initWaveSurfer();
});

// Initialize WaveSurfer
function initWaveSurfer() {
    console.log('Initializing WaveSurfer');
    
    // Create WaveSurfer instance
    window.wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#1db954',
        progressColor: '#ffffff',
        cursorColor: '#ff5500',
        barWidth: 2,
        barGap: 1,
        height: 60,
        responsive: true,
        normalize: true,
        plugins: [
            WaveSurfer.timeline.create({
                container: '#waveform-timeline',
                primaryFontColor: '#ffffff',
                secondaryFontColor: '#b3b3b3',
                primaryColor: '#b3b3b3',
                secondaryColor: '#535353',
                timeInterval: 30,
                primaryLabelInterval: 5,
                secondaryLabelInterval: 1
            }),
            WaveSurfer.markers.create({
                container: '#song-markers'
            })
        ]
    });
    
    // Add event listeners
    wavesurfer.on('ready', function() {
        console.log('WaveSurfer is ready');
        
        // Update duration
        document.getElementById('duration').textContent = formatTime(wavesurfer.getDuration());
        
        // Enable play button
        document.getElementById('play-button').disabled = false;
        
        // Load markers for current episode
        loadMarkers();
    });
    
    wavesurfer.on('play', function() {
        document.getElementById('play-button').innerHTML = '<i class="fas fa-pause"></i>';
    });
    
    wavesurfer.on('pause', function() {
        document.getElementById('play-button').innerHTML = '<i class="fas fa-play"></i>';
    });
    
    wavesurfer.on('audioprocess', function() {
        // Update current time
        document.getElementById('current-time').textContent = formatTime(wavesurfer.getCurrentTime());
    });
    
    wavesurfer.on('finish', function() {
        console.log('Playback finished');
        
        // Play next episode if continuous play is enabled
        if (window.isContinuousEnabled) {
            playNextEpisode();
        }
    });
    
    wavesurfer.on('error', function(error) {
        console.error('WaveSurfer error:', error);
        
        // Show error message
        alert('Er is een fout opgetreden bij het afspelen van deze aflevering. Probeer het later opnieuw.');
        
        // Reset play button
        document.getElementById('play-button').innerHTML = '<i class="fas fa-play"></i>';
    });
    
    // Add marker click event
    wavesurfer.on('marker-click', function(marker) {
        console.log('Marker clicked:', marker);
        
        // Find corresponding song
        const song = window.favoriteSongs.find(song => 
            song.episodeId === window.currentEpisode.id && 
            Math.abs(song.timestamp - marker.time) < 1
        );
        
        if (song) {
            // Show song info
            alert(`${song.title} - ${song.artist}${song.spotifyUrl ? '\n\nOpen in Spotify: ' + song.spotifyUrl : ''}`);
        }
    });
}

// Load markers for current episode
function loadMarkers() {
    if (!window.wavesurfer || !window.currentEpisode || !window.favoriteSongs) {
        return;
    }
    
    // Clear existing markers
    window.wavesurfer.markers.clear();
    
    // Get markers for current episode
    const episodeMarkers = window.favoriteSongs.filter(song => song.episodeId === window.currentEpisode.id);
    
    if (episodeMarkers.length === 0) {
        return;
    }
    
    // Add markers
    episodeMarkers.forEach(song => {
        window.wavesurfer.markers.add([{
            time: song.timestamp,
            label: `${song.title} - ${song.artist}`,
            color: '#ff5500',
            position: 'top'
        }]);
    });
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    if (!seconds) {
        return '0:00';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
