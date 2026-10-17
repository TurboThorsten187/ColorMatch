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

Unter **STATS** im Menü stehen Spiele, Hi-Score, durchschnittliches Level (auf dem man verloren hat), durchschnittliche
Reaktionszeit (nur Level mit TRUE/FALSE-Antwort) und Spielzeit ohne Pausen, dazu 13 Awards: Level 10, 25, 50 und 100
schaffen sowie je 10 Level mit einem Modifier (beide Spiegel zählen zusammen). Badges antippen zeigt Bedingung und
Fortschritt. Ein neuer Award erscheint sofort kurz unter dem Timer und wird auf dem Game-Over-Screen aufgelistet.

Unter **SETUP** lassen sich Sound (an/aus, Lautstärke in 8 Stufen) und die Scanlines einstellen.
**HOLD TO RESET** (1,5 s gedrückt halten) löscht Highscore, Stats, Awards und Einstellungen. Esc führt zurück ins
Menü. Alles wird lokal im Browser gespeichert.

Sounds gibt es für Treffer, Fehler, Zeitablauf, jeden Tipp einer Spam-Aufgabe (wird pro Tipp höher), Buttons sowie
einen Jingle für Game Over und neuen Rekord. Sie starten erst nach der ersten Eingabe, weil Browser vorher keinen Ton
erlauben. Die Dateien sind OGG Vorbis; Safari und iOS spielen sie ab Version 18.4 ab.

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

- `src/game/` – reine Spiellogik ohne DOM: Zustandsautomat (`game.ts`), Aufgaben, Modifier, Farben, Highscore,
  Einstellungen, Awards (`awards.ts`) und Stats (`stats.ts`). Alle Übergänge sind Funktionen
  `(Zustand, Eingabe, Zeit, Zufall) → neuer Zustand` und damit direkt testbar.
- `src/ui/` – Svelte-Komponenten für die einzelnen Screens; Modifier werden per CSS (Transform, Filter) dargestellt.
  `sound.ts` spielt die Sounds über die Web Audio API ab.
- `src/assets/sounds/` – die Sound-Dateien.
- `src/App.svelte` – verbindet beides: Spielschleife (`requestAnimationFrame`), Tastatur und Touch, Pause beim
  Verlassen des Tabs, Highscore, Einstellungen und Stats speichern, Sounds zu Spielereignissen.

## Credits

Sounds: [Kenney](https://kenney.nl) (Digital Audio, Interface Sounds), Lizenz CC0. Verwendet und umbenannt:
`powerUp2` → `hit`, `error_008` → `miss`, `error_006` → `timeout`, `tick_001` → `spam-tap`, `click_003` → `click`,
`zapThreeToneDown` → `game-over`, `zapThreeToneUp` → `record`.

## Deployment

Bei jedem Push auf `main` baut der Workflow `.github/workflows/deploy.yml` das Spiel und veröffentlicht `dist/`
auf GitHub Pages. Dafür muss unter **Settings → Pages → Build and deployment → Source** einmalig
**GitHub Actions** ausgewählt sein.
