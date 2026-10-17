# ColorMatch

Ein schnelles Reaktionsspiel im Browser: Passt das angezeigte Wort zu seiner Schriftfarbe?

| Eingabe                               | Tastatur            | Touch / Maus                   |
| ------------------------------------- | ------------------- | ------------------------------ |
| TRUE – Wort und Farbe stimmen überein | **←** Pfeil links   | linke Bildschirmhälfte tippen  |
| FALSE – Wort und Farbe passen nicht   | **→** Pfeil rechts  | rechte Bildschirmhälfte tippen |
| Starten, Fortsetzen                   | **Enter**           | irgendwo tippen                |
| Nach Game Over: nochmal / Menü        | **Enter** / **Esc** | RETRY / MENU                   |

Wechselt man den Tab oder die App, pausiert das Spiel; danach geht es mit derselben Aufgabe und der Restzeit weiter.

Ein Fehler oder abgelaufene Zeit beendet das Spiel: Der Bildschirm wackelt, das Wort zerplatzt in Pixel und das Bild
geht aus wie ein alter Röhrenfernseher. RETRY und MENU (Enter / Esc) reagieren erst nach 2 s, damit hektisches
Weitertippen das Ergebnis nicht überspringt.

Der Balken oben zeigt die verbleibende Zeit: 3 s in Level 1, mit jedem Level etwas weniger, bis es sich bei gut
1,2 s einpendelt; ab Level 40 sinkt sie weiter bis 1,0 s bei Level 80. Ab Level 5 kommt alle 3 Level ein neuer Modifier dazu, zuerst die leichten, dann die mittleren, dann
die schweren; innerhalb einer Stufe wird die Reihenfolge jede Runde neu gemischt.

| Modifier         | Stufe  | Wirkung                                                                                            |
| ---------------- | ------ | -------------------------------------------------------------------------------------------------- |
| Mirror           | leicht | Text ist senkrecht, waagrecht oder beides gespiegelt (steht dann auf dem Kopf)                     |
| Rotation         | leicht | Text dreht sich, eine Umdrehung in 2,5 s                                                           |
| Pulsing          | leicht | Text wächst und schrumpft schnell                                                                  |
| Shaky            | leicht | Text zittert und kippt dabei leicht                                                                |
| Background Color | mittel | zufälliger farbiger Hintergrund als Ablenkung                                                      |
| Blurred          | mittel | Text ist unscharf                                                                                  |
| Moving           | mittel | kleinerer Text gleitet schnell über den Bildschirm                                                 |
| Don't Click      | mittel | nichts drücken oder tippen, bis die Zeit abläuft                                                   |
| Blink            | mittel | Text blendet in 0,9 s aus, Hintergrund bleibt                                                      |
| Scrambled        | schwer | Buchstaben werden laufend neu gemischt                                                             |
| Inverted Input   | schwer | richtige Antwort ist umgedreht                                                                     |
| Spam             | schwer | fünfmal schnell drücken oder tippen (egal wo), jeder Druck lässt ein Zeichen von SPAM! aufleuchten |

Ein neuer Modifier kommt in seinem Einführungslevel allein und mit 1 s Extrazeit. Sonst wird gemischt: bis Level 14
höchstens ein Modifier gleichzeitig, bis Level 29 zwei, danach drei, und frisch eingeführte kommen häufiger. Ab Level
15 kommt ein neuer Modifier im Level nach seiner Einführung meist gleich noch einmal, zusammen mit einem bekannten.
Jeder weitere Modifier in einem Level bringt 0,3 s Extrazeit. Rotation, Pulsing, Shaky, Moving, Blink und Scrambled
werden mit dem Level schneller, so wie die Zeit pro Level schrumpft (gut doppelt so schnell bei Level 40, 2,5-mal
ab Level 80). Jeder
startet bei seiner Einführung im normalen Tempo und holt dann innerhalb von 8 Leveln auf; ein spät eingeführter wird
also schneller schnell als ein früher. Höchstens einer pro Level ändert die Regeln (Inverted
Input, Don't Click, Spam), und dieselbe Kombination kommt nie zweimal hintereinander.

Nach der letzten Einführung (Level 38) wird es weiter härter: Von Level 40 bis 80 werden Level ohne Modifier immer
seltener und verschwinden dann ganz, und zwei oder drei Modifier auf einmal werden häufiger. Ab Level 50 ist jedes
zehnte Level ein **Surge**: Ein Banner zeigt 0,9 s lang SURGE, dann kommen vier Modifier gleichzeitig (höchstens eine
Regel), aber nur mit der Grundzeit, ohne Extrazeit pro Modifier.

Beim allerersten Start erklärt ein kurzes Tutorial das Spiel: drei Karten, nach jeder wird sofort geübt (vier Wörter
ohne Zeitdruck, die richtige Seite blinkt, ein falsches Wort kommt nochmal). **SKIP** oder Esc überspringt es, danach
startet direkt das Spiel. Taucht ein Modifier zum ersten Mal auf, pausiert das Level mit voller Zeit und eine Karte
erklärt ihn; **GOT IT** (oder Enter) spielt weiter. Jede Karte erscheint nur einmal.

Unter **STATS** im Menü stehen Spiele, Hi-Score, durchschnittliches Level (auf dem man verloren hat), durchschnittliche
Reaktionszeit (nur Level mit TRUE/FALSE-Antwort) und Spielzeit ohne Pausen, dazu 17 Awards: Level 10, 25, 50 und 100
schaffen, 10 Surges und je 10 Level mit einem Modifier (alle Spiegel zählen zusammen), jeweils über alle Spiele. Badges antippen zeigt Bedingung und
Fortschritt. Ein neuer Award erscheint sofort kurz unter dem Timer und wird auf dem Game-Over-Screen aufgelistet.

Unter **SETUP** lassen sich Sound (an/aus, Lautstärke in 8 Stufen) und die Scanlines einstellen; **REPLAY** zeigt
das Tutorial nochmal (die Modifier-Karten bleiben dabei gesehen). **HOLD TO RESET** (1,5 s gedrückt halten) löscht
Highscore, Stats, Awards, Einstellungen und den Tutorial-Fortschritt. Esc führt zurück ins Menü. Alles wird lokal im
Browser gespeichert.

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
  Einstellungen, Awards (`awards.ts`), Stats (`stats.ts`), Tutorial (`tutorial.ts`), Modifier-Karten
  (`intros.ts`) und Progression (`progression.ts`: Einführungsreihenfolge, Auswahl pro Level, Surges, Zeitlimit). Alle
  Übergänge sind Funktionen `(Zustand, Eingabe, Zeit, Zufall) → neuer Zustand` und damit direkt testbar.
- `src/ui/` – Svelte-Komponenten für die einzelnen Screens; Modifier werden per CSS (Transform, Filter) dargestellt,
  Bewegung, Zittern, Pulsieren und Mischen berechnet `effects.ts` aus der Zeit seit Levelbeginn.
  `sound.ts` spielt die Sounds über die Web Audio API ab.
- `src/assets/sounds/` – die Sound-Dateien.
- `src/App.svelte` – verbindet beides: Spielschleife (`requestAnimationFrame`), Tastatur und Touch, Pause beim
  Verlassen des Tabs, Highscore, Einstellungen, Stats und Tutorial-Fortschritt speichern, Sounds zu Spielereignissen.

## Credits

Sounds: [Kenney](https://kenney.nl) (Digital Audio, Interface Sounds), Lizenz CC0. Verwendet und umbenannt:
`powerUp2` → `hit`, `error_008` → `miss`, `error_006` → `timeout`, `tick_001` → `spam-tap`, `click_003` → `click`,
`zapThreeToneDown` → `game-over`, `zapThreeToneUp` → `record`.

## Deployment

Bei jedem Push auf `main` baut der Workflow `.github/workflows/deploy.yml` das Spiel und veröffentlicht `dist/`
auf GitHub Pages. Dafür muss unter **Settings → Pages → Build and deployment → Source** einmalig
**GitHub Actions** ausgewählt sein.
