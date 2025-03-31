/* Error Handling Implementation

This code implements improved error handling for server communication in the 
Sublime Weekendmix Jukebox application, particularly addressing the issues
with loading favorite songs and other API requests.
*/

// 1. Error Handling Service
class ErrorHandlingService {
  constructor() {
    this.retryDelays = [1000, 3000, 5000]; // Retry delays in milliseconds
    this.defaultErrorMessages = {
      network: "Netwerkfout: Controleer uw internetverbinding.",
      server: "Serverfout: Er is een probleem met de server. Probeer het later opnieuw.",
      auth: "Authenticatiefout: U bent niet geautoriseerd voor deze actie.",
      notFound: "Niet gevonden: De gevraagde gegevens zijn niet gevonden.",
      timeout: "Time-out: Het verzoek heeft te lang geduurd.",
      unknown: "Onbekende fout: Er is een onverwachte fout opgetreden."
    };
  }

  // Handle fetch errors with retry mechanism
  async fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const fetchOptions = {
          ...options,
          signal: controller.signal
        };
        
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return response;
      } catch (error) {
        console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
        lastError = error;
        
        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          // Wait for the specified delay before retrying
          const delay = this.retryDelays[attempt] || 5000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw lastError;
  }
  
  // Get user-friendly error message based on error type
  getUserFriendlyErrorMessage(error) {
    // Network error
    if (!navigator.onLine || error.message === 'Network error') {
      return this.defaultErrorMessages.network;
    }
    
    // Timeout error
    if (error.name === 'AbortError') {
      return this.defaultErrorMessages.timeout;
    }
    
    // HTTP status errors
    if (error.message && error.message.includes('HTTP error!')) {
      const statusMatch = error.message.match(/Status: (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        
        if (status === 401 || status === 403) {
          return this.defaultErrorMessages.auth;
        }
        
        if (status === 404) {
          return this.defaultErrorMessages.notFound;
        }
        
        if (status >= 500) {
          return this.defaultErrorMessages.server;
        }
      }
    }
    
    // Default unknown error
    return this.defaultErrorMessages.unknown;
  }
  
  // Display error notification to user
  showErrorNotification(error, customMessage = null) {
    const message = customMessage || this.getUserFriendlyErrorMessage(error);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    
    // Create notification content
    notification.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-message">${message}</div>
      <button class="error-close">×</button>
    `;
    
    // Add notification to document
    document.body.appendChild(notification);
    
    // Add event listener to close button
    const closeButton = notification.querySelector('.error-close');
    closeButton.addEventListener('click', () => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    });
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('fade-out');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
    
    // Log error to console for debugging
    console.error('Application error:', error);
    
    return notification;
  }
  
  // Check if device is online
  isOnline() {
    return navigator.onLine;
  }
  
  // Add offline detection
  setupOfflineDetection() {
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
  }
  
  // Handle online/offline status change
  handleOnlineStatusChange() {
    if (navigator.onLine) {
      // Online - remove offline banner if exists
      const offlineBanner = document.querySelector('.offline-banner');
      if (offlineBanner) {
        offlineBanner.classList.add('fade-out');
        setTimeout(() => {
          if (document.body.contains(offlineBanner)) {
            document.body.removeChild(offlineBanner);
          }
        }, 300);
      }
      
      // Show online notification
      this.showNotification('Je bent weer online!', 'success');
      
      // Refresh data
      if (typeof window.refreshCurrentView === 'function') {
        window.refreshCurrentView();
      }
    } else {
      // Offline - show banner
      this.showOfflineBanner();
    }
  }
  
  // Show offline banner
  showOfflineBanner() {
    // Check if banner already exists
    if (document.querySelector('.offline-banner')) {
      return;
    }
    
    // Create banner
    const banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.innerHTML = `
      <div class="offline-icon">📶</div>
      <div class="offline-message">Je bent offline. Sommige functies zijn mogelijk niet beschikbaar.</div>
    `;
    
    // Add banner to document
    document.body.insertBefore(banner, document.body.firstChild);
  }
  
  // Show general notification
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add notification to document
    document.body.appendChild(notification);
    
    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
    
    return notification;
  }
}

// 2. API Service with Error Handling
class ApiService {
  constructor() {
    this.baseUrl = '/api';
    this.errorHandler = new ErrorHandlingService();
    this.errorHandler.setupOfflineDetection();
  }
  
  // Get episodes
  async getEpisodes() {
    try {
      const response = await this.errorHandler.fetchWithRetry(`${this.baseUrl}/episodes`);
      return await response.json();
    } catch (error) {
      this.errorHandler.showErrorNotification(error, 'Fout bij het laden van afleveringen');
      return { episodes: [] };
    }
  }
  
  // Get favorite episodes
  async getFavoriteEpisodes() {
    try {
      const response = await this.errorHandler.fetchWithRetry(`${this.baseUrl}/favorites`);
      return await response.json();
    } catch (error) {
      this.errorHandler.showErrorNotification(error, 'Fout bij het laden van favoriete afleveringen');
      return { favorites: [] };
    }
  }
  
  // Get favorite songs
  async getFavoriteSongs() {
    try {
      const response = await this.errorHandler.fetchWithRetry(`${this.baseUrl}/favorite-songs`);
      return await response.json();
    } catch (error) {
      this.errorHandler.showErrorNotification(error, 'Fout bij het laden van favoriete nummers');
      return { songs: [] };
    }
  }
  
  // Get downloads
  async getDownloads() {
    try {
      const response = await this.errorHandler.fetchWithRetry(`${this.baseUrl}/downloads`);
      return await response.json();
    } catch (error) {
      this.errorHandler.showErrorNotification(error, 'Fout bij het laden van downloads');
      return { downloads: [] };
    }
  }
  
  // Toggle favorite episode
  async toggleFavorite(episodeId) {
    try {
      const response = await this.errorHandler.fetchWithRetry(`${this.baseUrl}/episodes/${episodeId}/favorite`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      this.errorHandler.showErrorNotification(error, 'Fout bij het markeren als favoriet');
      throw error;
    }
  }
  
  // Add favorite song
  async addFavoriteSong(episodeId, timestamp, songData) {
    try {
      const response = await this.errorHandler.fetchWithRetry(`${this.baseUrl}/episodes/${episodeId}/favorite-song`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp,
          ...songData
        })
      });
      return await response.json();
    } catch (error) {
      this.errorHandler.showErrorNotification(error, 'Fout bij het markeren van favoriet nummer');
      throw error;
    }
  }
  
  // Download episode
  async downloadEpisode(episodeId) {
    try {
      const response = await this.errorHandler.fetchWithRetry(`${this.baseUrl}/episodes/${episodeId}/download`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      this.errorHandler.showErrorNotification(error, 'Fout bij het downloaden van aflevering');
      throw error;
    }
  }
  
  // Download all episodes
  async downloadAllEpisodes() {
    try {
      const response = await this.errorHandler.fetchWithRetry(`${this.baseUrl}/downloads/all`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      this.errorHandler.showErrorNotification(error, 'Fout bij het downloaden van alle afleveringen');
      throw error;
    }
  }
  
  // Get download status
  async getDownloadStatus(taskId) {
    try {
      const response = await this.errorHandler.fetchWithRetry(`${this.baseUrl}/downloads/${taskId}/status`);
      return await response.json();
    } catch (error) {
      console.error('Error getting download status:', error);
      // Don't show notification for status checks
      return { status: 'error', progress: 0 };
    }
  }
}

// 3. Favorite Songs Component with Error Handling
class FavoriteSongsComponent {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.apiService = new ApiService();
    this.errorHandler = new ErrorHandlingService();
    this.favoriteSongs = [];
  }
  
  // Initialize component
  init() {
    // Add refresh button event listener
    const refreshButton = document.querySelector('#refresh-button');
    if (refreshButton) {
      refreshButton.addEventListener('click', this.loadFavoriteSongs.bind(this));
    }
    
    // Initial load
    this.loadFavoriteSongs();
  }
  
  // Load favorite songs
  async loadFavoriteSongs() {
    // Show loading indicator
    this.showLoadingIndicator();
    
    try {
      // Check if online
      if (!this.errorHandler.isOnline()) {
        this.showOfflineState();
        return;
      }
      
      // Get favorite songs
      const data = await this.apiService.getFavoriteSongs();
      this.favoriteSongs = data.songs || [];
      
      // Render songs
      this.renderFavoriteSongs();
    } catch (error) {
      // Show error state
      this.showErrorState(error);
    } finally {
      // Hide loading indicator
      this.hideLoadingIndicator();
    }
  }
  
  // Render favorite songs
  renderFavoriteSongs() {
    // Get container
    const container = this.element.querySelector('.favorite-songs-container') || this.element;
    
    // Clear container
    container.innerHTML = '';
    
    // Show empty state if no songs
    if (this.favoriteSongs.length === 0) {
      this.showEmptyState(container);
      return;
    }
    
    // Create songs list
    const songsList = document.createElement('div');
    songsList.className = 'favorite-songs-list';
    
    // Add each song to the list
    this.favoriteSongs.forEach(song => {
      const songItem = document.createElement('div');
      songItem.className = 'favorite-song-item';
      songItem.innerHTML = `
        <div class="song-info">
          <h3>${song.title}</h3>
          <p>${song.artist}</p>
          <p class="episode-info">Uit: ${song.episodeTitle}</p>
        </div>
        <div class="song-actions">
          <button class="play-button" data-episode-id="${song.episodeId}" data-timestamp="${song.timestamp}">▶️</button>
          ${song.spotifyUrl ? `<a href="${song.spotifyUrl}" target="_blank" class="spotify-link">Spotify</a>` : ''}
          <button class="remove-button" data-id="${song.id}">🗑️</button>
        </div>
      `;
      songsList.appendChild(songItem);
    });
    
    // Add songs list to container
    container.appendChild(songsList);
    
    // Add event listeners
    this.addEventListeners();
  }
  
  // Add event listeners to song items
  addEventListeners() {
    // Play buttons
    const playButtons = this.element.querySelectorAll('.play-button');
    playButtons.forEach(button => {
      button.addEventListener('click', this.handlePlay.bind(this));
    });
    
    // Remove buttons
    const removeButtons = this.element.querySelectorAll('.remove-button');
    removeButtons.forEach(button => {
      button.addEventListener('click', this.handleRemove.bind(this));
    });
  }
  
  // Handle play button click
  handlePlay(event) {
    const episodeId = event.target.dataset.episodeId;
    const timestamp = event.target.dataset.timestamp;
    
    if (episodeId && timestamp && typeof window.playEpisodeAt === 'function') {
      window.playEpisodeAt(episodeId, parseInt(timestamp));
    }
  }
  
  // Handle remove button click
  async handleRemove(event) {
    const songId = event.target.dataset.id;
    if (!songId) return;
    
    // Confirm removal
    if (!confirm('Weet je zeker dat je dit nummer wilt verwijderen uit je favorieten?')) {
      return;
    }
    
    try {
      // Remove song
      await this.apiService.removeFavoriteSong(songId);
      
      // Show success notification
      this.errorHandler.showNotification('Nummer verwijderd uit favorieten', 'success');
      
      // Reload songs
      this.loadFavoriteSongs();
    } catch (error) {
      // Error is already handled by API service
    }
  }
  
  // Show loading indicator
  showLoadingIndicator() {
    let loadingIndicator = this.element.querySelector('.loading-indicator');
    
    if (!loadingIndicator) {
      loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Favoriete nummers laden...</p>
      `;
      this.element.appendChild(loadingIndicator);
    }
    
    loadingIndicator.style.display = 'flex';
  }
  
  // Hide loading indicator
  hideLoadingIndicator() {
    const loadingIndicator = this.element.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }
  
  // Show empty state
  showEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎵</div>
        <h3>Geen favoriete nummers gevonden</h3>
        <p>Markeer nummers als favoriet tijdens het afspelen van een aflevering.</p>
      </div>
    `;
  }
  
  // Show error state
  showErrorState(error) {
    const container = this.element.querySelector('.favorite-songs-container') || this.element;
    
    container.innerHTML = `
      <div class="error-state">
        <div class="error-state-icon">⚠️</div>
        <h3>Fout bij het laden van favoriete nummers</h3>
        <p>${this.errorHandler.getUserFriendlyErrorMessage(error)}</p>
        <button id="retry-button" class="primary-button">Opnieuw proberen</button>
      </div>
    `;
    
    // Add retry button event listener
    const retryButton = container.querySelector('#retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', this.loadFavoriteSongs.bind(this));
    }
  }
  
  // Show offline state
  showOfflineState() {
    const container = this.element.querySelector('.favorite-songs-container') || this.element;
    
    container.innerHTML = `
      <div class="offline-state">
        <div class="offline-state-icon">📶</div>
        <h3>Je bent offline</h3>
        <p>Verbind met internet om je favoriete nummers te bekijken.</p>
      </div>
    `;
  }
}

// 4. CSS for Error Handling UI
const errorHandlingStyles = `
  /* Error Notification */
  .error-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #f44336;
    color: white;
    padding: 15px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    z-index: 1000;
    max-width: 400px;
    animation: slide-in 0.3s ease-out;
  }
  
  @keyframes slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .error-notification.fade-out {
    animation: slide-out 0.3s ease-in;
  }
  
  @keyframes slide-out {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .error-icon {
    font-size: 24px;
    margin-right: 10px;
  }
  
  .error-message {
    flex: 1;
  }
  
  .error-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0 5px;
  }
  
  /* Notification */
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    animation: fade-in 0.3s ease-out;
  }
  
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .notification.fade-out {
    animation: fade-out 0.3s ease-in;
  }
  
  @keyframes fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  .notification.info {
    background-color: #2196F3;
  }
  
  .notification.success {
    background-color: #4CAF50;
  }
  
  .notification.warning {
    background-color: #FF9800;
  }
  
  .notification.error {
    background-color: #F44336;
  }
  
  /* Offline Banner */
  .offline-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #FF9800;
    color: white;
    padding: 10px;
    text-align: center;
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: slide-down 0.3s ease-out;
  }
  
  @keyframes slide-down {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }
  
  .offline-banner.fade-out {
    animation: slide-up 0.3s ease-in;
  }
  
  @keyframes slide-up {
    from { transform: translateY(0); }
    to { transform: translateY(-100%); }
  }
  
  .offline-icon {
    font-size: 18px;
    margin-right: 10px;
  }
  
  /* Error State */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    background-color: rgba(244, 67, 54, 0.1);
    border-radius: 8px;
    margin: 20px 0;
  }
  
  .error-state-icon {
    font-size: 48px;
    margin-bottom: 20px;
    color: #F44336;
  }
  
  /* Offline State */
  .offline-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    background-color: rgba(255, 152, 0, 0.1);
    border-radius: 8px;
    margin: 20px 0;
  }
  
  .offline-state-icon {
    font-size: 48px;
    margin-bottom: 20px;
    color: #FF9800;
  }
  
  /* Loading Indicator */
  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1000;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// 5. Initialize Error Handling
document.addEventListener('DOMContentLoaded', () => {
  // Add error handling styles
  const style = document.createElement('style');
  style.textContent = errorHandlingStyles;
  document.head.appendChild(style);
  
  // Initialize API service
  window.apiService = new ApiService();
  
  // Initialize favorite songs component
  const favoriteSongsComponent = new FavoriteSongsComponent('favorite-songs-section');
  favoriteSongsComponent.init();
  
  // Add global refresh function
  window.refreshCurrentView = () => {
    const currentSection = document.querySelector('.section:not([style*="display: none"])');
    if (currentSection) {
      const sectionId = currentSection.id;
      
      switch (sectionId) {
        case 'home-section':
          // Refresh home section
          if (typeof window.refreshHome === 'function') {
            window.refreshHome();
          }
          break;
        case 'episodes-section':
          // Refresh episodes section
          if (typeof window.refreshEpisodes === 'function') {
            window.refreshEpisodes();
          }
          break;
        case 'favorites-section':
          // Refresh favorites section
          if (typeof window.refreshFavorites === 'function') {
            window.refreshFavorites();
          }
          break;
        case 'favorite-songs-section':
          // Refresh favorite songs section
          favoriteSongsComponent.loadFavoriteSongs();
          break;
        case 'downloads-section':
          // Refresh downloads section
          if (typeof window.refreshDownloads === 'function') {
            window.refreshDownloads();
          }
          break;
      }
    }
  };
});
