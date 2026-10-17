# ColorMatch

Ein schnelles Reaktionsspiel im Browser: Passt das angezeigte Wort zu seiner Schriftfarbe?

- **← (Pfeil links)**: TRUE – Wort und Farbe stimmen überein
- **→ (Pfeil rechts)**: FALSE – Wort und Farbe stimmen nicht überein
- **Enter**: Spiel starten / nach Game Over zurück ins Menü

Mit jedem Level wird die Zeit knapper. Ab Level 5 kommen Modifier dazu, die den Text spiegeln, drehen,
verwischen oder die Regeln ändern:

| Modifier | ab Level | Wirkung |
| --- | --- | --- |
| Vertical / Horizontal Mirror | 5 | Text wird gespiegelt |
| Background Color | 5 | farbiger Hintergrund als Ablenkung |
| Inverted Input | 10 | richtige Antwort ist umgedreht |
| Don't Click | 10 | keine Taste drücken, bis die Zeit abläuft |
| Blink | 10 | Text verschwindet nach 0,5 s |
| Blurred | 10 | Text ist unscharf |
| Rotation | 10 | Text ist gedreht |
| Spam | 15 | fünfmal schnell eine Pfeiltaste drücken |
| Inverted Colors | 30 | alle Farben sind invertiert |

Der Highscore wird lokal im Browser gespeichert.

## Entwicklung

Voraussetzung: Node.js 20.19+ oder 22.12+.

```bash
npm install
npm run dev        # Dev-Server mit Hot Reload
npm test           # Unit-Tests (Vitest)
npm run typecheck  # TypeScript prüfen
npm run build      # Typecheck + Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
```

Der Code ist in TypeScript geschrieben (`src/`):

- `src/game/` – Spiellogik (Zustände, Aufgaben, Timer, Eingaben, Highscore)
- `src/modifiers/` – Definition der Modifier
- `src/ui/` – Zeichnen auf dem Canvas

## Deployment

Bei jedem Push auf `main` baut der Workflow `.github/workflows/deploy.yml` das Spiel und veröffentlicht `dist/`
auf GitHub Pages. Dafür muss unter **Settings → Pages → Build and deployment → Source** einmalig
**GitHub Actions** ausgewählt sein.
