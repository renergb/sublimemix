/* Mobile Responsiveness Implementation

This code implements improved mobile responsiveness for the Sublime Weekendmix Jukebox application,
ensuring a better user experience on mobile devices and different screen sizes.
*/

// 1. Responsive Design CSS
const responsiveStyles = `
  /* Base Responsive Layout */
  :root {
    --sidebar-width: 320px;
    --sidebar-width-mobile: 0px;
    --header-height: 60px;
    --player-height: 80px;
    --primary-color: #4CAF50;
    --background-color: #121212;
    --card-background: rgba(255, 255, 255, 0.05);
    --card-hover-background: rgba(255, 255, 255, 0.1);
    --text-color: #ffffff;
    --text-secondary-color: rgba(255, 255, 255, 0.7);
    --border-color: rgba(255, 255, 255, 0.1);
  }

  /* Responsive Body and HTML */
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Roboto', 'Helvetica Neue', sans-serif;
    background-color: var(--background-color);
    color: var(--text-color);
    height: 100%;
    width: 100%;
    overflow-x: hidden;
  }

  /* App Container */
  #app-container {
    display: grid;
    grid-template-areas:
      "sidebar header"
      "sidebar main"
      "player player";
    grid-template-columns: var(--sidebar-width) 1fr;
    grid-template-rows: var(--header-height) 1fr var(--player-height);
    height: 100vh;
    width: 100vw;
  }

  /* Sidebar */
  #sidebar {
    grid-area: sidebar;
    background-color: #000000;
    overflow-y: auto;
    transition: transform 0.3s ease;
    z-index: 100;
  }

  /* Header */
  #header {
    grid-area: header;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid var(--border-color);
  }

  /* Main Content */
  #main-content {
    grid-area: main;
    overflow-y: auto;
    padding: 20px;
  }

  /* Player */
  #player {
    grid-area: player;
    background-color: #000000;
    border-top: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    padding: 0 20px;
  }

  /* Mobile Menu Button (hidden by default) */
  #mobile-menu-button {
    display: none;
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    margin-right: 15px;
  }

  /* Mobile Overlay (hidden by default) */
  #mobile-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 90;
  }

  /* Responsive Navigation */
  nav {
    width: 100%;
  }

  nav a {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    color: var(--text-color);
    text-decoration: none;
    transition: background-color 0.3s ease;
  }

  nav a:hover, nav a.active {
    background-color: rgba(255, 255, 255, 0.1);
  }

  nav a i {
    margin-right: 10px;
    font-size: 20px;
  }

  /* Responsive Cards */
  .card {
    background-color: var(--card-background);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    transition: background-color 0.3s ease;
  }

  .card:hover {
    background-color: var(--card-hover-background);
  }

  /* Responsive Grids */
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  /* Responsive Typography */
  h1 {
    font-size: 24px;
    margin: 0;
  }

  h2 {
    font-size: 20px;
    margin: 0 0 15px 0;
  }

  h3 {
    font-size: 16px;
    margin: 0 0 10px 0;
  }

  p {
    margin: 0 0 10px 0;
    line-height: 1.5;
  }

  /* Responsive Buttons */
  button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease;
  }

  .primary-button {
    background-color: var(--primary-color);
    color: white;
  }

  .primary-button:hover {
    background-color: #45a049;
  }

  .icon-button {
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 20px;
    padding: 5px;
    cursor: pointer;
  }

  /* Responsive Player Controls */
  .player-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
  }

  .player-info {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .player-info img {
    width: 50px;
    height: 50px;
    margin-right: 15px;
    border-radius: 4px;
  }

  .player-info-text {
    overflow: hidden;
  }

  .player-info-text h3 {
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-info-text p {
    margin: 0;
    font-size: 12px;
    color: var(--text-secondary-color);
  }

  .player-progress {
    flex: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .progress-bar-container {
    width: 100%;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin: 0 15px;
    cursor: pointer;
  }

  .progress-bar {
    height: 100%;
    background-color: var(--primary-color);
    border-radius: 2px;
    transition: width 0.1s linear;
  }

  .progress-time {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 12px;
    color: var(--text-secondary-color);
    margin-top: 5px;
  }

  .player-volume {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .volume-slider {
    width: 80px;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    cursor: pointer;
  }

  .volume-level {
    height: 100%;
    background-color: var(--primary-color);
    border-radius: 2px;
  }

  /* Responsive Episode List */
  .episode-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .episode-item {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: var(--card-background);
    border-radius: 8px;
    transition: background-color 0.3s ease;
  }

  .episode-item:hover {
    background-color: var(--card-hover-background);
  }

  .episode-image {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    margin-right: 15px;
  }

  .episode-info {
    flex: 1;
    overflow: hidden;
  }

  .episode-info h3 {
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .episode-info p {
    margin: 5px 0 0 0;
    font-size: 12px;
    color: var(--text-secondary-color);
  }

  .episode-actions {
    display: flex;
    gap: 10px;
  }

  /* Responsive Form Elements */
  input, select, textarea {
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--text-color);
    font-size: 14px;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  /* Responsive Modal */
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: var(--background-color);
    border-radius: 8px;
    padding: 20px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .modal-close {
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 24px;
    cursor: pointer;
  }

  /* Media Queries for Responsive Design */
  @media (max-width: 1024px) {
    .grid-container {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  @media (max-width: 768px) {
    /* Change layout for tablets */
    :root {
      --sidebar-width: 240px;
    }

    .grid-container {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }

    .player-volume {
      display: none;
    }
  }

  @media (max-width: 576px) {
    /* Change layout for mobile phones */
    #app-container {
      grid-template-areas:
        "header header"
        "main main"
        "player player";
      grid-template-columns: 1fr;
      grid-template-rows: var(--header-height) 1fr var(--player-height);
    }

    #sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 80%;
      max-width: 300px;
      transform: translateX(-100%);
    }

    #sidebar.open {
      transform: translateX(0);
    }

    #mobile-menu-button {
      display: block;
    }

    #mobile-overlay {
      display: none;
    }

    #mobile-overlay.active {
      display: block;
    }

    .grid-container {
      grid-template-columns: 1fr;
    }

    .player-info img {
      width: 40px;
      height: 40px;
    }

    .player-progress {
      flex: 1;
    }

    .player-controls {
      gap: 10px;
    }

    .episode-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .episode-image {
      width: 100%;
      height: auto;
      margin-right: 0;
      margin-bottom: 10px;
    }

    .episode-actions {
      width: 100%;
      justify-content: space-between;
      margin-top: 10px;
    }
  }

  /* Landscape Mode Optimization */
  @media (max-height: 500px) and (orientation: landscape) {
    #app-container {
      grid-template-rows: var(--header-height) 1fr 60px;
    }

    .player-info img {
      width: 30px;
      height: 30px;
    }

    .player-info-text h3 {
      font-size: 14px;
    }

    .player-info-text p {
      font-size: 10px;
    }
  }

  /* Dark Mode Optimization */
  @media (prefers-color-scheme: dark) {
    :root {
      --background-color: #121212;
      --card-background: rgba(255, 255, 255, 0.05);
      --card-hover-background: rgba(255, 255, 255, 0.1);
      --text-color: #ffffff;
      --text-secondary-color: rgba(255, 255, 255, 0.7);
      --border-color: rgba(255, 255, 255, 0.1);
    }
  }

  /* Light Mode Optimization */
  @media (prefers-color-scheme: light) {
    :root {
      --background-color: #f5f5f5;
      --card-background: #ffffff;
      --card-hover-background: #f9f9f9;
      --text-color: #333333;
      --text-secondary-color: #666666;
      --border-color: #e0e0e0;
    }

    #sidebar, #player {
      background-color: #ffffff;
      color: #333333;
    }

    #header {
      background-color: rgba(255, 255, 255, 0.9);
      color: #333333;
    }
  }

  /* Touch Optimization */
  @media (hover: none) {
    /* Increase touch target sizes */
    button, .icon-button, nav a {
      padding: 12px;
    }

    .episode-actions button {
      padding: 12px;
      min-width: 44px;
      min-height: 44px;
    }

    /* Increase spacing for touch targets */
    .episode-list {
      gap: 15px;
    }

    nav a {
      padding: 15px 20px;
    }
  }

  /* Accessibility Improvements */
  :focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

// 2. Mobile Navigation Handler
class MobileNavigationHandler {
  constructor() {
    this.sidebarElement = null;
    this.mobileMenuButton = null;
    this.mobileOverlay = null;
    this.isInitialized = false;
  }

  // Initialize mobile navigation
  init() {
    if (this.isInitialized) return;

    // Get elements
    this.sidebarElement = document.getElementById('sidebar');
    
    // Create mobile menu button if it doesn't exist
    if (!document.getElementById('mobile-menu-button')) {
      this.mobileMenuButton = document.createElement('button');
      this.mobileMenuButton.id = 'mobile-menu-button';
      this.mobileMenuButton.innerHTML = '☰';
      this.mobileMenuButton.setAttribute('aria-label', 'Menu');
      
      // Add to header
      const header = document.getElementById('header');
      if (header) {
        header.insertBefore(this.mobileMenuButton, header.firstChild);
      }
    } else {
      this.mobileMenuButton = document.getElementById('mobile-menu-button');
    }
    
    // Create mobile overlay if it doesn't exist
    if (!document.getElementById('mobile-overlay')) {
      this.mobileOverlay = document.createElement('div');
      this.mobileOverlay.id = 'mobile-overlay';
      document.body.appendChild(this.mobileOverlay);
    } else {
      this.mobileOverlay = document.getElementById('mobile-overlay');
    }
    
    // Add event listeners
    this.mobileMenuButton.addEventListener('click', this.toggleSidebar.bind(this));
    this.mobileOverlay.addEventListener('click', this.closeSidebar.bind(this));
    
    // Add resize listener to handle responsive changes
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Initial check
    this.handleResize();
    
    this.isInitialized = true;
  }
  
  // Toggle sidebar
  toggleSidebar() {
    if (this.sidebarElement) {
      this.sidebarElement.classList.toggle('open');
      this.mobileOverlay.classList.toggle('active');
      
      // Update aria-expanded attribute
      const isOpen = this.sidebarElement.classList.contains('open');
      this.mobileMenuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      
      // Prevent body scrolling when sidebar is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
  }
  
  // Close sidebar
  closeSidebar() {
    if (this.sidebarElement) {
      this.sidebarElement.classList.remove('open');
      this.mobileOverlay.classList.remove('active');
      
      // Update aria-expanded attribute
      this.mobileMenuButton.setAttribute('aria-expanded', 'false');
      
      // Re-enable body scrolling
      document.body.style.overflow = '';
    }
  }
  
  // Handle resize
  handleResize() {
    // Check if we're in mobile view
    const isMobileView = window.innerWidth <= 576;
    
    // Show/hide mobile menu button based on view
    if (this.mobileMenuButton) {
      this.mobileMenuButton.style.display = isMobileView ? 'block' : 'none';
    }
    
    // Reset sidebar and overlay in desktop view
    if (!isMobileView) {
      this.closeSidebar();
    }
  }
}

// 3. Touch Optimization
class TouchOptimizer {
  constructor() {
    this.isInitialized = false;
  }
  
  // Initialize touch optimization
  init() {
    if (this.isInitialized) return;
    
    // Add touch-specific optimizations
    this.optimizeTouchTargets();
    
    // Add swipe detection
    this.setupSwipeDetection();
    
    this.isInitialized = true;
  }
  
  // Optimize touch targets
  optimizeTouchTargets() {
    // Increase touch target size for small buttons
    const smallButtons = document.querySelectorAll('.icon-button, .player-controls button');
    smallButtons.forEach(button => {
      // Ensure minimum touch target size (44x44px)
      if (button.offsetWidth < 44 || button.offsetHeight < 44) {
        button.style.minWidth = '44px';
        button.style.minHeight = '44px';
      }
    });
    
    // Add appropriate spacing between touch targets
    const buttonGroups = document.querySelectorAll('.episode-actions, .player-controls');
    buttonGroups.forEach(group => {
      if (window.getComputedStyle(group).gap === '0px') {
        group.style.gap = '10px';
      }
    });
  }
  
  // Setup swipe detection
  setupSwipeDetection() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Add swipe detection to main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      mainContent.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe(touchStartX, touchEndX);
      }, { passive: true });
    }
  }
  
  // Handle swipe gesture
  handleSwipe(startX, endX) {
    const mobileNavHandler = window.mobileNavHandler;
    if (!mobileNavHandler) return;
    
    const swipeThreshold = 100; // Minimum swipe distance
    
    // Right to left swipe (close sidebar)
    if (startX - endX > swipeThreshold) {
      mobileNavHandler.closeSidebar();
    }
    
    // Left to right swipe (open sidebar)
    if (endX - startX > swipeThreshold) {
      mobileNavHandler.toggleSidebar();
    }
  }
}

// 4. Responsive Layout Manager
class ResponsiveLayoutManager {
  constructor() {
    this.isInitialized = false;
    this.currentBreakpoint = null;
    this.breakpoints = {
      mobile: 576,
      tablet: 768,
      desktop: 1024
    };
  }
  
  // Initialize responsive layout
  init() {
    if (this.isInitialized) return;
    
    // Ensure app container structure
    this.setupAppContainer();
    
    // Add resize listener
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Initial layout adjustment
    this.handleResize();
    
    this.isInitialized = true;
  }
  
  // Setup app container structure
  setupAppContainer() {
    // Check if app container exists
    let appContainer = document.getElementById('app-container');
    
    if (!appContainer) {
      // Create app container
      appContainer = document.createElement('div');
      appContainer.id = 'app-container';
      
      // Move body content to app container
      while (document.body.firstChild) {
        appContainer.appendChild(document.body.firstChild);
      }
      
      // Add app container to body
      document.body.appendChild(appContainer);
    }
    
    // Ensure sidebar exists
    let sidebar = document.getElementById('sidebar');
    if (!sidebar) {
      sidebar = document.createElement('div');
      sidebar.id = 'sidebar';
      
      // Move navigation to sidebar
      const nav = document.querySelector('nav');
      if (nav) {
        sidebar.appendChild(nav);
      }
      
      // Add sidebar to app container
      appContainer.insertBefore(sidebar, appContainer.firstChild);
    }
    
    // Ensure header exists
    let header = document.getElementById('header');
    if (!header) {
      header = document.createElement('div');
      header.id = 'header';
      
      // Add page title to header
      const pageTitle = document.querySelector('h1');
      if (pageTitle) {
        header.appendChild(pageTitle.cloneNode(true));
        pageTitle.style.display = 'none';
      }
      
      // Add header to app container
      if (sidebar) {
        appContainer.insertBefore(header, sidebar.nextSibling);
      } else {
        appContainer.insertBefore(header, appContainer.firstChild);
      }
    }
    
    // Ensure main content exists
    let mainContent = document.getElementById('main-content');
    if (!mainContent) {
      mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      
      // Move content sections to main content
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => {
        mainContent.appendChild(section);
      });
      
      // Add main content to app container
      appContainer.appendChild(mainContent);
    }
    
    // Ensure player exists
    let player = document.getElementById('player');
    if (!player) {
      player = document.createElement('div');
      player.id = 'player';
      
      // Add player controls
      const playerControls = document.querySelector('.player-controls');
      if (playerControls) {
        player.appendChild(playerControls);
      } else {
        // Create placeholder player controls
        player.innerHTML = `
          <div class="player-info">
            <img src="placeholder.jpg" alt="Episode cover">
            <div class="player-info-text">
              <h3>Geen aflevering geselecteerd</h3>
              <p>Selecteer een aflevering om te beginnen</p>
            </div>
          </div>
          <div class="player-controls">
            <button aria-label="Vorige">⏮️</button>
            <button aria-label="Afspelen">▶️</button>
            <button aria-label="Volgende">⏭️</button>
          </div>
          <div class="player-volume">
            <button aria-label="Volume">🔊</button>
            <div class="volume-slider">
              <div class="volume-level" style="width: 70%"></div>
            </div>
          </div>
        `;
      }
      
      // Add player to app container
      appContainer.appendChild(player);
    }
  }
  
  // Handle resize
  handleResize() {
    const width = window.innerWidth;
    let newBreakpoint = null;
    
    // Determine current breakpoint
    if (width <= this.breakpoints.mobile) {
      newBreakpoint = 'mobile';
    } else if (width <= this.breakpoints.tablet) {
      newBreakpoint = 'tablet';
    } else if (width <= this.breakpoints.desktop) {
      newBreakpoint = 'desktop';
    } else {
      newBreakpoint = 'large';
    }
    
    // If breakpoint changed, adjust layout
    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      this.adjustLayout(newBreakpoint);
    }
  }
  
  // Adjust layout based on breakpoint
  adjustLayout(breakpoint) {
    // Adjust grid columns for episode list
    const episodeLists = document.querySelectorAll('.episode-list');
    episodeLists.forEach(list => {
      if (breakpoint === 'mobile') {
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
      } else {
        list.style.display = 'grid';
        
        if (breakpoint === 'tablet') {
          list.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (breakpoint === 'desktop') {
          list.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else {
          list.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
      }
    });
    
    // Adjust player layout
    const player = document.getElementById('player');
    if (player) {
      if (breakpoint === 'mobile') {
        player.style.flexDirection = 'column';
        player.style.padding = '10px';
        player.style.height = 'auto';
      } else {
        player.style.flexDirection = 'row';
        player.style.padding = '0 20px';
        player.style.height = '';
      }
    }
  }
}

// 5. Initialize Mobile Responsiveness
document.addEventListener('DOMContentLoaded', () => {
  // Add responsive styles
  const style = document.createElement('style');
  style.textContent = responsiveStyles;
  document.head.appendChild(style);
  
  // Add viewport meta tag if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(viewport);
  }
  
  // Initialize responsive layout manager
  const layoutManager = new ResponsiveLayoutManager();
  layoutManager.init();
  
  // Initialize mobile navigation handler
  const mobileNavHandler = new MobileNavigationHandler();
  mobileNavHandler.init();
  
  // Initialize touch optimizer
  const touchOptimizer = new TouchOptimizer();
  touchOptimizer.init();
  
  // Make handlers available globally
  window.layoutManager = layoutManager;
  window.mobileNavHandler = mobileNavHandler;
  window.touchOptimizer = touchOptimizer;
  
  // Add orientation change handler
  window.addEventListener('orientationchange', () => {
    // Slight delay to ensure DOM has updated
    setTimeout(() => {
      layoutManager.handleResize();
      touchOptimizer.optimizeTouchTargets();
    }, 100);
  });
});
