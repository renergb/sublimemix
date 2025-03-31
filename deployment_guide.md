# Deployment Handleiding voor Sublime Weekendmix Jukebox

Deze handleiding beschrijft hoe je de Sublime Weekendmix Jukebox applicatie kunt deployen op verschillende platforms.

## Lokale Deployment (macOS)

1. Zorg ervoor dat Python 3.6 of hoger is geïnstalleerd:
   ```
   python3 --version
   ```

2. Installeer de vereiste packages:
   ```
   pip3 install -r requirements.txt
   ```

3. Maak de run.sh script uitvoerbaar:
   ```
   chmod +x run.sh
   ```

4. Bewerk de run.sh script om je Spotify API credentials toe te voegen (optioneel):
   ```
   export SPOTIFY_CLIENT_ID="jouw_client_id"
   export SPOTIFY_CLIENT_SECRET="jouw_client_secret"
   ```

5. Start de applicatie:
   ```
   ./run.sh
   ```

6. Open een browser en ga naar http://localhost:5000

## Web Deployment (Railway)

1. Maak een account aan op [Railway](https://railway.app/) als je die nog niet hebt

2. Installeer de Railway CLI:
   ```
   npm i -g @railway/cli
   ```

3. Login op Railway:
   ```
   railway login
   ```

4. Initialiseer een nieuw project:
   ```
   railway init
   ```

5. Deploy de applicatie:
   ```
   railway up
   ```

6. Voeg de volgende environment variables toe via het Railway dashboard:
   - `SPOTIFY_CLIENT_ID`: Je Spotify Client ID
   - `SPOTIFY_CLIENT_SECRET`: Je Spotify Client Secret

7. Open de gedeployde applicatie via de URL die Railway je geeft

## Web Deployment (Heroku)

1. Maak een account aan op [Heroku](https://heroku.com/) als je die nog niet hebt

2. Installeer de Heroku CLI:
   ```
   brew install heroku/brew/heroku
   ```

3. Login op Heroku:
   ```
   heroku login
   ```

4. Maak een nieuwe Heroku app:
   ```
   heroku create sublime-weekendmix
   ```

5. Maak een Procfile aan:
   ```
   echo "web: gunicorn app:app" > Procfile
   ```

6. Voeg gunicorn toe aan requirements.txt:
   ```
   echo "gunicorn" >> requirements.txt
   ```

7. Initialiseer een Git repository en commit de code:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```

8. Push de code naar Heroku:
   ```
   git push heroku master
   ```

9. Voeg de volgende environment variables toe:
   ```
   heroku config:set SPOTIFY_CLIENT_ID="jouw_client_id"
   heroku config:set SPOTIFY_CLIENT_SECRET="jouw_client_secret"
   ```

10. Open de gedeployde applicatie:
    ```
    heroku open
    ```

## Troubleshooting

- **Applicatie start niet**: Controleer of alle vereiste packages zijn geïnstalleerd
- **Geen afleveringen zichtbaar**: Controleer je internetverbinding
- **Spotify integratie werkt niet**: Controleer of je de juiste API credentials hebt ingesteld
- **Downloads werken niet**: Controleer of de downloads directory bestaat en schrijfbaar is
