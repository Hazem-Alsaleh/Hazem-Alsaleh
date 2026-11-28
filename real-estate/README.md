# Eiendomsmegler-nettside for Syria (arabisk)

En arabisk nettside for salg og utleie av boliger i alle Syrias 14 provinser. Teksten leses fra høyre mot venstre. Siden har et administrasjonspanel der firmaet legger inn boliger, bilder og meglere og leser henvendelser fra skjemaene. Strukturen er inspirert av norske meglersider som EIE, men design og tekst er laget fra bunnen av.

## Innhold

| Del | Hva den gjør |
| --- | --- |
| `index.html` | Forsiden |
| `sale.html` | Kjøp og salg (البيع والشراء): søk, nyeste salgsboliger, kjøperguide, salgsprosess og skjema for verdivurdering |
| `rent.html` | Leie og utleie (الإيجار): søk, nyeste utleieboliger, leietakerguide, utleieprosess og skjema for å leie ut |
| `properties.html`, `property.html` | Søkeresultater (alltid enten salg eller leie) og boligside |
| `agents.html`, `contact.html` | Meglere og kontakt |
| `sell.html` | Gammel adresse, sender videre til `sale.html` |
| `admin/` | Administrasjonspanelet (`/admin/`) |
| `server/` | Node.js-server (Express) med API, innlogging og bildeopplasting |
| `assets/js/config.js`, `locations.js`, `listings.js` | Startdata og lister over provinser, byer, boligtyper osv. |
| `data/` | Opprettes ved første start. Her lagres boliger, meglere, innstillinger, henvendelser og brukere (JSON-filer). Ikke i git. |
| `uploads/` | Bilder lastet opp fra panelet. Ikke i git. |

## Starte med administrasjonspanelet

Krever Node.js 20 eller nyere.

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
- **Henvendelser:** alle skjemaene på nettsiden lagres her: verdivurdering, visning, «selg boligen din» og kontakt. Du kan ringe eller åpne WhatsApp direkte, endre status (ny / under behandling / ferdig) og slette. Antall nye vises i menyen og oppdateres hvert minutt. Hver henvendelse viser også om e-postvarselet ble sendt.
- **Meglere:** legg til, endre og slett. Hver megler kan ha eget telefonnummer og WhatsApp. Ellers brukes firmaets nummer. Meglerens e-post vises ikke på nettsiden, men brukes til varsel om visninger.
- **Innstillinger:**
  - Firmanavn, slagord, telefon, WhatsApp, e-post, adresse, åpningstider, kontorer og sosiale medier.
  - E-postvarsel: hvem som skal få e-post ved nye henvendelser, og en knapp for å sende en test-e-post.
  - Standardvaluta, og om merknaden «eksempler» skal vises nederst på siden.
  - Brukere og bytte av passord.

## E-postvarsel ved nye henvendelser

Når noen sender et skjema på nettsiden, kan firmaet få en e-post på arabisk med navn, telefon, WhatsApp-lenke, alle feltene fra skjemaet og en knapp som åpner henvendelsen i panelet. Gjelder henvendelsen en bolig, står boligen med lenke i e-posten.

**1. Legg inn e-postserveren (SMTP) på serveren.** Kopier `.env.example` til `.env` og fyll inn SMTP-innstillingene fra e-postleverandøren eller webhotellet:

```
SITE_URL=https://www.ditt-domene.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@ditt-domene.com
SMTP_PASS=passordet
MAIL_FROM="Firmanavn <noreply@ditt-domene.com>"
```

Start serveren på nytt etterpå. Passordet ligger bare i `.env` på serveren. Det lagres ikke i datafilene, vises aldri i panelet og legges ikke i git. Bruker dere Gmail, må dere lage et «app-passord» (krever totrinnsbekreftelse). Det vanlige passordet fungerer ikke.

**2. Slå på varsel i panelet:** Innstillinger → «إشعارات البريد الإلكتروني».
- Skriv inn opptil 10 mottakeradresser, én per linje.
- Trykk «إرسال بريد تجريبي» for å sjekke at e-posten kommer fram.
- Lagre.
- Velg om visningsforespørsler også skal gå til megleren som har boligen. Megleren må da ha e-post registrert under Meglere.

E-posten sendes i bakgrunnen, så besøkende venter aldri på den. Hvis sendingen feiler, lagres henvendelsen likevel og merkes med en advarsel i panelet. Feilen skrives også i serverloggen. `SITE_URL` brukes til lenkene i e-posten. Uten den sendes e-posten uten lenker. Adressen hentes med vilje ikke fra forespørselen, slik at ingen kan lure inn falske lenker.

For testing uten e-postserver: sett `MAIL_LOG=1`, så skrives e-postene i terminalen i stedet.

## Sikkerhet

Koden er gjennomgått for sårbarheter (tilgangskontroll, innlogging, CSRF, XSS, filopplasting, e-post og hvilke data som vises offentlig). Ingen alvorlige funn. Tiltakene:

- **Innlogging:**
  - Passord lagres som scrypt-hash, aldri i klartekst.
  - Økten ligger i en httpOnly-cookie, og bare en hash av øktnøkkelen lagres på serveren. Cookien får `Secure` automatisk når siden går over https.
  - Etter 8 feilforsøk på samme brukernavn sperres det brukernavnet i 15 minutter, og etter 30 feilforsøk fra samme IP sperres IP-en. Én angriper kan derfor ikke stenge ute alle andre.
  - Byttes et passord med `npm run create-admin` mens serveren kjører, gjelder det nye passordet med en gang.
- **Panelet:**
  - Alle endringer krever en egen header (beskyttelse mot CSRF).
  - Svar fra panelet lagres ikke i mellomlager (`Cache-Control: no-store`).
  - Panelet og API-et er merket `noindex` for søkemotorer.
- **Sikkerhetshoder på alle sider:**
  - Content-Security-Policy: bare egne skript, ingen innramming, skrift bare fra Google Fonts.
  - `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` og `Cross-Origin-Opener-Policy`.
  - HSTS ved https.
- **Data:**
  - `data/` har rettighet 700 og filene 600, så bare brukeren som kjører serveren kan lese dem.
  - `data/`, `server/`, `.env` og `package.json` sendes aldri til nettleseren.
  - Det offentlige API-et viser ikke e-postadresser for varsler, meglernes e-post, henvendelser eller brukere.
- **Opplasting:**
  - Bare ekte JPG-, PNG- og WebP-bilder godtas (filtype og innhold sjekkes), og filnavnene er tilfeldige.
  - Bildene forminskes i nettleseren før opplasting, så GPS-posisjon og annen informasjon i bildefilen fjernes.
- **Skjemaene på nettsiden:** skjult felt mot spam og maks 10 henvendelser per time per IP. Alt som besøkende skriver, escapes i panelet og i e-postene.
- **Pakker:** `npm audit` fant ingen kjente sårbarheter.

**Sjekkliste for drift:**
1. Kjør siden over https (for eksempel Caddy eller nginx foran Node) og sett `TRUST_PROXY=1`. Uten den ser alle besøkende ut til å ha samme IP, og grensene for innlogging og skjemaer slår feil. Serveren skriver en advarsel i loggen hvis dette mangler.
2. Sett `SITE_URL` til den ekte adressen (brukes i e-poster, forhåndsvisning og områdekart).
3. Bruk lange, unike passord for administratorene, og slett brukere som ikke trenger tilgang.
4. Ta jevnlig sikkerhetskopi av `data/` og `uploads/`.
5. Kjør `npm audit` og oppdater pakkene av og til.

## Deling og søkemotorer

- Når en bolig deles på WhatsApp, Facebook eller Telegram, vises en forhåndsvisning med bilde, tittel, pris og sted (Open Graph). Det krever at siden kjøres med serveren og at `SITE_URL` er satt.
- Firmanavnet settes inn i sidetitlene allerede på serveren.
- `robots.txt` stenger panelet og API-et for søkemotorer.
- `sitemap.xml` lister alle sider og publiserte boliger.
- Boligkortene bruker små bilder (640 px), som laster omtrent fire ganger raskere på trege nett. Bilder som lastes opp i panelet, får automatisk en liten versjon.

## Miljøvariabler

| Variabel | Standard | Forklaring |
| --- | --- | --- |
| `PORT` | `3000` | Porten serveren lytter på |
| `DATA_DIR` | `./data` | Hvor dataene lagres |
| `UPLOADS_DIR` | `./uploads` | Hvor bildene lagres |
| `COOKIE_SECURE` | av | Sett til `1` når siden kjøres over https |
| `TRUST_PROXY` | av | Sett til `1` når serveren står bak en proxy |
| `SITE_URL` | – | Nettsidens adresse. Brukes i e-postvarslene, i forhåndsvisning ved deling og i `sitemap.xml` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | – | E-postserveren for varsler (se over) |
| `MAIL_LOG` | av | `1` skriver e-postene i terminalen i stedet for å sende dem |

Variablene kan settes i filen `real-estate/.env` (se `.env.example`).

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
- e-postvarsel: mottakere, at innhold fra besøkende escapes, feilhåndtering og at adressene ikke er offentlige
- at datafilene ikke kan lastes ned

## Eksempeldata og bilder

Alle boliger og meglernavn i startdataene er eksempler. Bytt dem ut med ekte boliger i panelet. Slå deretter av merknaden «eksempler» under Innstillinger.

Bildene er fra Unsplash og kan brukes fritt etter Unsplash-lisensen:

| Fil | Brukes i | Fotograf |
| --- | --- | --- |
| `site-damascus-courtyard.jpg` | Hovedbildet på forsiden (Qasr al-Azem, Damaskus) | Laila H |
| `site-syria-facade.jpg` | Verdivurdering på forsiden | Ghazal Magh |
| `site-aleppo-alley.jpg` | «Selg eller lei ut»-siden (gamlebyen i Aleppo) | Fadi Alagi |
| Øvrige bilder i `assets/img/` | Eksempelboligene | Ulike fotografer på Unsplash |

Bildene av eksempelboligene er generelle stockbilder og skal byttes ut med bilder av de ekte boligene.
