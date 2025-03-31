// Navigation Fix Implementation

// This code implements a fix for the navigation issues in the Sublime Weekendmix Jukebox application
// Specifically addressing the Downloads section navigation problem

// 1. Improved Router Component
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.defaultRoute = 'home';
    
    // Listen for hash changes
    window.addEventListener('hashchange', this.handleRouteChange.bind(this));
    
    // Initial route handling
    this.handleRouteChange();
  }
  
  // Register routes
  register(path, component) {
    this.routes[path] = component;
  }
  
  // Handle route changes
  handleRouteChange() {
    // Get the hash from the URL (remove the # symbol)
    let hash = window.location.hash.substring(1);
    
    // If no hash or unregistered route, use default
    if (!hash || !this.routes[hash]) {
      hash = this.defaultRoute;
      // Update URL to reflect the default route
      window.location.hash = `#${hash}`;
    }
    
    // Store current route
    this.currentRoute = hash;
    
    // Render the component for this route
    this.render();
    
    // Log navigation for debugging
    console.log(`Navigated to: ${hash}`);
  }
  
  // Navigate to a specific route
  navigateTo(path) {
    window.location.hash = `#${path}`;
  }
  
  // Render the current route
  render() {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
      section.style.display = 'none';
    });
    
    // Show the current section
    const currentComponent = this.routes[this.currentRoute];
    if (currentComponent && currentComponent.element) {
      currentComponent.element.style.display = 'block';
      
      // Call the component's render method if it exists
      if (typeof currentComponent.render === 'function') {
        currentComponent.render();
      }
    }
  }
}

// 2. Component Base Class
class Component {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.isInitialized = false;
  }
  
  // Initialize component (called once)
  init() {
    if (!this.isInitialized) {
      this.setupEventListeners();
      this.isInitialized = true;
    }
  }
  
  // Setup event listeners
  setupEventListeners() {
    // To be implemented by subclasses
  }
  
  // Render component
  render() {
    // Initialize if not already done
    this.init();
    
    // Render logic to be implemented by subclasses
  }
}

// 3. Downloads Component
class DownloadsComponent extends Component {
  constructor() {
    super('downloads-section');
    this.downloads = [];
  }
  
  setupEventListeners() {
    // Add download button event listener
    const downloadButtons = this.element.querySelectorAll('.download-button');
    downloadButtons.forEach(button => {
      button.addEventListener('click', this.handleDownload.bind(this));
    });
    
    // Add batch download button event listener
    const batchDownloadButton = this.element.querySelector('#batch-download-button');
    if (batchDownloadButton) {
      batchDownloadButton.addEventListener('click', this.handleBatchDownload.bind(this));
    }
  }
  
  render() {
    super.render();
    
    // Update page title
    document.querySelector('h1').textContent = 'Downloads';
    
    // Load downloads data
    this.loadDownloads();
  }
  
  // Load downloads from API
  loadDownloads() {
    // Show loading indicator
    this.showLoadingIndicator();
    
    // Fetch downloads from API
    fetch('/api/downloads')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load downloads');
        }
        return response.json();
      })
      .then(data => {
        this.downloads = data.downloads || [];
        this.renderDownloads();
      })
      .catch(error => {
        this.handleError(error);
      })
      .finally(() => {
        this.hideLoadingIndicator();
      });
  }
  
  // Render downloads list
  renderDownloads() {
    const downloadsContainer = this.element.querySelector('.downloads-container');
    
    // Clear container
    downloadsContainer.innerHTML = '';
    
    // Show empty state if no downloads
    if (this.downloads.length === 0) {
      downloadsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📥</div>
          <h3>Geen downloads gevonden</h3>
          <p>Download afleveringen om ze offline te beluisteren.</p>
          <button id="go-to-episodes" class="primary-button">Ga naar afleveringen</button>
        </div>
      `;
      
      // Add event listener to the "Go to episodes" button
      const goToEpisodesButton = downloadsContainer.querySelector('#go-to-episodes');
      if (goToEpisodesButton) {
        goToEpisodesButton.addEventListener('click', () => {
          router.navigateTo('episodes');
        });
      }
      
      return;
    }
    
    // Create downloads list
    const downloadsList = document.createElement('div');
    downloadsList.className = 'downloads-list';
    
    // Add each download to the list
    this.downloads.forEach(download => {
      const downloadItem = document.createElement('div');
      downloadItem.className = 'download-item';
      downloadItem.innerHTML = `
        <div class="download-info">
          <h3>${download.title}</h3>
          <p>${download.date} • ${this.formatFileSize(download.size)}</p>
        </div>
        <div class="download-actions">
          <button class="play-button" data-id="${download.id}">▶️</button>
          <button class="delete-button" data-id="${download.id}">🗑️</button>
        </div>
      `;
      downloadsList.appendChild(downloadItem);
    });
    
    // Add downloads list to container
    downloadsContainer.appendChild(downloadsList);
    
    // Add batch download button
    const batchDownloadContainer = document.createElement('div');
    batchDownloadContainer.className = 'batch-download-container';
    batchDownloadContainer.innerHTML = `
      <button id="batch-download-button" class="primary-button">
        Download alle afleveringen
      </button>
    `;
    downloadsContainer.appendChild(batchDownloadContainer);
    
    // Setup event listeners for the newly created elements
    this.setupEventListeners();
  }
  
  // Handle download button click
  handleDownload(event) {
    const episodeId = event.target.dataset.id;
    if (!episodeId) return;
    
    // Show loading indicator
    this.showLoadingIndicator();
    
    // Start download
    fetch(`/api/episodes/${episodeId}/download`, {
      method: 'POST'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to start download');
        }
        return response.json();
      })
      .then(data => {
        // Show success message
        this.showNotification('Download gestart', 'success');
        
        // Reload downloads after a delay
        setTimeout(() => {
          this.loadDownloads();
        }, 1000);
      })
      .catch(error => {
        this.handleError(error);
      })
      .finally(() => {
        this.hideLoadingIndicator();
      });
  }
  
  // Handle batch download button click
  handleBatchDownload() {
    // Show confirmation dialog
    if (!confirm('Weet je zeker dat je alle afleveringen wilt downloaden? Dit kan veel schijfruimte in beslag nemen.')) {
      return;
    }
    
    // Show loading indicator
    this.showLoadingIndicator();
    
    // Start batch download
    fetch('/api/downloads/all', {
      method: 'POST'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to start batch download');
        }
        return response.json();
      })
      .then(data => {
        // Show success message
        this.showNotification(`Download van ${data.count} afleveringen gestart`, 'success');
        
        // Reload downloads after a delay
        setTimeout(() => {
          this.loadDownloads();
        }, 1000);
      })
      .catch(error => {
        this.handleError(error);
      })
      .finally(() => {
        this.hideLoadingIndicator();
      });
  }
  
  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Show loading indicator
  showLoadingIndicator() {
    let loadingIndicator = this.element.querySelector('.loading-indicator');
    
    if (!loadingIndicator) {
      loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Laden...</p>
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
  
  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }
  
  // Handle error
  handleError(error) {
    console.error('Downloads error:', error);
    this.showNotification(`Fout: ${error.message}`, 'error');
  }
}

// 4. Initialize Router and Components
const router = new Router();

// Register components
router.register('home', new Component('home-section'));
router.register('episodes', new Component('episodes-section'));
router.register('favorites', new Component('favorites-section'));
router.register('favorite-songs', new Component('favorite-songs-section'));
router.register('downloads', new DownloadsComponent());

// 5. Setup Navigation Links
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const route = link.getAttribute('data-route');
    if (route) {
      router.navigateTo(route);
    }
  });
});

// CSS for improved navigation and loading indicators
const style = document.createElement('style');
style.textContent = `
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
  
  /* Notification */
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    z-index: 1001;
    opacity: 1;
    transition: opacity 0.5s ease;
  }
  
  .notification.info {
    background-color: #2196F3;
  }
  
  .notification.success {
    background-color: #4CAF50;
  }
  
  .notification.error {
    background-color: #F44336;
  }
  
  .notification.fade-out {
    opacity: 0;
  }
  
  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
  }
  
  .empty-state-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }
  
  /* Active Navigation Link */
  nav a.active {
    background-color: rgba(255, 255, 255, 0.1);
    border-left: 3px solid #4CAF50;
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

document.head.appendChild(style);

// Update navigation links with data-route attributes
document.querySelectorAll('nav a').forEach(link => {
  const href = link.getAttribute('href');
  if (href && href.startsWith('#')) {
    const route = href.substring(1);
    link.setAttribute('data-route', route);
  }
});

// Initialize the router
document.addEventListener('DOMContentLoaded', () => {
  // Initial route handling
  router.handleRouteChange();
});
