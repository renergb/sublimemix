#!/bin/bash

# Zet het werkpad naar de huidige map waar run.sh zich bevindt
cd "$(dirname "$0")"

# Pad naar de img-folder binnen static
IMG_DIR="./static/img"

# Maak de img-map aan als die niet bestaat
mkdir -p "$IMG_DIR"

# Als de default cover er nog niet is, maak een SVG
if [ ! -f "$IMG_DIR/default-cover.jpg" ]; then
    echo "Creating default cover image..."
    cat > "$IMG_DIR/default-cover.svg" << 'EOF'
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="#1DB954"/>
  <circle cx="150" cy="150" r="100" fill="#121212"/>
  <circle cx="150" cy="150" r="35" fill="#1DB954"/>
  <rect x="185" y="145" width="50" height="10" fill="#1DB954"/>
</svg>
EOF

    # Probeer SVG om te zetten naar JPG met ImageMagick
    if command -v convert &> /dev/null; then
        convert "$IMG_DIR/default-cover.svg" "$IMG_DIR/default-cover.jpg"
        rm "$IMG_DIR/default-cover.svg"
    else
        # Geen ImageMagick: hernoem gewoon de SVG naar .jpg (werkt visueel meestal ook)
        mv "$IMG_DIR/default-cover.svg" "$IMG_DIR/default-cover.jpg"
    fi
fi

# Start de Flask-applicatie
echo "Starting Sublime Weekendmix Jukebox application..."
export FLASK_APP=app.py
export FLASK_ENV=development
python3 -m flask run --port=5050