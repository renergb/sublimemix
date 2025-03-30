# Spotify API Configuratie

Om de Spotify integratie volledig te laten werken, moet u een Spotify Developer account aanmaken en een applicatie registreren om de benodigde API sleutels te verkrijgen.

## Stappen om Spotify API sleutels te verkrijgen:

1. Ga naar [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in met uw Spotify account (of maak een account aan als u er nog geen heeft)
3. Klik op "Create an App"
4. Vul de volgende informatie in:
   - App name: Sublime Weekendmix Jukebox
   - App description: Een applicatie om The Sublime Weekendmix podcasts af te spelen en nummers te identificeren
   - Website: http://localhost:5000 (voor ontwikkeling)
   - Redirect URI: http://localhost:5000/callback (voor ontwikkeling)
5. Accepteer de voorwaarden en klik op "Create"
6. U krijgt nu een Client ID en Client Secret te zien

## Configuratie in de applicatie:

1. Maak een bestand aan genaamd `.env` in de hoofdmap van het project:

```
SPOTIFY_CLIENT_ID=uw_client_id_hier
SPOTIFY_CLIENT_SECRET=uw_client_secret_hier
```

2. Start de applicatie opnieuw op om de Spotify integratie te activeren

## Functionaliteit:

Met de Spotify integratie kunt u:
- Nummers in de mixen markeren op specifieke tijdstippen
- Artiesten en titels van nummers invoeren
- Automatisch zoeken naar overeenkomende nummers op Spotify
- Previews van nummers beluisteren
- Links naar Spotify nummers opslaan bij uw favorieten
