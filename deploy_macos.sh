#!/bin/bash

# Sublime Weekendmix Jukebox - macOS Deployment Script

echo "Sublime Weekendmix Jukebox - macOS Deployment"
echo "=============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is niet geïnstalleerd. Installeer Python 3 via Homebrew of van python.org"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
    echo "Python 3.10 of hoger is vereist. Huidige versie: $PYTHON_VERSION"
    exit 1
fi

echo "Python $PYTHON_VERSION gevonden. OK."

# Create application directory
APP_DIR="$HOME/Applications/sublime-jukebox"
echo "Applicatie wordt geïnstalleerd in: $APP_DIR"

mkdir -p "$APP_DIR"

# Copy files
echo "Bestanden kopiëren..."
cp -r * "$APP_DIR/"

# Make run script executable
chmod +x "$APP_DIR/run.sh"

# Install requirements
echo "Vereiste packages installeren..."
pip3 install -r requirements.txt

echo ""
echo "Installatie voltooid!"
echo "Start de applicatie met: cd $APP_DIR && ./run.sh"
echo "Open daarna een browser en ga naar: http://localhost:5000"
