# Sublime Weekendmix Jukebox - Download Functionaliteit

## Inhoudsopgave
1. [Introductie](#introductie)
2. [Individuele Afleveringen Downloaden](#individuele-afleveringen-downloaden)
3. [Batch Download van Alle Mixtapes](#batch-download-van-alle-mixtapes)
4. [Download Beheer](#download-beheer)
5. [Technische Implementatie](#technische-implementatie)

## Introductie

De Sublime Weekendmix Jukebox applicatie biedt nu de mogelijkheid om mixtapes te downloaden voor offline gebruik. U kunt zowel individuele afleveringen downloaden als een batch download starten voor alle beschikbare mixtapes.

## Individuele Afleveringen Downloaden

### Via de Gebruikersinterface
1. Navigeer naar de "Alle Afleveringen" of "Favorieten" sectie
2. Bij elke aflevering vindt u een download-knop (downloadpictogram)
3. Klik op de download-knop om het downloaden te starten
4. De voortgang wordt getoond onder de aflevering
5. Na voltooiing kunt u de gedownloade aflevering vinden in de "Downloads" sectie

### Via de API
U kunt ook de API gebruiken om afleveringen te downloaden:
```
GET /api/episodes/{episode_id}/download
```

Voorbeeld respons:
```json
{
    "success": true,
    "message": "Download started",
    "task_id": "download_1_1743359900",
    "status_url": "/api/downloads/download_1_1743359900/status"
}
```

## Batch Download van Alle Mixtapes

### Via de Gebruikersinterface
1. Navigeer naar de "Downloads" sectie
2. Klik op de "Download Alle Afleveringen" knop
3. Bevestig de actie in het bevestigingsvenster
4. De voortgang van de batch download wordt getoond
5. Na voltooiing zijn alle afleveringen beschikbaar in de "Downloads" sectie

### Via de API
U kunt ook de API gebruiken om alle afleveringen in één keer te downloaden:
```
POST /api/downloads/all
```

Voorbeeld respons:
```json
{
    "success": true,
    "message": "Started downloading 155 episodes",
    "batch_id": "batch_1743359950",
    "status_url": "/api/downloads/batch_1743359950/status"
}
```

## Download Beheer

### Downloads Bekijken
1. Navigeer naar de "Downloads" sectie
2. Hier vindt u een lijst van alle gedownloade afleveringen
3. Voor elke aflevering wordt de bestandsnaam en grootte getoond
4. U kunt gedownloade afleveringen direct afspelen of opnieuw downloaden

### Download Status Controleren
U kunt de status van lopende downloads controleren via de API:
```
GET /api/downloads/{task_id}/status
```

Voorbeeld respons:
```json
{
    "success": true,
    "task": {
        "status": "downloading",
        "progress": 45,
        "episode_id": 1,
        "filename": "episode_1_The_Sublime_weekendmix_met_DJ_Turne_155.mp3",
        "start_time": "2025-03-30T18:38:20.123456"
    }
}
```

### Lijst van Gedownloade Bestanden
U kunt een lijst van alle gedownloade bestanden opvragen via de API:
```
GET /api/downloads
```

Voorbeeld respons:
```json
{
    "success": true,
    "files": [
        {
            "filename": "episode_1_The_Sublime_weekendmix_met_DJ_Turne_155.mp3",
            "size": 102400000,
            "size_mb": 97.66,
            "download_url": "/api/downloads/files/episode_1_The_Sublime_weekendmix_met_DJ_Turne_155.mp3"
        }
    ]
}
```

## Technische Implementatie

### Backend
De download functionaliteit is geïmplementeerd met de volgende componenten:

1. **Asynchrone Verwerking**: Downloads worden verwerkt in achtergrondthreads om de gebruikersinterface responsief te houden.

2. **Voortgangsbewaking**: De voortgang van downloads wordt bijgehouden en kan worden opgevraagd via de API.

3. **Foutafhandeling**: Fouten tijdens het downloaden worden gedetecteerd en gerapporteerd.

4. **Bestandsbeheer**: Gedownloade bestanden worden opgeslagen in de `downloads` map van de applicatie.

### Frontend
De gebruikersinterface biedt de volgende functies:

1. **Download Knoppen**: Elke aflevering heeft een download-knop.

2. **Voortgangsindicatoren**: De voortgang van downloads wordt getoond met een voortgangsbalk.

3. **Downloads Sectie**: Een speciale sectie voor het beheren van gedownloade afleveringen.

4. **Batch Download**: Een knop om alle afleveringen in één keer te downloaden.

5. **Notificaties**: Meldingen voor het starten, voltooien en mislukken van downloads.
