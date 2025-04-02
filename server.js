const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'static/css')));
app.use('/js', express.static(path.join(__dirname, 'static/js')));
app.use('/img', express.static(path.join(__dirname, 'static/img')));
app.use('/audio', express.static(path.join(__dirname, 'static/audio')));

// API route: Laden van playlist
app.get('/api/playlist', (req, res) => {
  fs.readFile(path.join(__dirname, 'data', 'playlist.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Fout bij het laden van de afspeellijst:', err);
      return res.status(500).json({ error: 'Kon afspeellijst niet laden' });
    }
    try {
      const playlist = JSON.parse(data);
      res.json(playlist);
    } catch (parseError) {
      console.error('Fout bij het parsen van de afspeellijst:', parseError);
      res.status(500).json({ error: 'Fout bij het parsen van de afspeellijst' });
    }
  });
});

// Server starten
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});