# Mulig utvikling — Morgenbriefing

## Nåværende funksjonalitet
- Google Calendar-integrasjon (3 kalendere)
- Daglig AI-briefing (basert på kalender, todos, ukens fokus)
- Google Tasks-synkronisering (til-dos)
- Belastningsindikator (Lett dag / Høy puls / etc)
- Ukens fokus (1–3 prioriteringer)
- 4-dagers preview av kommende dager
- PWA/mobilapp-kapabilitet

---

## Høy verdi, lav kompleksitet

### Ukentlig gjennomgang
**Hva:** En seksjon (eller egen view) på søndagen som viser:
- Fokus satt denne uken
- Hvor mange todos som ble fullført
- Hvor mange dager som var tette/rolige
- Mønster eller refleksjon over uken

**Hvorfor:** Lukker løkka — setter fokus → gjør ting → ser hva som skjedde. Lærer får en følelse av progresjon.

**Implementering:** Kanskje en enkel "uke-oversikt" i høyre panel på søndager, eller en dedikert seksjon under AI-assistent.

### Notater på kalendereventer
**Hva:** Mulighet å skribble ned notater etter et møte (knyttet til spesifikk event):
- "Avtalt oppfølging med Kari neste uke"
- "Må forberede demo neste gang"
- "Dårlig oppslutning — vurder endret format"

**Hvorfor:** Kontekst når du ser samme event igjen senere. Nyttig for lærere som har gjengangsmøter (elevsamtaler, klassemøter, etc).

**Implementering:** Småikon på kalenderevents, modal for note-taking, lagres via ny API-rute.

---

## Kanskje senere

### Gjengangsmønstre og innsikt
- "Du har 14 elevsamtaler denne måneden" → hjelper med planlegging av ukenes fokus
- "Torsdag er alltid tight — vurder å legge møter på andre dager"
- "Gjennomsnittlig 8 timer booket per dag denne uken"

### Veiledet forberedelse
- Når du har "møte med ledelse" på mandag, kunne AI foreslå "sett av fredag ettermiddag for å forberede møtet"
- Flagge events med beskrivelser som "needs prep" basert på AI-gjenkjenning

### Varsel før tight periode
- "Du har 3 dager på rad med 6+ timer booket — vurder å skyve mindre viktige møter"

---

## Ikke nødvendig nå
- Slack/email-sync
- Gradebok-integrasjon
- Separate notat-app
- Habit-tracking
- Mood/energi-tracking

---

## Testplan før utvikling

**Test nåværende funksjonalitet i 2–3 uker:**
- Ukens fokus — blir det brukt aktivt?
- AI-assistenten — er svarene nyttige?
- Todos — hva mangler?
- Belastningsindikatoren — relevant?

**Etterpå:** Se hva som faktisk mangler versus hva som virker fancy men ubrukt. Prioriter basert på reell bruk, ikke ide-fase.
