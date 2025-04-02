const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Bind to all network interfaces

// Import routes
const shazamRoutes = require('./src/routes/shazam');

// Import CORS configuration
const corsOptions = require('./src/config/cors');

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for audio data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Jukebox API is running' });
});

// Shazam integration routes
app.use('/api/shazam', shazamRoutes);

// Playlist management routes
app.get('/api/playlist', (req, res) => {
  // Placeholder for playlist retrieval
  res.status(200).json({ 
    playlist: [
      { id: 1, title: 'Sample Song 1', artist: 'Artist 1', duration: '3:45' },
      { id: 2, title: 'Sample Song 2', artist: 'Artist 2', duration: '4:20' }
    ]
  });
});

// Import error handlers
const errorHandler = require('./src/middleware/errorHandler');

// Routes
// ... existing routes ...

// Error handling middleware (must be after routes)
app.use(errorHandler.notFound);
app.use(errorHandler.general);

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
