#!/bin/bash

# Sublime Weekendmix Jukebox - Web Deployment Script

echo "Sublime Weekendmix Jukebox - Web Deployment"
echo "==========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is niet geïnstalleerd."
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

# Install requirements
echo "Vereiste packages installeren..."
pip3 install -r requirements.txt

# Install Gunicorn if not already installed
if ! pip3 show gunicorn &> /dev/null; then
    echo "Gunicorn installeren..."
    pip3 install gunicorn
fi

echo ""
echo "Installatie voltooid!"
echo "Start de applicatie in productie modus met: gunicorn --bind 0.0.0.0:5000 wsgi:app"
echo "Of gebruik de meegeleverde systemd service configuratie voor automatisch starten."
