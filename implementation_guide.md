# Sublime Weekendmix Jukebox - Implementatiehandleiding

## Inhoudsopgave
1. [Vereisten](#vereisten)
2. [Installatie voor macOS](#installatie-voor-macos)
3. [Web Implementatie](#web-implementatie)
4. [Spotify Configuratie](#spotify-configuratie)
5. [Starten van de Applicatie](#starten-van-de-applicatie)
6. [Probleemoplossing](#probleemoplossing)

## Vereisten

### Voor lokale ontwikkeling en gebruik op macOS:
- Python 3.10 of hoger
- pip (Python package manager)
- Git (optioneel, voor het klonen van de repository)
- Een moderne webbrowser (Chrome, Firefox, Safari)

### Voor web implementatie:
- Een webserver met Python ondersteuning
- WSGI server (zoals Gunicorn)
- Optioneel: Nginx of Apache als reverse proxy

## Installatie voor macOS

### 1. Installeer Python (indien nog niet geïnstalleerd)
U kunt Python installeren via Homebrew of door het te downloaden van de officiële website.

Met Homebrew:
```bash
brew install python
```

Of download Python van [python.org](https://www.python.org/downloads/macos/).

### 2. Download de applicatie
Download de Sublime Weekendmix Jukebox applicatie en pak deze uit op een gewenste locatie.

```bash
# Maak een map voor de applicatie
mkdir -p ~/Applications/sublime-jukebox
cd ~/Applications/sublime-jukebox

# Download en unzip de applicatie
# [Voeg hier de download link toe]
```

### 3. Installeer de benodigde packages
Open Terminal en navigeer naar de applicatiemap:

```bash
cd ~/Applications/sublime-jukebox
pip3 install -r requirements.txt
```

## Web Implementatie

### 1. Voorbereiden voor productie
Voor een productie-omgeving is het aanbevolen om een WSGI server zoals Gunicorn te gebruiken:

```bash
pip3 install gunicorn
```

### 2. Configureer de WSGI server
Maak een WSGI configuratiebestand aan:

```python
# wsgi.py
from app import app

if __name__ == "__main__":
    app.run()
```

### 3. Start de applicatie met Gunicorn
```bash
gunicorn --bind 0.0.0.0:5000 wsgi:app
```

### 4. Configureer een reverse proxy (optioneel)
Voor betere prestaties en beveiliging kunt u Nginx of Apache als reverse proxy configureren.

Voorbeeld Nginx configuratie:
```nginx
server {
    listen 80;
    server_name jouw-domein.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Spotify Configuratie

Om de Spotify integratie te gebruiken, moet u een Spotify Developer account aanmaken en API sleutels configureren:

1. Ga naar [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in met uw Spotify account (of maak een account aan)
3. Klik op "Create an App"
4. Vul de vereiste informatie in:
   - App name: Sublime Weekendmix Jukebox
   - App description: Een applicatie om The Sublime Weekendmix podcasts af te spelen
   - Website: Uw website of localhost URL
   - Redirect URI: Uw callback URL of localhost URL
5. Accepteer de voorwaarden en klik op "Create"

Maak vervolgens een `.env` bestand aan in de hoofdmap van de applicatie:
```
SPOTIFY_CLIENT_ID=uw_client_id_hier
SPOTIFY_CLIENT_SECRET=uw_client_secret_hier
```

## Starten van de Applicatie

### Lokaal op macOS
```bash
cd ~/Applications/sublime-jukebox
./run.sh
```

De applicatie is nu beschikbaar op http://localhost:5000

### Als webapplicatie
Als u Gunicorn gebruikt:
```bash
cd /pad/naar/applicatie
gunicorn --bind 0.0.0.0:5000 wsgi:app
```

## Probleemoplossing

### Veelvoorkomende problemen

1. **Applicatie start niet op**
   - Controleer of Python correct is geïnstalleerd: `python3 --version`
   - Controleer of alle benodigde packages zijn geïnstalleerd: `pip3 list`
   - Controleer of het run.sh script uitvoerbaar is: `chmod +x run.sh`

2. **Geen audio afspelen**
   - Controleer of uw browser HTML5 audio ondersteunt
   - Controleer of de audio URL's toegankelijk zijn
   - Probeer een andere browser

3. **Spotify integratie werkt niet**
   - Controleer of de Spotify API sleutels correct zijn geconfigureerd in het .env bestand
   - Controleer of uw Spotify Developer App correct is ingesteld
   - Controleer de console logs voor eventuele API fouten

4. **Prestatieproblemen**
   - Voor productiegebruik, gebruik Gunicorn in plaats van de ingebouwde Flask server
   - Overweeg een reverse proxy zoals Nginx te gebruiken voor betere prestaties
   - Optimaliseer de database door regelmatig oude geschiedenis op te schonen
