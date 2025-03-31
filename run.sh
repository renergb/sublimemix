#!/bin/bash

# Create necessary directories
mkdir -p data
mkdir -p downloads

# Set environment variables for Spotify integration
# Replace these with your actual Spotify API credentials
export SPOTIFY_CLIENT_ID=""
export SPOTIFY_CLIENT_SECRET=""

# Start the Flask application
python3 app.py
