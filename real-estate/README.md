# Eiendomsmegler-nettside for Syria (arabisk)

En arabisk nettside for salg og utleie av boliger i alle Syrias 14 provinser. Teksten leses fra høyre mot venstre. Siden har et administrasjonspanel der firmaet legger inn boliger, bilder og meglere og leser henvendelser fra skjemaene. Strukturen er inspirert av norske meglersider som EIE, men design og tekst er laget fra bunnen av.

## Innhold

| Del | Hva den gjør |
| --- | --- |
| `index.html`, `properties.html`, `property.html`, `sell.html`, `agents.html`, `contact.html` | Den offentlige nettsiden |
| `admin/` | Administrasjonspanelet (`/admin/`) |
| `server/` | Node.js-server (Express) med API, innlogging og bildeopplasting |
| `assets/js/config.js`, `locations.js`, `listings.js` | Startdata og lister over provinser, byer, boligtyper osv. |
| `data/` | Opprettes ved første start. Her lagres boliger, meglere, innstillinger, henvendelser og brukere (JSON-filer). Ikke i git. |
| `uploads/` | Bilder lastet opp fra panelet. Ikke i git. |

## Starte med administrasjonspanelet

Krever Node.js 18 eller nyere.

```bash
cd real-estate
npm install
npm run create-admin   # lag første bruker (brukernavn + passord på minst 10 tegn)
npm start              # http://localhost:3000  og panelet på http://localhost:3000/admin/
```

Første gang serveren starter, kopieres eksempelboligene, meglerne og innstillingene fra `assets/js/` inn i `data/`. Etter det er det `data/` som gjelder, og alt endres i panelet.

`npm run create-admin` kan også brukes til å gi en eksisterende bruker nytt passord, hvis noen har glemt det.

## Hva panelet kan

- **Oversikt:** antall publiserte boliger, til salgs og til leie, utkast og nye henvendelser. Har også en sjekkliste over det som må gjøres før lansering (firmanavn, ekte telefonnummer, bytte ut eksempelboliger).
- **Boliger:** søk og filtrer, endre status direkte i listen (publisert / utkast / solgt / utleid), merk som «fremhevet» (vises på forsiden), rediger, kopier og slett.
- **Legg inn og rediger bolig:**
  - Alle feltene som vises på nettsiden: provins og by eller bydel, pris i USD eller SYP, månedlig eller årlig leie, areal, rom, etasje, standard (الإكساء), retning, eierform (طابو أخضر o.l.), møblert, fasiliteter og megler.
  - Bilder lastes opp fra PC eller mobil og forminskes automatisk før opplasting. Det første bildet er hovedbildet, og rekkefølgen kan endres.
  - En bolig kan ikke publiseres uten minst ett bilde.
  - Du blir advart hvis du prøver å forlate siden med endringer som ikke er lagret.
- **Henvendelser:** alle skjemaene på nettsiden lagres her: verdivurdering, visning, «selg boligen din» og kontakt. Du kan ringe eller åpne WhatsApp direkte, endre status (ny / under behandling / ferdig) og slette. Antall nye vises i menyen og oppdateres hvert minutt.
- **Meglere:** legg til, endre og slett. Hver megler kan ha eget telefonnummer og WhatsApp. Ellers brukes firmaets nummer.
- **Innstillinger:**
  - Firmanavn, slagord, telefon, WhatsApp, e-post, adresse, åpningstider, kontorer og sosiale medier.
  - Standardvaluta, og om merknaden «eksempler» skal vises nederst på siden.
  - Brukere og bytte av passord.

## Sikkerhet

- Passord lagres som scrypt-hash, aldri i klartekst. Innloggingen bruker en httpOnly-cookie, og bare en hash av øktnøkkelen lagres på serveren.
- Etter 8 mislykkede innlogginger blokkeres IP-adressen i 15 minutter.
- Endringer i panelet krever en egen header, slik at andre nettsteder ikke kan sende skjemaer inn i panelet.
- Opplastede filer sjekkes for å være ekte JPG-, PNG- eller WebP-bilder og får tilfeldige navn.
- Skjemaene på nettsiden har et skjult felt mot spam og en grense på 10 henvendelser per time per IP-adresse.
- `data/`, `server/` og `package.json` serveres aldri til nettleseren.

**I produksjon:**
- Kjør siden over https (f.eks. bak Caddy eller nginx) med `COOKIE_SECURE=1` og `TRUST_PROXY=1`.
- Ta jevnlig sikkerhetskopi av mappene `data/` og `uploads/`.

## Miljøvariabler

| Variabel | Standard | Forklaring |
| --- | --- | --- |
| `PORT` | `3000` | Porten serveren lytter på |
| `DATA_DIR` | `./data` | Hvor dataene lagres |
| `UPLOADS_DIR` | `./uploads` | Hvor bildene lagres |
| `COOKIE_SECURE` | av | Sett til `1` når siden kjøres over https |
| `TRUST_PROXY` | av | Sett til `1` når serveren står bak en proxy |

## Uten server (GitHub Pages)

Nettsiden fungerer også som ren statisk side. Da vises eksempeldataene fra `assets/js/`, og skjemaene sendes via WhatsApp i stedet for å lagres. Panelet krever serveren, og forklarer det hvis det åpnes uten.

## Tester

```bash
npm test
```

Testene sjekker blant annet:
- innlogging og at panelet er stengt for andre
- oppretting, publisering og sletting av bolig med bilde
- henvendelser fra nettsiden
- at datafilene ikke kan lastes ned

## Eksempeldata og bilder

Alle boliger og meglernavn i startdataene er eksempler. Bildene i `assets/img/` er stockbilder fra Unsplash (fri bruk). Bytt dem ut med ekte boliger i panelet. Slå deretter av merknaden «eksempler» under Innstillinger.
