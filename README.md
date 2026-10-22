# ColorMatch

**Passt das Wort zu seiner Farbe?** Ein schnelles Reaktionsspiel im Arcade-Look, direkt im Browser, auf dem Handy auch
als App und offline.

▶ **Spielen:** https://turbothorsten187.github.io/ColorMatch/

## So geht's

Auf dem Bildschirm steht ein Farbwort in einer Schriftfarbe. Stimmen Wort und Farbe überein, ist die Antwort **TRUE**,
sonst **FALSE**: `RED` in Rot ist TRUE, `BLUE` in Rot ist FALSE.

- Jedes Level hat ein Zeitlimit, anfangs 3 s, ab Level 80 nur noch 1 s. Im letzten Viertel wird der Balken rot.
- Ein Fehler oder abgelaufene Zeit beendet das Spiel.
- Ab Level 5 kommen **Modifier** dazu, die das Wort verdrehen oder die Regeln ändern.

Beim ersten Start erklärt ein kurzes Tutorial das Spiel, und jeder neue Modifier wird beim ersten Auftauchen mit einer
Karte vorgestellt. Wechselt man den Tab oder die App, pausiert das Spiel.

## Steuerung

|                  | Tastatur                     | Touch / Maus                   |
| ---------------- | ---------------------------- | ------------------------------ |
| **TRUE**         | **←** oder **A**             | linke Bildschirmhälfte tippen  |
| **FALSE**        | **→** oder **D**             | rechte Bildschirmhälfte tippen |
| Button auswählen | Pfeiltasten oder **WASD**    | Maus darüber bewegen           |
| Button drücken   | **Enter** oder **Leertaste** | Button antippen                |
| Zurück           | **Esc** oder **Backspace**   | ◄                              |

Mit **FLIP CONTROLS** (in SETTINGS) sind TRUE und FALSE vertauscht.

## Modifier

Ab Level 5 kommt alle 3 Level ein neuer Modifier dazu: erst die leichten, dann die mittleren, dann die schweren. Mit
der Zeit kommen mehrere gleichzeitig, und bewegte Modifier werden schneller und stärker (ab Level 80 bis zu 1,5-fach).

### Sie verändern das Wort

| Modifier      | Stufe  | Was passiert                                                            |
| ------------- | ------ | ----------------------------------------------------------------------- |
| Mirror        | leicht | Wort ist gespiegelt: senkrecht, waagrecht oder beides                   |
| Rotation      | leicht | Wort dreht sich                                                         |
| Pulsing       | leicht | Wort wächst und schrumpft schnell                                       |
| Shaky         | leicht | Wort zittert und kippt                                                  |
| Zoom          | leicht | Wort ist winzig und wird mit jedem Level noch kleiner                   |
| Symmetry      | leicht | nur die linke Hälfte ist echt, die rechte ihr Spiegelbild (CYAN → CYYC) |
| Reverse Timer | leicht | der Zeitbalken füllt sich, statt abzulaufen                             |
| Background    | mittel | farbiger Hintergrund als Ablenkung                                      |
| Blurred       | mittel | Wort ist unscharf                                                       |
| Moving        | mittel | Wort ist kleiner und gleitet über den Bildschirm                        |
| Fade          | mittel | Wort blendet in 0,9 s aus                                               |
| Assemble      | mittel | Buchstaben fliegen vom Bildschirmrand herein                            |
| Font Flip     | mittel | jeder Buchstabe wechselt ständig die Schrift                            |
| Negative      | mittel | Bildschirm wird kurz zum Fotonegativ, danach bleibt ein Nachbild        |
| Scrambled     | schwer | Buchstaben werden laufend neu gemischt                                  |

### Sie ändern die Regeln

Ein Schild am Wort zeigt die Regel an. Pro Level gibt es höchstens eine davon.

| Modifier       | Stufe  | Was zu tun ist                                                        |
| -------------- | ------ | --------------------------------------------------------------------- |
| Don't Click    | mittel | nichts drücken, bis die Zeit abläuft                                  |
| Spam           | mittel | fünfmal schnell irgendwo tippen                                       |
| Inverted Input | schwer | die Antwort ist umgedreht                                             |
| Wait           | schwer | erst antworten, wenn das Schild nach zwei Dritteln der Zeit NOW zeigt |
| Double Tap     | schwer | die Antwort zweimal drücken                                           |
| Duo            | schwer | zwei Wörter: TRUE, wenn beide oder keins passen (dafür 1 s mehr Zeit) |

### Gut zu wissen

- Jeder Modifier bringt etwas Extrazeit mit: leicht 0,2 s, mittel 0,3 s, schwer 0,4 s. Im Level, in dem ein Modifier
  neu ist, kommt er allein und mit 1 s extra.
- Bei Don't Click läuft nur 60 % der Zeit, damit das Warten nicht zu lang wird.
- Nie zusammen kommen: Symmetry mit Scrambled oder Spam, Fade mit Assemble, Negative, Wait, Duo oder Spam, Spam mit
  Background oder Scrambled, Blurred mit Zoom oder Moving.
- **Surge:** Ab Level 50 ist jedes zehnte Level ein Surge. Fünf Modifier kommen auf einmal (bei jedem weiteren Surge
  einer mehr), und es bleiben 1,3 s.

## Hardcore

Schaltet sich frei, sobald ein normales Spiel Level 50 geschafft hat.

- Alle Modifier können ab Level 1 kommen, in voller Stärke und vollem Tempo.
- Die Grundzeit ist immer 1 s, dazu kommt die Extrazeit der Modifier.
- Alle 3 Level darf ein Modifier mehr gleichzeitig kommen, und kein Level ist ohne.
- Surges gibt es ab Level 10 alle 5 Level.
- Hardcore hat einen eigenen Highscore und zählt nicht für Stats und Awards.

## Stats und Awards

Unter **STATS** stehen Spiele, Hi-Score, das durchschnittliche Level, die durchschnittliche Reaktionszeit und die
Spielzeit. Dazu gibt es 26 Awards: Level 10, 25, 50 und 100 schaffen, 10 Surges überstehen und je 10 Level mit jedem
Modifier. Ein Badge antippen zeigt die Bedingung und den Fortschritt.

## Einstellungen

- **SOUND** an oder aus, Lautstärke in 8 Stufen. Die Sounds sind Chiptunes, die der Browser selbst erzeugt.
- **SCANLINES** für den Röhrenmonitor-Look.
- **COLORBLIND** zeigt Formen statt Farben: Die Wörter nennen Formen, und die Buchstaben sind mit den Formen gefüllt.
  Gefragt ist dasselbe wie sonst.

  | Farbe | Rot   | Grün     | Blau   | Gelb | Lila | Cyan   |
  | ----- | ----- | -------- | ------ | ---- | ---- | ------ |
  | Form  | HEART | TRIANGLE | SQUARE | STAR | PLUS | CIRCLE |

  Blurred, Zoom, Moving und Shaky machen die kleinen Formen unkenntlich und kommen in diesem Modus nicht vor.

- **FLIP CONTROLS** tauscht die Seiten von TRUE und FALSE.
- **REPLAY** zeigt das Tutorial noch einmal.
- **HOLD TO RESET** (1,5 s gedrückt halten) löscht Highscores, Stats, Awards, Einstellungen und den Tutorial-Fortschritt.

Alles wird lokal im Browser gespeichert.

## Als App installieren

In Chrome, Edge und auf Android erscheint im Menü oben rechts **INSTALL**. Sonst geht es über das Browsermenü, in
Safari auf dem iPhone über Teilen → Zum Home-Bildschirm. Die App startet im Vollbild und läuft nach dem ersten Besuch
auch offline; mit Internet lädt sie immer die neueste Version.

## Entwicklung

Voraussetzung: Node.js 20.19+ oder 22.13+.

```bash
npm ci
npm run dev            # Dev-Server mit Hot Reload (--host: auch im WLAN, zum Testen auf dem Handy)
npm run check          # Lint, Typecheck, Unit-Tests und Build – vor jedem Commit
npm run test:e2e       # Browser-Tests mit Playwright, spielen das Spiel in Chromium
npm run format         # mit Prettier formatieren
npm run build          # Produktions-Build nach dist/
npm run preview        # den Build lokal ansehen, mit Service Worker
```

Die Browser-Tests brauchen einmalig ein Chromium: `npx playwright install chromium`. Die CI führt `check` und die
Browser-Tests aus und veröffentlicht nur, wenn beides grün ist.

Auf dem Dev-Server und im Test-Build helfen zwei Adressen:

- `?seed=42` legt den Zufall fest, so lässt sich ein Spiel genau wiederholen.
- `?gallery` zeigt alle Modifier so, wie das Spiel sie zeichnet. `?gallery=moving,shaky` zeigt eine Kombination,
  `&t=500` hält die Zeit an, `&level=80` zeigt die volle Stärke, `&colorblind` die Formen und `&intro=rotation` die
  Karte eines Modifiers.

### Aufbau

Svelte 5 und TypeScript, gebaut mit Vite. Abhängigkeiten laufen nur in eine Richtung, ESLint prüft das:

| Ordner           | Inhalt                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------- |
| `src/ui/`        | Svelte-Komponenten: Screens, HUD, das Wort mit seinen Effekten, Baukasten (`kit/`)     |
| `src/app/`       | die Session: Spielablauf, Eingaben, Spielstand, Stats und Awards, ohne Darstellung     |
| `src/core/`      | reine, getestete Spiellogik: Zustände, Progression, Zeitlimits, Awards, Speicherformat |
| `src/modifiers/` | ein Ordner pro Modifier mit Regeln, Aussehen (`look.ts`), Karte und Award              |
| `src/platform/`  | Browser-Anbindung: Speichern, Sound, Schriften, Installieren                           |
| `e2e/`           | Browser-Tests, die das Spiel wie ein Mensch spielen                                    |

Installieren und Offline-Betrieb übernimmt vite-plugin-pwa: Es rendert die Icons aus `public/favicon.svg` und baut
den Service Worker `src/sw.ts`, der alle Dateien des Builds zwischenspeichert.

Mehr Details und eine Checkliste für neue Modifier stehen in [`CLAUDE.md`](CLAUDE.md).

## Deployment

Jeder Push auf `main` baut das Spiel mit `.github/workflows/deploy.yml` und veröffentlicht es auf GitHub Pages. Dafür
muss unter **Settings → Pages → Build and deployment → Source** einmalig **GitHub Actions** ausgewählt sein.
