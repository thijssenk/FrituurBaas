# 🍟 Frituur Baas

Run je eigen snackbar! Frituur patat, frikandellen, kroketten, kaassoufflés en bitterballen precies goudbruin en help je klanten voordat hun geduld op is.

## Spelen

Open `index.html` in je browser. Je hebt geen installatie of server nodig.

**Op je telefoon?** Open `mobile.html`. Die versie past op één scherm zonder scrollen: je tikt onderin op een snack, daarna op een mandje, en je tikt op een klant om alles wat klaar is meteen te serveren. De knop **Slechte weg** gooit alle rauwe, verbrande en koude snacks in één keer weg.

## Hoe werkt het?

1. **De deuren gaan open.** Je ziet een lege toonbank, de vriezer en 3 lege frituurmanden.
2. **Een klant komt binnen** met een denkwolkje (bijv. 1× Patat, 2× Kroket). De groene geduldbalk loopt langzaam leeg.
3. **Sleep snacks** uit de vriezer naar een mandje (één soort per mandje). Klikken werkt ook: klik op een snack (of druk op **1–5**) en klik daarna op een mandje.
4. **Klik op 🔥 Start frituren.** De snack kleurt van bleek naar goudbruin naar zwart. De naald loopt over de balk: grijs = rauw, **groen = perfect**, zwart = verbrand.
5. **Haal het mandje eruit** en sleep de snacks uit de uitlekbak naar het **dienblad** van de klant. Snacks koelen af, dus wees snel.
6. **Beloning:**
   - Perfect en snel geserveerd: je krijgt de volle prijs plus een flinke fooi.
   - Verbrand: de klant weigert en de snack moet in de prullenbak (inkoop kwijt).
   - Rauw of koud: de klant weigert het.
   - Te lang gewacht: de klant loopt boos weg en je reputatie daalt.

Aan het eind van elke dag zie je je winst en kun je investeren in upgrades: een warmhoudlamp, grote mandjes, een gezellige radio of een vierde frituurmand. Elke dag komen er meer klanten met grotere bestellingen. Staat je reputatie op 0? Dan ben je failliet.

| Snack        | Frituurtijd | Inkoop | Verkoop |
|--------------|-------------|--------|---------|
| Patat        | 3 s         | € 0,40 | € 2,50  |
| Frikandel    | 4 s         | € 0,50 | € 2,20  |
| Kroket       | 5 s         | € 0,60 | € 2,40  |
| Kaassoufflé  | 4,5 s       | € 0,60 | € 2,50  |
| Bitterballen | 3,5 s       | € 1,00 | € 4,50  |

**Sneltoetsen:** `1`–`5` kies een snack · `Esc` annuleren · `P` pauze

## Bestanden

- `index.html`: de opbouw van het scherm
- `style.css`: de opmaak (werkt ook op telefoon)
- `mobile.html` + `mobile.css`: de mobiele versie (gebruikt dezelfde `game.js`)
- `game.js`: de spellogica, snack-tekeningen (SVG) en geluid (Web Audio)
