/* Download Functionality Optimization

This code implements optimized download functionality for the Sublime Weekendmix Jukebox application,
addressing issues with the Downloads section and providing better user feedback during downloads.
*/

// 1. Download Manager Class
class DownloadManager {
  constructor() {
    this.downloads = [];
    this.activeDownloads = new Map(); // Map of taskId -> download info
    this.maxConcurrentDownloads = 3;
    this.apiService = window.apiService || new ApiService();
    this.statusCheckInterval = 2000; // Check status every 2 seconds
    this.statusCheckIntervalIds = new Map(); // Map of taskId -> interval ID
  }
  
  // Initialize download manager
  init() {
    // Load existing downloads
    this.loadDownloads();
    
    // Resume any pending downloads
    this.resumePendingDownloads();
  }
  
  // Load downloads from storage
  async loadDownloads() {
    try {
      // Get downloads from API
      const response = await this.apiService.getDownloads();
      this.downloads = response.downloads || [];
      
      // Dispatch event to notify components
      this.dispatchDownloadsUpdatedEvent();
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  }
  
  // Resume pending downloads
  async resumePendingDownloads() {
    // Find downloads with 'pending' or 'downloading' status
    const pendingDownloads = this.downloads.filter(download => 
      download.status === 'pending' || download.status === 'downloading');
    
    // Resume each pending download
    for (const download of pendingDownloads) {
      if (this.activeDownloads.size < this.maxConcurrentDownloads) {
        this.monitorDownloadProgress(download.taskId, download.episodeId);
      }
    }
  }
  
  // Start download for an episode
  async downloadEpisode(episodeId, episodeTitle) {
    try {
      // Check if already downloaded or downloading
      const existingDownload = this.downloads.find(download => 
        download.episodeId === episodeId && 
        ['completed', 'downloading', 'pending'].includes(download.status));
      
      if (existingDownload) {
        if (existingDownload.status === 'completed') {
          this.showNotification(`"${episodeTitle}" is al gedownload`, 'info');
        } else {
          this.showNotification(`"${episodeTitle}" wordt al gedownload`, 'info');
        }
        return existingDownload;
      }
      
      // Start download via API
      const response = await this.apiService.downloadEpisode(episodeId);
      
      // Add to downloads list
      const newDownload = {
        taskId: response.taskId,
        episodeId,
        title: episodeTitle,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        completedAt: null,
        size: 0,
        path: null
      };
      
      this.downloads.unshift(newDownload);
      
      // Save downloads
      this.saveDownloads();
      
      // Show notification
      this.showNotification(`Download gestart: ${episodeTitle}`, 'success');
      
      // Monitor download progress if we have capacity
      if (this.activeDownloads.size < this.maxConcurrentDownloads) {
        this.monitorDownloadProgress(response.taskId, episodeId);
      }
      
      // Dispatch event to notify components
      this.dispatchDownloadsUpdatedEvent();
      
      return newDownload;
    } catch (error) {
      console.error('Error starting download:', error);
      this.showNotification(`Fout bij starten download: ${error.message}`, 'error');
      return null;
    }
  }
  
  // Start batch download of all episodes
  async downloadAllEpisodes() {
    try {
      // Show confirmation dialog
      if (!confirm('Weet je zeker dat je alle afleveringen wilt downloaden? Dit kan veel schijfruimte in beslag nemen.')) {
        return null;
      }
      
      // Start batch download via API
      const response = await this.apiService.downloadAllEpisodes();
      
      // Add each episode to downloads list
      response.episodes.forEach(episode => {
        // Check if already in downloads list
        const existingDownload = this.downloads.find(download => 
          download.episodeId === episode.id && 
          ['completed', 'downloading', 'pending'].includes(download.status));
        
        if (!existingDownload) {
          const newDownload = {
            taskId: episode.taskId,
            episodeId: episode.id,
            title: episode.title,
            status: 'pending',
            progress: 0,
            createdAt: new Date().toISOString(),
            completedAt: null,
            size: 0,
            path: null
          };
          
          this.downloads.unshift(newDownload);
        }
      });
      
      // Save downloads
      this.saveDownloads();
      
      // Show notification
      this.showNotification(`Batch download gestart: ${response.episodes.length} afleveringen`, 'success');
      
      // Monitor download progress for as many as we can handle
      for (let i = 0; i < Math.min(this.maxConcurrentDownloads - this.activeDownloads.size, response.episodes.length); i++) {
        const episode = response.episodes[i];
        this.monitorDownloadProgress(episode.taskId, episode.id);
      }
      
      // Dispatch event to notify components
      this.dispatchDownloadsUpdatedEvent();
      
      return response;
    } catch (error) {
      console.error('Error starting batch download:', error);
      this.showNotification(`Fout bij starten batch download: ${error.message}`, 'error');
      return null;
    }
  }
  
  // Monitor download progress
  monitorDownloadProgress(taskId, episodeId) {
    // Add to active downloads
    this.activeDownloads.set(taskId, { episodeId, lastChecked: Date.now() });
    
    // Start interval to check status
    const intervalId = setInterval(async () => {
      try {
        // Get download status
        const status = await this.apiService.getDownloadStatus(taskId);
        
        // Update download in list
        const downloadIndex = this.downloads.findIndex(download => download.taskId === taskId);
        if (downloadIndex !== -1) {
          const download = this.downloads[downloadIndex];
          
          // Update download info
          this.downloads[downloadIndex] = {
            ...download,
            status: status.status,
            progress: status.progress,
            size: status.size || download.size,
            path: status.path || download.path,
            completedAt: status.status === 'completed' ? new Date().toISOString() : download.completedAt
          };
          
          // Save downloads
          this.saveDownloads();
          
          // Dispatch event to notify components
          this.dispatchDownloadsUpdatedEvent();
          
          // If completed or failed, stop monitoring
          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            this.stopMonitoring(taskId);
            
            // Show notification
            if (status.status === 'completed') {
              this.showNotification(`Download voltooid: ${download.title}`, 'success');
            } else if (status.status === 'failed') {
              this.showNotification(`Download mislukt: ${download.title}`, 'error');
            }
            
            // Start next pending download if any
            this.startNextPendingDownload();
          }
        } else {
          // Download not found in list, stop monitoring
          this.stopMonitoring(taskId);
        }
      } catch (error) {
        console.error('Error checking download status:', error);
        
        // Check if we've been trying for too long (5 minutes)
        const downloadInfo = this.activeDownloads.get(taskId);
        if (downloadInfo && (Date.now() - downloadInfo.lastChecked > 5 * 60 * 1000)) {
          // Mark as failed
          const downloadIndex = this.downloads.findIndex(download => download.taskId === taskId);
          if (downloadIndex !== -1) {
            this.downloads[downloadIndex].status = 'failed';
            this.downloads[downloadIndex].progress = 0;
            
            // Save downloads
            this.saveDownloads();
            
            // Dispatch event to notify components
            this.dispatchDownloadsUpdatedEvent();
            
            // Show notification
            this.showNotification(`Download mislukt: ${this.downloads[downloadIndex].title}`, 'error');
          }
          
          // Stop monitoring
          this.stopMonitoring(taskId);
          
          // Start next pending download if any
          this.startNextPendingDownload();
        }
      }
    }, this.statusCheckInterval);
    
    // Store interval ID
    this.statusCheckIntervalIds.set(taskId, intervalId);
  }
  
  // Stop monitoring a download
  stopMonitoring(taskId) {
    // Clear interval
    const intervalId = this.statusCheckIntervalIds.get(taskId);
    if (intervalId) {
      clearInterval(intervalId);
      this.statusCheckIntervalIds.delete(taskId);
    }
    
    // Remove from active downloads
    this.activeDownloads.delete(taskId);
  }
  
  // Start next pending download
  startNextPendingDownload() {
    // Check if we have capacity
    if (this.activeDownloads.size >= this.maxConcurrentDownloads) {
      return;
    }
    
    // Find next pending download
    const pendingDownload = this.downloads.find(download => 
      download.status === 'pending' && 
      !this.activeDownloads.has(download.taskId));
    
    if (pendingDownload) {
      // Start monitoring
      this.monitorDownloadProgress(pendingDownload.taskId, pendingDownload.episodeId);
    }
  }
  
  // Cancel download
  async cancelDownload(taskId) {
    try {
      // Find download
      const downloadIndex = this.downloads.findIndex(download => download.taskId === taskId);
      if (downloadIndex === -1) {
        return false;
      }
      
      const download = this.downloads[downloadIndex];
      
      // Cancel download via API
      await this.apiService.cancelDownload(taskId);
      
      // Update download status
      this.downloads[downloadIndex] = {
        ...download,
        status: 'cancelled',
        progress: 0
      };
      
      // Save downloads
      this.saveDownloads();
      
      // Stop monitoring
      this.stopMonitoring(taskId);
      
      // Show notification
      this.showNotification(`Download geannuleerd: ${download.title}`, 'info');
      
      // Start next pending download if any
      this.startNextPendingDownload();
      
      // Dispatch event to notify components
      this.dispatchDownloadsUpdatedEvent();
      
      return true;
    } catch (error) {
      console.error('Error cancelling download:', error);
      this.showNotification(`Fout bij annuleren download: ${error.message}`, 'error');
      return false;
    }
  }
  
  // Delete download
  async deleteDownload(taskId) {
    try {
      // Find download
      const downloadIndex = this.downloads.findIndex(download => download.taskId === taskId);
      if (downloadIndex === -1) {
        return false;
      }
      
      const download = this.downloads[downloadIndex];
      
      // If download is active, cancel it first
      if (['downloading', 'pending'].includes(download.status)) {
        await this.cancelDownload(taskId);
      }
      
      // Delete download via API
      await this.apiService.deleteDownload(taskId);
      
      // Remove from downloads list
      this.downloads.splice(downloadIndex, 1);
      
      // Save downloads
      this.saveDownloads();
      
      // Show notification
      this.showNotification(`Download verwijderd: ${download.title}`, 'info');
      
      // Dispatch event to notify components
      this.dispatchDownloadsUpdatedEvent();
      
      return true;
    } catch (error) {
      console.error('Error deleting download:', error);
      this.showNotification(`Fout bij verwijderen download: ${error.message}`, 'error');
      return false;
    }
  }
  
  // Save downloads to storage
  saveDownloads() {
    // Save to localStorage for persistence between page reloads
    localStorage.setItem('downloads', JSON.stringify(this.downloads));
  }
  
  // Show notification
  showNotification(message, type = 'info') {
    if (window.errorHandler) {
      window.errorHandler.showNotification(message, type);
    } else {
      // Fallback notification
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
  }
  
  // Dispatch downloads updated event
  dispatchDownloadsUpdatedEvent() {
    const event = new CustomEvent('downloadsUpdated', {
      detail: { downloads: this.downloads }
    });
    document.dispatchEvent(event);
  }
  
  // Get download by ID
  getDownload(taskId) {
    return this.downloads.find(download => download.taskId === taskId);
  }
  
  // Get all downloads
  getAllDownloads() {
    return [...this.downloads];
  }
  
  // Get downloads by status
  getDownloadsByStatus(status) {
    return this.downloads.filter(download => download.status === status);
  }
  
  // Get active downloads
  getActiveDownloads() {
    return this.downloads.filter(download => 
      download.status === 'downloading' || download.status === 'pending');
  }
  
  // Get completed downloads
  getCompletedDownloads() {
    return this.downloads.filter(download => download.status === 'completed');
  }
  
  // Get failed downloads
  getFailedDownloads() {
    return this.downloads.filter(download => 
      download.status === 'failed' || download.status === 'cancelled');
  }
}

// 2. Downloads Component
class DownloadsComponent {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.downloadManager = new DownloadManager();
    this.isInitialized = false;
  }
  
  // Initialize component
  init() {
    if (this.isInitialized) return;
    
    // Initialize download manager
    this.downloadManager.init();
    
    // Add event listeners
    document.addEventListener('downloadsUpdated', this.handleDownloadsUpdated.bind(this));
    
    // Add refresh button event listener
    const refreshButton = document.querySelector('#refresh-button');
    if (refreshButton) {
      refreshButton.addEventListener('click', this.refreshDownloads.bind(this));
    }
    
    this.isInitialized = true;
  }
  
  // Render downloads section
  render() {
    // Initialize if not already done
    this.init();
    
    // Update page title
    document.querySelector('h1').textContent = 'Downloads';
    
    // Render downloads
    this.renderDownloads();
  }
  
  // Refresh downloads
  refreshDownloads() {
    this.downloadManager.loadDownloads();
  }
  
  // Handle downloads updated event
  handleDownloadsUpdated(event) {
    this.renderDownloads();
  }
  
  // Render downloads
  renderDownloads() {
    // Get all downloads
    const downloads = this.downloadManager.getAllDownloads();
    
    // Get container
    const container = this.element.querySelector('.downloads-container');
    if (!container) {
      // Create container if it doesn't exist
      const newContainer = document.createElement('div');
      newContainer.className = 'downloads-container';
      this.element.appendChild(newContainer);
      
      // Update container reference
      this.renderDownloads();
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Create sections
    const activeSection = this.createDownloadsSection(
      'Actieve Downloads', 
      this.downloadManager.getActiveDownloads()
    );
    
    const completedSection = this.createDownloadsSection(
      'Voltooide Downloads', 
      this.downloadManager.getCompletedDownloads()
    );
    
    const failedSection = this.createDownloadsSection(
      'Mislukte Downloads', 
      this.downloadManager.getFailedDownloads()
    );
    
    // Add batch download button
    const batchDownloadSection = document.createElement('div');
    batchDownloadSection.className = 'batch-download-section';
    batchDownloadSection.innerHTML = `
      <h2>Alle Afleveringen Downloaden</h2>
      <p>Download alle afleveringen van The Sublime Weekendmix in één keer.</p>
      <button id="batch-download-button" class="primary-button">
        Download alle afleveringen
      </button>
    `;
    
    // Add sections to container
    container.appendChild(activeSection);
    container.appendChild(completedSection);
    container.appendChild(failedSection);
    container.appendChild(batchDownloadSection);
    
    // Add event listeners
    this.addEventListeners();
    
    // Show empty state if no downloads
    if (downloads.length === 0) {
      this.showEmptyState(container);
    }
  }
  
  // Create downloads section
  createDownloadsSection(title, downloads) {
    const section = document.createElement('div');
    section.className = 'downloads-section';
    
    // Add section title
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);
    
    // If no downloads in this section, show message
    if (downloads.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'Geen downloads in deze categorie.';
      section.appendChild(emptyMessage);
      return section;
    }
    
    // Create downloads list
    const downloadsList = document.createElement('div');
    downloadsList.className = 'downloads-list';
    
    // Add each download to the list
    downloads.forEach(download => {
      const downloadItem = document.createElement('div');
      downloadItem.className = 'download-item';
      downloadItem.dataset.taskId = download.taskId;
      
      // Create download content based on status
      if (download.status === 'downloading') {
        downloadItem.innerHTML = `
          <div class="download-info">
            <h3>${download.title}</h3>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${download.progress}%"></div>
            </div>
            <p class="progress-text">${download.progress}% voltooid</p>
          </div>
          <div class="download-actions">
            <button class="cancel-button" data-task-id="${download.taskId}">Annuleren</button>
          </div>
        `;
      } else if (download.status === 'pending') {
        downloadItem.innerHTML = `
          <div class="download-info">
            <h3>${download.title}</h3>
            <p>Wachten om te starten...</p>
          </div>
          <div class="download-actions">
            <button class="cancel-button" data-task-id="${download.taskId}">Annuleren</button>
          </div>
        `;
      } else if (download.status === 'completed') {
        downloadItem.innerHTML = `
          <div class="download-info">
            <h3>${download.title}</h3>
            <p>${this.formatDate(download.completedAt)} • ${this.formatFileSize(download.size)}</p>
          </div>
          <div class="download-actions">
            <button class="play-button" data-episode-id="${download.episodeId}">▶️</button>
            <button class="delete-button" data-task-id="${download.taskId}">🗑️</button>
          </div>
        `;
      } else {
        // Failed or cancelled
        downloadItem.innerHTML = `
          <div class="download-info">
            <h3>${download.title}</h3>
            <p>${download.status === 'failed' ? 'Download mislukt' : 'Download geannuleerd'}</p>
          </div>
          <div class="download-actions">
            <button class="retry-button" data-episode-id="${download.episodeId}" data-title="${download.title}">Opnieuw</button>
            <button class="delete-button" data-task-id="${download.taskId}">🗑️</button>
          </div>
        `;
      }
      
      downloadsList.appendChild(downloadItem);
    });
    
    section.appendChild(downloadsList);
    return section;
  }
  
  // Add event listeners
  addEventListeners() {
    // Play buttons
    const playButtons = this.element.querySelectorAll('.play-button');
    playButtons.forEach(button => {
      button.addEventListener('click', this.handlePlay.bind(this));
    });
    
    // Cancel buttons
    const cancelButtons = this.element.querySelectorAll('.cancel-button');
    cancelButtons.forEach(button => {
      button.addEventListener('click', this.handleCancel.bind(this));
    });
    
    // Delete buttons
    const deleteButtons = this.element.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
      button.addEventListener('click', this.handleDelete.bind(this));
    });
    
    // Retry buttons
    const retryButtons = this.element.querySelectorAll('.retry-button');
    retryButtons.forEach(button => {
      button.addEventListener('click', this.handleRetry.bind(this));
    });
    
    // Batch download button
    const batchDownloadButton = this.element.querySelector('#batch-download-button');
    if (batchDownloadButton) {
      batchDownloadButton.addEventListener('click', this.handleBatchDownload.bind(this));
    }
    
    // Go to episodes button (in empty state)
    const goToEpisodesButton = this.element.querySelector('#go-to-episodes');
    if (goToEpisodesButton) {
      goToEpisodesButton.addEventListener('click', () => {
        if (typeof window.router !== 'undefined') {
          window.router.navigateTo('episodes');
        } else {
          window.location.hash = '#episodes';
        }
      });
    }
  }
  
  // Handle play button click
  handlePlay(event) {
    const episodeId = event.target.dataset.episodeId;
    
    if (episodeId && typeof window.playEpisode === 'function') {
      window.playEpisode(episodeId);
    }
  }
  
  // Handle cancel button click
  async handleCancel(event) {
    const taskId = event.target.dataset.taskId;
    
    if (taskId) {
      await this.downloadManager.cancelDownload(taskId);
    }
  }
  
  // Handle delete button click
  async handleDelete(event) {
    const taskId = event.target.dataset.taskId;
    
    if (taskId) {
      // Confirm deletion
      if (confirm('Weet je zeker dat je deze download wilt verwijderen?')) {
        await this.downloadManager.deleteDownload(taskId);
      }
    }
  }
  
  // Handle retry button click
  async handleRetry(event) {
    const episodeId = event.target.dataset.episodeId;
    const title = event.target.dataset.title;
    
    if (episodeId && title) {
      await this.downloadManager.downloadEpisode(episodeId, title);
    }
  }
  
  // Handle batch download button click
  async handleBatchDownload() {
    await this.downloadManager.downloadAllEpisodes();
  }
  
  // Show empty state
  showEmptyState(container) {
    // Clear container
    container.innerHTML = '';
    
    // Create empty state
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-state-icon">📥</div>
      <h3>Geen downloads gevonden</h3>
      <p>Download afleveringen om ze offline te beluisteren.</p>
      <button id="go-to-episodes" class="primary-button">Ga naar afleveringen</button>
    `;
    
    container.appendChild(emptyState);
    
    // Add batch download section
    const batchDownloadSection = document.createElement('div');
    batchDownloadSection.className = 'batch-download-section';
    batchDownloadSection.innerHTML = `
      <h2>Alle Afleveringen Downloaden</h2>
      <p>Download alle afleveringen van The Sublime Weekendmix in één keer.</p>
      <button id="batch-download-button" class="primary-button">
        Download alle afleveringen
      </button>
    `;
    
    container.appendChild(batchDownloadSection);
    
    // Add event listeners
    this.addEventListeners();
  }
  
  // Format date
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Format file size
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 3. CSS for Download Functionality
const downloadStyles = `
  /* Downloads Container */
  .downloads-container {
    padding: 20px;
  }
  
  /* Downloads Section */
  .downloads-section {
    margin-bottom: 30px;
  }
  
  .downloads-section h2 {
    margin-bottom: 15px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* Downloads List */
  .downloads-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
  }
  
  /* Download Item */
  .download-item {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: background-color 0.3s ease;
  }
  
  .download-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .download-info {
    margin-bottom: 15px;
  }
  
  .download-info h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
  }
  
  .download-info p {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  /* Progress Bar */
  .progress-container {
    height: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    margin: 10px 0;
    overflow: hidden;
  }
  
  .progress-bar {
    height: 100%;
    background-color: #4CAF50;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  .progress-text {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  /* Download Actions */
  .download-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .download-actions button {
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .download-actions button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .download-actions .play-button {
    background-color: rgba(76, 175, 80, 0.2);
  }
  
  .download-actions .play-button:hover {
    background-color: rgba(76, 175, 80, 0.4);
  }
  
  .download-actions .cancel-button,
  .download-actions .delete-button {
    background-color: rgba(244, 67, 54, 0.2);
  }
  
  .download-actions .cancel-button:hover,
  .download-actions .delete-button:hover {
    background-color: rgba(244, 67, 54, 0.4);
  }
  
  .download-actions .retry-button {
    background-color: rgba(33, 150, 243, 0.2);
  }
  
  .download-actions .retry-button:hover {
    background-color: rgba(33, 150, 243, 0.4);
  }
  
  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 30px;
  }
  
  .empty-state-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }
  
  .empty-message {
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
  }
  
  /* Batch Download Section */
  .batch-download-section {
    background-color: rgba(76, 175, 80, 0.1);
    border-radius: 8px;
    padding: 20px;
    margin-top: 30px;
  }
  
  .batch-download-section h2 {
    margin-top: 0;
    border-bottom: none;
  }
  
  .batch-download-section p {
    margin-bottom: 20px;
  }
  
  /* Primary Button */
  .primary-button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s ease;
  }
  
  .primary-button:hover {
    background-color: #45a049;
  }
`;

// 4. Initialize Download Functionality
document.addEventListener('DOMContentLoaded', () => {
  // Add download styles
  const style = document.createElement('style');
  style.textContent = downloadStyles;
  document.head.appendChild(style);
  
  // Initialize downloads component
  const downloadsComponent = new DownloadsComponent('downloads-section');
  
  // Make downloads component available globally
  window.downloadsComponent = downloadsComponent;
  
  // Add refresh function
  window.refreshDownloads = () => {
    downloadsComponent.refreshDownloads();
  };
  
  // Add download episode function
  window.downloadEpisode = (episodeId, episodeTitle) => {
    downloadsComponent.downloadManager.downloadEpisode(episodeId, episodeTitle);
  };
});
