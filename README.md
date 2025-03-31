# Sublime Weekendmix Jukebox

Een jukebox-achtige applicatie voor het afspelen van "The Sublime Weekendmix" podcasts met een Mixcloud-stijl interface.

## Functies

- Doorlopend afspelen van afleveringen
- Willekeurige volgorde optie
- Favorieten markeren (zowel afleveringen als specifieke nummers)
- Automatisch overslaan van reclames
- Waveform visualisatie van de mix
- Markeren van favoriete nummers binnen een mix
- Spotify integratie voor het zoeken en koppelen van nummers
- Download functionaliteit

## Installatie

### Vereisten

- Python 3.6 of hoger
- Flask
- Feedparser
- Requests

### Installatie stappen

1. Clone of download deze repository
2. Installeer de vereiste packages:
   ```
   pip install flask feedparser requests
   ```
3. Maak de run.sh script uitvoerbaar:
   ```
   chmod +x run.sh
   ```
4. Start de applicatie:
   ```
   ./run.sh
   ```
5. Open een browser en ga naar http://localhost:5000

## Spotify Integratie

Voor de Spotify integratie heb je een Spotify Developer account nodig:

1. Ga naar [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in of maak een account aan
3. Maak een nieuwe applicatie aan
4. Kopieer de Client ID en Client Secret
5. Voeg deze toe aan de run.sh script:
   ```
   export SPOTIFY_CLIENT_ID="jouw_client_id"
   export SPOTIFY_CLIENT_SECRET="jouw_client_secret"
   ```

## Gebruik

- **Afspelen**: Klik op een aflevering om deze af te spelen
- **Favorieten**: Klik op het hartje om een aflevering als favoriet te markeren
- **Willekeurig afspelen**: Schakel de "Shuffle" knop in voor willekeurige volgorde
- **Nummers markeren**: Klik op de waveform en gebruik de "Markeer nummer" knop
- **Spotify zoeken**: Voer een titel en/of artiest in en klik op "Zoek op Spotify"
- **Downloads**: Gebruik de download knop om afleveringen te downloaden

## Licentie

Dit project is gemaakt voor persoonlijk gebruik.
