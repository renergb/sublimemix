// Browser compatibility fixes
document.addEventListener('DOMContentLoaded', function() {
  // Fix for mobile Safari audio recording
  function fixAudioRecordingForSafari() {
    // Check if browser is Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
      // Add specific handling for Safari's audio constraints
      window.safariAudioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      };
      
      console.log('Safari detected, applying audio recording fixes');
    }
  }
  
  // Fix for CORS issues with external requests
  function fixCorsForExternalRequests() {
    // Patch fetch to include credentials and proper headers
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      // Only apply to API requests
      if (url.includes('/api/')) {
        options.credentials = options.credentials || 'include';
        options.headers = {
          ...options.headers,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        };
      }
      return originalFetch(url, options);
    };
    
    console.log('CORS fetch patching applied');
  }
  
  // Fix for browser compatibility with audio processing
  function fixAudioProcessingCompatibility() {
    // Check if AudioContext is available
    if (!window.AudioContext && window.webkitAudioContext) {
      window.AudioContext = window.webkitAudioContext;
      console.log('Using webkitAudioContext as fallback');
    }
    
    // Check if MediaRecorder is available
    if (!window.MediaRecorder) {
      console.warn('MediaRecorder not available, using fallback simulation');
      // The app already has a fallback simulation for recognition
    }
  }
  
  // Apply all fixes
  fixAudioRecordingForSafari();
  fixCorsForExternalRequests();
  fixAudioProcessingCompatibility();
  
  console.log('Browser compatibility fixes applied');
});
