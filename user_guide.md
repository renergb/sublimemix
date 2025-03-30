# Sublime Weekendmix Jukebox - Gebruikershandleiding

## Inhoudsopgave
1. [Introductie](#introductie)
2. [Aan de slag](#aan-de-slag)
3. [Navigatie](#navigatie)
4. [Afspelen van afleveringen](#afspelen-van-afleveringen)
5. [Favorieten beheren](#favorieten-beheren)
6. [Nummers markeren en Spotify integratie](#nummers-markeren-en-spotify-integratie)
7. [Instellingen en voorkeuren](#instellingen-en-voorkeuren)
8. [Veelgestelde vragen](#veelgestelde-vragen)

## Introductie

Welkom bij de Sublime Weekendmix Jukebox! Deze applicatie stelt u in staat om alle afleveringen van "The Sublime Weekendmix" podcast te beluisteren in een gebruiksvriendelijke interface geïnspireerd op Spotify. De applicatie biedt geavanceerde functies zoals doorlopend afspelen, willekeurige volgorde, favorieten markeren, reclames overslaan en Spotify integratie.

## Aan de slag

### Toegang tot de applicatie
Open uw webbrowser en ga naar de URL van de applicatie. Als u de applicatie lokaal heeft geïnstalleerd, is dit meestal:
```
http://localhost:5000
```

### Eerste gebruik
Bij het eerste gebruik zal de applicatie automatisch alle beschikbare afleveringen van The Sublime Weekendmix ophalen. Dit kan enkele momenten duren. Zodra dit voltooid is, ziet u de startpagina met recente afleveringen en navigatieopties.

## Navigatie

De interface bestaat uit de volgende hoofdonderdelen:

### Zijbalk
Links vindt u de zijbalk met de volgende navigatieopties:
- **Home**: Startpagina met recente afleveringen en favorieten
- **Alle Afleveringen**: Overzicht van alle beschikbare afleveringen
- **Favorieten**: Uw favoriete afleveringen
- **Favoriete Nummers**: Nummers die u heeft gemarkeerd binnen afleveringen

Onderaan de zijbalk vindt u de "Vernieuwen" knop om de lijst met afleveringen bij te werken.

### Hoofdgedeelte
Het hoofdgedeelte toont de inhoud van de geselecteerde navigatieoptie.

### Speler
Onderaan de pagina vindt u de speler met bedieningselementen voor het afspelen van afleveringen.

## Afspelen van afleveringen

### Een aflevering starten
Klik op een aflevering in de lijst om deze af te spelen. De aflevering wordt automatisch gestart en reclames aan het begin worden overgeslagen.

### Bedieningselementen
In de speler onderaan de pagina vindt u de volgende bedieningselementen:
- **Afspelen/Pauzeren**: Start of pauzeer de huidige aflevering
- **Vorige**: Ga naar de vorige aflevering
- **Volgende**: Ga naar de volgende aflevering
- **Voortgangsbalk**: Toont de afspeelpositie en kan worden gebruikt om naar een specifiek punt te navigeren
- **Volume**: Pas het volume aan met de volumeschuif

### Doorlopend afspelen
Standaard speelt de applicatie automatisch de volgende aflevering af na het einde van de huidige aflevering. U kunt deze functie in- of uitschakelen met de "Doorlopend" knop in de hoofdbalk.

### Willekeurige volgorde
Klik op de "Willekeurig" knop in de hoofdbalk om afleveringen in willekeurige volgorde af te spelen. De applicatie onthoudt welke afleveringen al zijn afgespeeld om herhaling te voorkomen.

## Favorieten beheren

### Afleveringen als favoriet markeren
Klik op het hartpictogram bij een aflevering om deze als favoriet te markeren. Gemarkeerde favorieten worden weergegeven in de "Favorieten" sectie.

### Favorieten verwijderen
Klik nogmaals op het hartpictogram bij een favoriete aflevering om deze te verwijderen uit uw favorieten.

## Nummers markeren en Spotify integratie

### Een nummer markeren
1. Tijdens het afspelen van een aflevering, klik op het muzieknotenpictogram in de speler wanneer u een nummer hoort dat u wilt markeren
2. Voer de titel en artiest van het nummer in
3. Klik op "Opslaan"

### Spotify zoekresultaten
Na het markeren van een nummer zoekt de applicatie automatisch naar overeenkomende nummers op Spotify (indien geconfigureerd). U kunt:
- Previews van nummers beluisteren
- Naar het nummer op Spotify gaan
- Een Spotify link koppelen aan het gemarkeerde nummer

### Favoriete nummers bekijken
Ga naar de "Favoriete Nummers" sectie in de zijbalk om al uw gemarkeerde nummers te bekijken. Hier kunt u:
- Direct naar het tijdstip in de aflevering gaan waar het nummer wordt gespeeld
- De Spotify link openen (indien beschikbaar)
- Nummers verwijderen uit uw favorieten

## Instellingen en voorkeuren

De applicatie onthoudt uw voorkeuren tussen sessies, waaronder:
- Favoriete afleveringen
- Gemarkeerde nummers
- Volume-instellingen
- Doorlopend afspelen voorkeur
- Willekeurige volgorde voorkeur

## Veelgestelde vragen

### Hoe kan ik de nieuwste afleveringen ophalen?
Klik op de "Vernieuwen" knop onderaan de zijbalk om de lijst met afleveringen bij te werken.

### Waarom werkt de Spotify integratie niet?
De Spotify integratie vereist configuratie van API sleutels. Raadpleeg de implementatiehandleiding voor instructies over het instellen van Spotify API sleutels.

### Worden reclames automatisch overgeslagen?
Ja, de applicatie slaat automatisch de eerste 30 seconden van elke aflevering over, waar meestal reclames te horen zijn.

### Kan ik de applicatie offline gebruiken?
De applicatie vereist een internetverbinding om afleveringen te streamen en de Spotify API te gebruiken. Er is momenteel geen offline modus beschikbaar.

### Hoe kan ik de applicatie updaten?
Raadpleeg de implementatiehandleiding voor instructies over het updaten van de applicatie naar de nieuwste versie.
