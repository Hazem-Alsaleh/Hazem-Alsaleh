# Eiendomsmegler-nettside for Syria (arabisk)

En statisk nettside (HTML/CSS/JavaScript) på arabisk, skrevet fra høyre mot venstre, for salg og utleie av boliger i alle Syrias 14 provinser. Strukturen er inspirert av norske meglersider som EIE, men design og tekst er laget fra bunnen av.

## Sider

| Fil | Innhold |
| --- | --- |
| `index.html` | Forside: søk (salg/leie, provins, by/bydel, type), tre innganger (kjøpe / leie / selge), utvalgte boliger, skjema for gratis verdivurdering, søk per provins, salgsprosessen, boligguide |
| `properties.html` | Søkeresultater med filtre: provins, by/bydel, type, pris, rom, areal, eierform (طابو أخضر o.l.), standard, møblert, favoritter, sortering |
| `property.html?id=101` | Boligside: bildegalleri, nøkkeltall, beskrivelse, fakta, fasiliteter, kart-lenke, megler, skjema for visning, lignende boliger |
| `sell.html` | Selge eller leie ut bolig: fordeler, prosess, skjema for verdivurdering, vanlige spørsmål |
| `agents.html` | Meglere per provins |
| `contact.html` | Kontorer og kontaktskjema |

## Slik endrer du innholdet

Alt du trenger å endre ligger i `assets/js/`:

- **`config.js`**: firmanavn (nå «اسم الشركة» som plassholder), slagord, telefon, WhatsApp-nummer, e-post, adresse, åpningstider, kontorer og lenker til sosiale medier. Endrer du firmanavnet her, endres det på alle sider.
- **`locations.js`**: provinsene og byene. Damaskus er én by, og listen under den er bydelene (المزة، الميدان، ساروجة …). Legg til eller fjern bydeler etter behov.
- **`listings.js`**: boligene og meglerne. **Alle boliger og meglernavn er eksempler** og må byttes ut med ekte data. Hver bolig har pris (USD eller SYP), areal, rom, etasje, standard (الإكساء), eierform (نوع الملكية), fasiliteter og bilder.

Bildene ligger i `assets/img/`. Det er stockbilder fra Unsplash (fri bruk) og bør byttes med bilder av de ekte boligene. Legg et nytt bilde i mappen og skriv filnavnet uten `.jpg` i `images` på boligen.

## Skjemaer

Nettsiden har ingen server. Når noen sender et skjema (verdivurdering, visning, kontakt), får de en bekreftelse og en knapp som åpner WhatsApp med ferdig utfylt melding til firmaets nummer. Vil du heller motta skjemaene på e-post eller i en database, må de kobles til en tjeneste eller et eget backend.

## Kjøre lokalt

```bash
cd real-estate
python3 -m http.server 8000
# åpne http://localhost:8000
```

## Publisere gratis med GitHub Pages

Gå til *Settings → Pages* i repoet, velg grenen og mappen `/ (root)`. Siden blir da tilgjengelig på `https://<brukernavn>.github.io/<repo>/real-estate/`.
