# ColorMatch

Ein schnelles Reaktionsspiel im Browser: Passt das angezeigte Wort zu seiner Schriftfarbe?

| Eingabe                               | Tastatur            | Touch / Maus                   |
| ------------------------------------- | ------------------- | ------------------------------ |
| TRUE – Wort und Farbe stimmen überein | **←** Pfeil links   | linke Bildschirmhälfte tippen  |
| FALSE – Wort und Farbe passen nicht   | **→** Pfeil rechts  | rechte Bildschirmhälfte tippen |
| Starten, Fortsetzen                   | **Enter**           | irgendwo tippen                |
| Nach Game Over: nochmal / Menü        | **Enter** / **Esc** | RETRY / MENU                   |

Wechselt man den Tab oder die App, pausiert das Spiel; danach geht es mit derselben Aufgabe und der Restzeit weiter.

Der Balken oben zeigt die verbleibende Zeit, mit jedem Level wird sie knapper. Ab Level 5 kommen Modifier dazu, die den Text spiegeln, drehen,
verwischen oder die Regeln ändern:

| Modifier                     | ab Level | Wirkung                                          |
| ---------------------------- | -------- | ------------------------------------------------ |
| Vertical / Horizontal Mirror | 5        | Text wird gespiegelt                             |
| Background Color             | 5        | farbiger Hintergrund als Ablenkung               |
| Inverted Input               | 10       | richtige Antwort ist umgedreht                   |
| Don't Click                  | 10       | nichts drücken oder tippen, bis die Zeit abläuft |
| Blink                        | 10       | Text verschwindet nach 0,5 s, Hintergrund bleibt |
| Blurred                      | 10       | Text ist unscharf                                |
| Rotation                     | 10       | Text ist gedreht                                 |
| Spam                         | 15       | fünfmal schnell drücken oder tippen (egal wo)    |
| Inverted Colors              | 30       | alle Farben sind invertiert                      |

Der Highscore wird lokal im Browser gespeichert.

## Entwicklung

Voraussetzung: Node.js 20.19+ oder 22.13+.

```bash
npm ci
npm run dev        # Dev-Server mit Hot Reload
npm run dev -- --host  # zusätzlich im WLAN erreichbar, z. B. zum Testen auf dem Handy
npm run check      # alles, was auch die CI prüft: lint, typecheck, test, build
npm test           # Unit-Tests (Vitest)
npm run typecheck  # svelte-check (TypeScript und Svelte)
npm run lint       # ESLint und Prettier prüfen
npm run format     # mit Prettier formatieren
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
```

Das Spiel ist mit Svelte 5 und TypeScript gebaut (`src/`):

- `src/game/` – reine Spiellogik ohne DOM: Zustandsautomat (`game.ts`), Aufgaben, Modifier, Farben, Highscore.
  Alle Übergänge sind Funktionen `(Zustand, Eingabe, Zeit, Zufall) → neuer Zustand` und damit direkt testbar.
- `src/ui/` – Svelte-Komponenten für die einzelnen Screens; Modifier werden per CSS (Transform, Filter) dargestellt.
- `src/App.svelte` – verbindet beides: Spielschleife (`requestAnimationFrame`), Tastatur und Touch, Pause beim
  Verlassen des Tabs, Highscore-Speicher.

## Deployment

Bei jedem Push auf `main` baut der Workflow `.github/workflows/deploy.yml` das Spiel und veröffentlicht `dist/`
auf GitHub Pages. Dafür muss unter **Settings → Pages → Build and deployment → Source** einmalig
**GitHub Actions** ausgewählt sein.
