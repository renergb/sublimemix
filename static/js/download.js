// Add download functionality to the app.js file

// Add these variables to the existing global variables section
let downloadTasks = {};
let batchDownloadId = null;
let downloadCheckInterval = null;

// Add this function to the setupEventListeners function
function setupDownloadEventListeners() {
    // Add event listener for the download button in episode cards
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('download-episode') || 
            event.target.parentElement.classList.contains('download-episode')) {
            const episodeId = event.target.closest('.episode-card').dataset.id;
            downloadEpisode(episodeId);
            event.stopPropagation();
        }
    });
    
    // Add event listener for the download all button
    document.getElementById('btn-download-all').addEventListener('click', downloadAllEpisodes);
    
    // Add event listener for the downloads tab
    document.getElementById('nav-downloads').addEventListener('click', () => {
        showView('downloads');
        loadDownloadedFiles();
    });
}

// Add this to the setupEventListeners function in the existing code
setupDownloadEventListeners();

// Add this to the setupNavigation function
function setupNavigationWithDownloads() {
    // Existing navigation setup...
    
    // Add downloads navigation
    document.getElementById('nav-downloads').addEventListener('click', () => showView('downloads'));
}

// Add this to the showView function
function showViewWithDownloads(viewName) {
    // Hide all views
    viewHome.classList.remove('active');
    viewEpisodes.classList.remove('active');
    viewFavorites.classList.remove('active');
    viewSongs.classList.remove('active');
    viewDownloads.classList.remove('active');
    
    // Remove active class from all nav items
    navHome.classList.remove('active');
    navEpisodes.classList.remove('active');
    navFavorites.classList.remove('active');
    navSongs.classList.remove('active');
    navDownloads.classList.remove('active');
    
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
        case 'downloads':
            viewDownloads.classList.add('active');
            navDownloads.classList.add('active');
            contentTitle.textContent = 'Downloads';
            break;
    }
}

// Add these functions for download functionality
async function downloadEpisode(episodeId) {
    try {
        const result = await fetchAPI(`episodes/${episodeId}/download`);
        
        if (result.success) {
            // Start checking download status
            const taskId = result.task_id;
            downloadTasks[taskId] = {
                episodeId: episodeId,
                status: 'starting',
                progress: 0
            };
            
            // Show download notification
            showNotification(`Download gestart voor aflevering ${episodeId}`, 'info');
            
            // Start checking status if not already checking
            if (!downloadCheckInterval) {
                downloadCheckInterval = setInterval(checkDownloadStatus, 2000);
            }
        } else {
            showNotification(`Fout bij starten download: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Er is een fout opgetreden bij het starten van de download', 'error');
    }
}

async function downloadAllEpisodes() {
    try {
        // Confirm with user
        if (!confirm('Weet u zeker dat u alle afleveringen wilt downloaden? Dit kan veel schijfruimte in beslag nemen.')) {
            return;
        }
        
        const result = await fetchAPI('downloads/all', 'POST');
        
        if (result.success) {
            // Store batch ID
            batchDownloadId = result.batch_id;
            
            // Show download notification
            showNotification(`Batch download gestart voor alle afleveringen`, 'info');
            
            // Start checking status if not already checking
            if (!downloadCheckInterval) {
                downloadCheckInterval = setInterval(checkDownloadStatus, 2000);
            }
        } else {
            showNotification(`Fout bij starten batch download: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Batch download error:', error);
        showNotification('Er is een fout opgetreden bij het starten van de batch download', 'error');
    }
}

async function checkDownloadStatus() {
    // Check batch download status if exists
    if (batchDownloadId) {
        try {
            const result = await fetchAPI(`downloads/${batchDownloadId}/status`);
            
            if (result.success) {
                const batchTask = result.task;
                
                // Update UI with batch status
                updateBatchDownloadStatus(batchTask);
                
                // If batch is complete, stop checking
                if (['completed', 'failed', 'partially_completed'].includes(batchTask.status)) {
                    if (batchTask.status === 'completed') {
                        showNotification(`Alle afleveringen zijn gedownload!`, 'success');
                    } else if (batchTask.status === 'partially_completed') {
                        showNotification(`Download deels voltooid: ${batchTask.completed_episodes} succesvol, ${batchTask.failed_episodes} mislukt`, 'warning');
                    } else {
                        showNotification(`Batch download mislukt`, 'error');
                    }
                    
                    batchDownloadId = null;
                    loadDownloadedFiles();
                }
            }
        } catch (error) {
            console.error('Error checking batch status:', error);
        }
    }
    
    // Check individual download tasks
    let activeDownloads = false;
    
    for (const taskId in downloadTasks) {
        if (downloadTasks[taskId].status !== 'completed' && downloadTasks[taskId].status !== 'failed') {
            activeDownloads = true;
            
            try {
                const result = await fetchAPI(`downloads/${taskId}/status`);
                
                if (result.success) {
                    const task = result.task;
                    downloadTasks[taskId] = task;
                    
                    // Update UI for this download
                    updateDownloadStatus(taskId, task);
                    
                    // If download completed, show notification
                    if (task.status === 'completed' && downloadTasks[taskId].status !== 'completed') {
                        showNotification(`Download voltooid voor aflevering ${task.episode_id}`, 'success');
                        loadDownloadedFiles();
                    } else if (task.status === 'failed' && downloadTasks[taskId].status !== 'failed') {
                        showNotification(`Download mislukt voor aflevering ${task.episode_id}: ${task.error}`, 'error');
                    }
                    
                    downloadTasks[taskId] = task;
                }
            } catch (error) {
                console.error(`Error checking status for task ${taskId}:`, error);
            }
        }
    }
    
    // If no active downloads and no batch download, stop checking
    if (!activeDownloads && !batchDownloadId) {
        clearInterval(downloadCheckInterval);
        downloadCheckInterval = null;
    }
}

function updateDownloadStatus(taskId, task) {
    // Update download progress in UI if element exists
    const progressElement = document.getElementById(`download-progress-${task.episode_id}`);
    if (progressElement) {
        progressElement.style.width = `${task.progress}%`;
        progressElement.setAttribute('aria-valuenow', task.progress);
        
        // Update status text
        const statusElement = document.getElementById(`download-status-${task.episode_id}`);
        if (statusElement) {
            let statusText = '';
            switch (task.status) {
                case 'starting':
                    statusText = 'Starten...';
                    break;
                case 'downloading':
                    statusText = `${task.progress}%`;
                    break;
                case 'completed':
                    statusText = 'Voltooid';
                    break;
                case 'failed':
                    statusText = 'Mislukt';
                    break;
                default:
                    statusText = task.status;
            }
            statusElement.textContent = statusText;
        }
    }
}

function updateBatchDownloadStatus(batchTask) {
    // Update batch download progress in UI
    const batchProgressElement = document.getElementById('batch-download-progress');
    if (batchProgressElement) {
        const progress = batchTask.total_episodes > 0 
            ? Math.round((batchTask.completed_episodes / batchTask.total_episodes) * 100) 
            : 0;
        
        batchProgressElement.style.width = `${progress}%`;
        batchProgressElement.setAttribute('aria-valuenow', progress);
        
        // Update status text
        const statusElement = document.getElementById('batch-download-status');
        if (statusElement) {
            let statusText = '';
            switch (batchTask.status) {
                case 'starting':
                    statusText = 'Starten...';
                    break;
                case 'in_progress':
                    statusText = `${batchTask.completed_episodes}/${batchTask.total_episodes} (${progress}%)`;
                    break;
                case 'completed':
                    statusText = 'Voltooid';
                    break;
                case 'partially_completed':
                    statusText = `Deels voltooid (${batchTask.completed_episodes}/${batchTask.total_episodes})`;
                    break;
                case 'failed':
                    statusText = 'Mislukt';
                    break;
                default:
                    statusText = batchTask.status;
            }
            statusElement.textContent = statusText;
        }
    }
}

async function loadDownloadedFiles() {
    try {
        const result = await fetchAPI('downloads');
        
        if (result.success) {
            const files = result.files;
            const downloadsContainer = document.getElementById('downloads-container');
            
            if (files.length === 0) {
                downloadsContainer.innerHTML = '<div class="alert alert-info">Geen gedownloade bestanden gevonden.</div>';
                return;
            }
            
            let html = '<div class="downloaded-files-list">';
            
            files.forEach(file => {
                html += `
                    <div class="download-item">
                        <div class="download-item-info">
                            <div class="download-item-title">${file.filename}</div>
                            <div class="download-item-size">${file.size_mb} MB</div>
                        </div>
                        <div class="download-item-actions">
                            <a href="${file.download_url}" class="btn btn-sm btn-primary" download>
                                <i class="fas fa-download"></i> Download
                            </a>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            
            // Add batch download button
            html += `
                <div class="batch-download-container mt-4">
                    <h4>Batch Download</h4>
                    <p>Download alle afleveringen in één keer.</p>
                    <button id="btn-download-all" class="btn btn-primary">
                        <i class="fas fa-download"></i> Download Alle Afleveringen
                    </button>
                    
                    <div class="batch-download-status mt-3" style="display: ${batchDownloadId ? 'block' : 'none'}">
                        <p>Batch download status: <span id="batch-download-status">Wachten...</span></p>
                        <div class="progress">
                            <div id="batch-download-progress" class="progress-bar" role="progressbar" style="width: 0%" 
                                aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
            `;
            
            downloadsContainer.innerHTML = html;
            
            // Re-attach event listener for download all button
            document.getElementById('btn-download-all').addEventListener('click', downloadAllEpisodes);
        } else {
            document.getElementById('downloads-container').innerHTML = 
                `<div class="alert alert-danger">Fout bij het laden van downloads: ${result.message}</div>`;
        }
    } catch (error) {
        console.error('Error loading downloads:', error);
        document.getElementById('downloads-container').innerHTML = 
            '<div class="alert alert-danger">Er is een fout opgetreden bij het laden van downloads</div>';
    }
}

// Add download button to episode cards in renderEpisodes function
function renderEpisodesWithDownload() {
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
                        <button class="download-episode" onclick="downloadEpisode(${episode.id})">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                    
                    <!-- Download progress (hidden by default) -->
                    <div class="download-progress-container" id="download-container-${episode.id}" style="display: none;">
                        <div class="progress">
                            <div id="download-progress-${episode.id}" class="progress-bar" role="progressbar" style="width: 0%" 
                                aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <small id="download-status-${episode.id}">Wachten...</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    episodesContainer.innerHTML = html;
}

// Replace the original renderEpisodes function with this one
const originalRenderEpisodes = renderEpisodes;
renderEpisodes = renderEpisodesWithDownload;

// Add notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification`;
    notification.innerHTML = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}
