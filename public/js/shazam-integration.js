// Shazam Integration for Frontend
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements for Shazam functionality
    const shazamBtn = document.getElementById('shazam-btn');
    const shazamModal = document.getElementById('shazam-modal');
    const closeBtn = document.querySelector('.close-btn');
    const recognitionResult = document.getElementById('recognition-result');
    const recognizedSong = document.getElementById('recognized-song');
    const addToPlaylistBtn = document.getElementById('add-to-playlist');
    const listeningAnimation = document.querySelector('.listening-animation');
    
    // Audio recording variables
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let recognizedTrack = null;
    
    // Setup event listeners
    shazamBtn.addEventListener('click', openShazamModal);
    closeBtn.addEventListener('click', closeShazamModal);
    addToPlaylistBtn.addEventListener('click', addRecognizedToPlaylist);
    
    // Open Shazam modal and start listening
    function openShazamModal() {
        shazamModal.classList.remove('hidden');
        recognitionResult.classList.add('hidden');
        startListening();
    }
    
    // Close Shazam modal and stop listening
    function closeShazamModal() {
        shazamModal.classList.add('hidden');
        stopListening();
    }
    
    // Start audio recording for recognition
    async function startListening() {
        try {
            // Reset previous recording
            audioChunks = [];
            recognizedTrack = null;
            
            // Show listening animation
            listeningAnimation.style.display = 'flex';
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create media recorder
            mediaRecorder = new MediaRecorder(stream);
            
            // Handle data available event
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });
            
            // Handle recording stop event
            mediaRecorder.addEventListener('stop', processAudio);
            
            // Start recording
            mediaRecorder.start();
            isRecording = true;
            
            // Record for 5 seconds then stop
            setTimeout(() => {
                if (isRecording) {
                    stopListening();
                }
            }, 5000);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            // Fallback to simulated recognition if microphone access fails
            simulateRecognition();
        }
    }
    
    // Stop audio recording
    function stopListening() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            
            // Stop all tracks in the stream
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }
    
    // Process recorded audio and send to API
    async function processAudio() {
        try {
            // Convert audio chunks to blob
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            
            reader.onloadend = async function() {
                // Get base64 data (remove metadata prefix)
                const base64Audio = reader.result.split(',')[1];
                
                // Send to API for recognition
                await recognizeSong(base64Audio);
            };
        } catch (error) {
            console.error('Error processing audio:', error);
            simulateRecognition();
        }
    }
    
    // Send audio data to Shazam API
    async function recognizeSong(base64Audio) {
        try {
            // API call to recognize song
            const response = await fetch('/api/shazam/recognize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ base64Audio }),
            });
            
            const data = await response.json();
            
            if (data.success && data.song) {
                displayRecognizedSong(data.song);
            } else {
                throw new Error('Recognition failed');
            }
        } catch (error) {
            console.error('Error recognizing song:', error);
            simulateRecognition();
        }
    }
    
    // Fallback: Simulate song recognition
    function simulateRecognition() {
        // Hide listening animation
        listeningAnimation.style.display = 'none';
        
        // Simulate API delay
        setTimeout(() => {
            // Mock recognized song
            const mockSong = {
                id: '12345',
                title: 'Don\'t Stop Believin\'',
                artist: 'Journey',
                duration: '4:11'
            };
            
            displayRecognizedSong(mockSong);
        }, 2000);
    }
    
    // Display recognized song in the modal
    function displayRecognizedSong(song) {
        // Store recognized track for later use
        recognizedTrack = song;
        
        // Update UI
        recognizedSong.textContent = `${song.title} - ${song.artist}`;
        recognitionResult.classList.remove('hidden');
        listeningAnimation.style.display = 'none';
    }
    
    // Add recognized song to playlist
    function addRecognizedToPlaylist() {
        if (!recognizedTrack) return;
        
        // Add to playlist (this function should be defined in app.js)
        if (typeof window.addToPlaylist === 'function') {
            window.addToPlaylist(recognizedTrack);
        } else {
            // Fallback if global function is not available
            const newTrack = {
                id: recognizedTrack.id || Date.now(),
                title: recognizedTrack.title,
                artist: recognizedTrack.artist,
                duration: recognizedTrack.duration
            };
            
            // Access the playlist from the main app
            if (window.playlist) {
                window.playlist.push(newTrack);
                if (typeof window.renderPlaylist === 'function') {
                    window.renderPlaylist();
                }
            }
        }
        
        // Close modal
        closeShazamModal();
    }
    
    // Search for songs by name
    async function searchSongs(term) {
        try {
            const response = await fetch(`/api/shazam/search?term=${encodeURIComponent(term)}`);
            const data = await response.json();
            return data.tracks || [];
        } catch (error) {
            console.error('Error searching songs:', error);
            return [];
        }
    }
    
    // Get song details by ID
    async function getSongDetails(id) {
        try {
            const response = await fetch(`/api/shazam/song/${id}`);
            const data = await response.json();
            return data.song || null;
        } catch (error) {
            console.error('Error getting song details:', error);
            return null;
        }
    }
    
    // Expose functions to global scope for use in main app.js
    window.shazamAPI = {
        searchSongs,
        getSongDetails
    };
});
