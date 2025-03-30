# Sublime Weekendmix Jukebox - Gebruikershandleiding (Bijgewerkt)

## Inhoudsopgave
1. [Introductie](#introductie)
2. [Aan de slag](#aan-de-slag)
3. [Navigatie](#navigatie)
4. [Afspelen van afleveringen](#afspelen-van-afleveringen)
5. [Favorieten beheren](#favorieten-beheren)
6. [Nummers markeren en Spotify integratie](#nummers-markeren-en-spotify-integratie)
7. [Downloaden van mixtapes](#downloaden-van-mixtapes)
8. [Instellingen en voorkeuren](#instellingen-en-voorkeuren)
9. [Veelgestelde vragen](#veelgestelde-vragen)

## Introductie

Welkom bij de Sublime Weekendmix Jukebox! Deze applicatie stelt u in staat om alle afleveringen van "The Sublime Weekendmix" podcast te beluisteren in een gebruiksvriendelijke interface geïnspireerd op Spotify. De applicatie biedt geavanceerde functies zoals doorlopend afspelen, willekeurige volgorde, favorieten markeren, reclames overslaan, Spotify integratie en het downloaden van mixtapes voor offline gebruik.

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
- **Downloads**: Gedownloade mixtapes en download beheer

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

## Downloaden van mixtapes

### Individuele afleveringen downloaden
1. Navigeer naar "Alle Afleveringen" of "Favorieten"
2. Bij elke aflevering vindt u een download-knop (downloadpictogram)
3. Klik op deze knop om het downloaden te starten
4. De voortgang wordt getoond onder de aflevering
5. Na voltooiing kunt u de gedownloade aflevering vinden in de "Downloads" sectie

### Alle mixtapes downloaden
1. Navigeer naar de "Downloads" sectie
2. Klik op de "Download Alle Afleveringen" knop
3. Bevestig de actie in het bevestigingsvenster
4. De voortgang van de batch download wordt getoond
5. Na voltooiing zijn alle afleveringen beschikbaar in de "Downloads" sectie

### Gedownloade mixtapes beheren
In de "Downloads" sectie kunt u:
- Alle gedownloade mixtapes bekijken
- De bestandsgrootte van elke download zien
- Gedownloade mixtapes direct afspelen
- Mixtapes opnieuw downloaden indien nodig

## Instellingen en voorkeuren

De applicatie onthoudt uw voorkeuren tussen sessies, waaronder:
- Favoriete afleveringen
- Gemarkeerde nummers
- Volume-instellingen
- Doorlopend afspelen voorkeur
- Willekeurige volgorde voorkeur
- Gedownloade mixtapes

## Veelgestelde vragen

### Hoe kan ik de nieuwste afleveringen ophalen?
Klik op de "Vernieuwen" knop onderaan de zijbalk om de lijst met afleveringen bij te werken.

### Waarom werkt de Spotify integratie niet?
De Spotify integratie vereist configuratie van API sleutels. Raadpleeg de implementatiehandleiding voor instructies over het instellen van Spotify API sleutels.

### Worden reclames automatisch overgeslagen?
Ja, de applicatie slaat automatisch de eerste 30 seconden van elke aflevering over, waar meestal reclames te horen zijn.

### Hoeveel schijfruimte is nodig voor het downloaden van alle mixtapes?
Elke mixtape is ongeveer 100-150 MB groot. Het downloaden van alle 155 afleveringen vereist ongeveer 15-20 GB aan vrije schijfruimte.

### Kan ik de applicatie offline gebruiken?
Ja, voor gedownloade mixtapes. De applicatie vereist een internetverbinding voor het streamen van niet-gedownloade afleveringen en voor het gebruik van de Spotify API.

### Hoe kan ik de applicatie updaten?
Raadpleeg de implementatiehandleiding voor instructies over het updaten van de applicatie naar de nieuwste versie.
