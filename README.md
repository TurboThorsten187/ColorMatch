# ColorMatch

Ein schnelles Reaktionsspiel im Browser: Passt das angezeigte Wort zu seiner Schriftfarbe?

| Eingabe                               | Tastatur                     | Touch / Maus                   |
| ------------------------------------- | ---------------------------- | ------------------------------ |
| TRUE – Wort und Farbe stimmen überein | **←** oder **A**             | linke Bildschirmhälfte tippen  |
| FALSE – Wort und Farbe passen nicht   | **→** oder **D**             | rechte Bildschirmhälfte tippen |
| In Menüs einen Button auswählen       | Pfeiltasten oder **WASD**    | Maus darüber bewegen           |
| Ausgewählten Button drücken           | **Enter** oder **Leertaste** | Button antippen                |
| Starten, Fortsetzen                   | **Enter**                    | irgendwo tippen                |
| Zurück zum Menü                       | **Esc** oder **Backspace**   | ◄ / MENU                       |

Mit **FLIP CONTROLS** in SETTINGS sind die Seiten getauscht: FALSE links (**←**, **A**, linke Hälfte), TRUE rechts.

Jeder Button hat eine Farbe (START GAME gelb, HARDCORE und SETTINGS rot, STATS und REPLAY blau, RETRY grün; die übrigen
nehmen Gelb, im Hardcore-Spiel Rot). Im Browser sind die vier Buttons im Menü gleich groß, und Menü, SETTINGS und Game Over
passen sich der Fensterhöhe an, damit nichts scrollt.
Alle Menüs lassen sich nur mit der Tastatur bedienen: Beim ausgewählten Button nehmen Rahmen und Schrift seine Farbe an,
bewegt wird die Auswahl mit den Pfeiltasten oder WASD zum nächsten Button in der Richtung (mit einem leisen Blip). Die
Hervorhebung erscheint nur beim Spielen mit der Tastatur, dann steht unten auch eine kurze Tastenhilfe; der erste
Tastendruck zeigt, wo die Auswahl steht. Im Browser wählt die Maus genauso aus: Der Button unter ihr ist ausgewählt, die
Pfeiltasten machen dort weiter. Im Menü ist START GAME ausgewählt, nach Game Over RETRY, sobald es reagiert. In SETTINGS
ändern ← und → die Lautstärke, wenn die Lautstärke-Leiste ausgewählt ist. Ein gedrückter Button (antippen, klicken,
Enter oder Leertaste) wird kurz etwas kleiner und färbt Rahmen und Schrift, bevor er auslöst.

Wechselt man den Tab oder die App, pausiert das Spiel; danach geht es mit derselben Aufgabe und der Restzeit weiter.

Ein Fehler oder abgelaufene Zeit beendet das Spiel: Der Bildschirm wackelt, das Wort zerplatzt in Pixel und das Bild
geht aus wie ein alter Röhrenfernseher. RETRY und MENU (Enter / Esc) reagieren erst nach 2 s, damit hektisches
Weitertippen das Ergebnis nicht überspringt.

Der Balken oben zeigt die verbleibende Zeit: 3 s in Level 1, mit jedem Level etwas weniger (anfangs etwas mehr, gegen
Ende immer weniger), bis 1,0 s ab Level 80. Im letzten Viertel wird er rot, und ein roter
Rahmen um den Bildschirm leuchtet immer stärker, bis die Zeit abläuft. Ab Level 5 kommt alle 3 Level ein neuer Modifier dazu, zuerst die leichten, dann die mittleren, dann
die schweren; innerhalb einer Stufe wird die Reihenfolge jede Runde neu gemischt.

| Modifier         | Stufe  | Wirkung                                                                                                                                |
| ---------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Mirror           | leicht | Text ist senkrecht, waagrecht oder beides gespiegelt (steht dann auf dem Kopf)                                                         |
| Rotation         | leicht | Text dreht sich, eine Umdrehung in 2,5 s; je stärker, desto ungleichmäßiger (mal bis 1,5-mal so schnell, mal langsamer)                |
| Pulsing          | leicht | Text wächst und schrumpft schnell; je stärker, desto weiter (85–108 % bis 77,5–112 %)                                                  |
| Shaky            | leicht | Text zittert und kippt dabei leicht; je stärker, desto weiter (bis 1,5-mal so weit, Kippen 4° bis 6°)                                  |
| Background Color | mittel | zufälliger farbiger Hintergrund als Ablenkung                                                                                          |
| Blurred          | mittel | Text ist unscharf; je stärker, desto mehr (6 bis 9 px)                                                                                 |
| Moving           | mittel | kleinerer Text gleitet über den Bildschirm, quer hin und zurück in 3 s                                                                 |
| Don't Click      | mittel | nichts drücken oder tippen, bis die Zeit abläuft                                                                                       |
| Fade             | mittel | Text blendet in 0,9 s aus, Hintergrund bleibt                                                                                          |
| Scrambled        | schwer | Buchstaben werden laufend neu gemischt                                                                                                 |
| Inverted Input   | schwer | richtige Antwort ist umgedreht                                                                                                         |
| Spam             | mittel | fünfmal schnell drücken oder tippen (egal wo), jeder Druck lässt ein Zeichen von SPAM! aufleuchten                                     |
| Zoom             | leicht | Text ist winzig: ein Fünftel der normalen Größe, mit jedem Level danach kleiner bis zu einem Zehntel                                   |
| Symmetry         | leicht | nur die linke Hälfte des Worts ist zu sehen, die rechte ist ihr Spiegelbild (CYAN wird zu CYYC)                                        |
| Reverse Timer    | leicht | der Timer läuft rückwärts: er füllt sich von der Mitte aus, erst rot, dann gelb, dann grün                                             |
| Assemble         | mittel | die Buchstaben fliegen vom Bildschirmrand herein, nach einem Viertel der Zeit ist das Wort komplett                                    |
| Font Flip        | mittel | jeder Buchstabe wechselt alle 200 ms in eine andere von 28 Schriften; je stärker, desto öfter die schwer lesbaren (bis 1,5-mal so oft) |
| Negative         | mittel | von 10 % bis 50 % der Zeit ist der ganze Bildschirm ein Fotonegativ, danach kurz ein Nachbild                                          |
| Wait             | schwer | das Schild zeigt in den ersten 40 % der Zeit WAIT, dann NOW; ein Druck vorher ist TOO EARLY!                                           |
| Double Tap       | schwer | die Antwort zweimal drücken, egal wie schnell; ein falscher Druck ist sofort ein Fehler                                                |
| Duo              | schwer | zwei Wörter übereinander: TRUE, wenn beide oder keins zu ihrer Farbe passen (BOTH OR NEITHER); 1,5 s mehr Zeit                         |

Nach dem letzten Druck bei Spam bleibt das ganz erleuchtete SPAM! noch 0,12 s stehen, dann zeigt STOP SPAMMING! 0,5 s
lang, dass weiteres Tippen nichts bringt.

Ein neuer Modifier kommt in seinem Einführungslevel allein und mit 1 s Extrazeit (dazu die Extrazeit seiner Stufe);
fällt die Einführung auf ein
Surge-Level, kommt sie ein Level später. Sonst wird gemischt: Alle 12 Level dürfen mehr Modifier gleichzeitig kommen,
bis Level 12 höchstens einer, ab Level 13 zwei, ab 25 drei, ab 37 vier und so weiter, und frisch eingeführte kommen
häufiger. Sobald zwei erlaubt sind, kommt ein neuer Modifier im Level nach seiner Einführung meist gleich noch einmal,
zusammen mit einem bekannten.
Jeder Modifier in einem Level bringt Extrazeit, auch schon der erste: leicht 0,2 s, mittel 0,3 s, schwer 0,4 s; Duo
bekommt noch 1,5 s obendrauf, auch im Surge und im Hardcore. Bei Don't Click läuft nur 60 % der Zeit, damit man
nicht so lange warten muss. Rotation, Pulsing, Shaky, Moving, Fade, Scrambled und Font Flip
werden mit dem Level schneller, so wie die Zeit pro Level schrumpft (etwa 1,18-mal so schnell bei Level 40, 1,5-mal so
schnell ab Level 80). Jeder
startet bei seiner Einführung im normalen Tempo und holt dann innerhalb von 8 Leveln auf; ein spät eingeführter wird
also schneller schnell als ein früher. Genauso wachsen Rotation, Pulsing, Shaky, Blurred und Font Flip in ihrer
**Stärke** (siehe Tabelle): sanft im Einführungslevel, voll ab Level 80, und voll ist höchstens 1,5-mal so stark wie
sanft. Höchstens einer pro Level ändert die Regeln (Inverted
Input, Don't Click, Spam, Wait, Double Tap, Duo), und dieselbe Kombination kommt nie zweimal hintereinander.
Nie zusammen kommen Symmetry mit Scrambled oder Spam, Fade mit Assemble, Negative, Wait, Duo oder Spam, Spam
mit Background oder Scrambled und Zoom mit Blurred (ein winziges unscharfes Wort wäre nur noch ein Fleck). Mit
Symmetry steht Mirrored nur auf dem Kopf, denn links-rechts gespiegelt sähe das
Wort gleich aus. Bei Duo wirken Scrambled, Blurred, Symmetry, Assemble, Font Flip und das Nachbild von Negative auf
beide Wörter. Die
Hinweise DON'T CLICK, INVERTED INPUT, WAIT/NOW, DOUBLE TAP und BOTH OR NEITHER hängen am Wort und bekommen die meisten Modifier mit: Sie werden mit ihm gespiegelt (stehen dann auch mal
darunter), gedreht, bewegt und unscharf, blenden mit aus und ihre Buchstaben werden gemischt. Jedes Schild trägt vorn und
hinten ein Pixel-Icon seiner Regel (Kreuz, Pfeile links/rechts, Pause und bei NOW Play, zwei Punkte, Gleichheitszeichen),
damit man die Regel erkennt, ohne zu lesen; das Play-Icon hinten ist gespiegelt und zeigt so auch zum Text.

Nach der letzten Einführung (Level 65) wird es weiter härter: Von Level 40 bis 80 werden Level ohne Modifier immer
seltener und verschwinden dann ganz. Bis Level 40 kommt meist nur ein Modifier, danach werden mehrere häufiger, und ab
Level 80 ist jede Anzahl bis zum Höchstmaß gleich wahrscheinlich. Ab Level 50 ist jedes
zehnte Level ein **Surge**: Ein Banner zeigt 0,9 s lang SURGE, dann kommen fünf Modifier gleichzeitig, bei jedem
weiteren Surge einer mehr, soweit sie zusammenpassen (höchstens eine Regel). Ein Surge dauert immer 1,3 s, ohne
Extrazeit pro Modifier; nur Duo bringt seine 1,5 s mit.

**HARDCORE** öffnet sich im Menü, sobald ein normales Spiel Level 50 geschafft hat (vorher ist der Button grau mit
Schloss und zeigt beim Drücken kurz CLEAR LEVEL 50). Es gibt keine Einführungen: Alle Modifier können ab Level 1 kommen, mit voller
Stärke und 1,5-fachem Tempo, die Grundzeit ist immer 1 s (plus die Extrazeit der Stufen). Ab Level 1 einer, alle 3 Level darf
einer mehr gleichzeitig kommen, nie ein Level ohne Modifier, und jede Anzahl bis zum Höchstmaß ist gleich
wahrscheinlich. Surges kommen ab Level 10 alle 5 Level (fünf Modifier, bei jedem einer mehr, 1,3 s). Hardcore hat
einen eigenen Highscore (im Menü neben dem normalen), zählt nicht für Stats und Awards und leuchtet rot statt gelb.
Karten für noch nie gesehene Modifier erscheinen auch hier.

Beim allerersten Start erklärt ein kurzes Tutorial das Spiel: drei Karten, nach jeder wird sofort geübt (vier Wörter
ohne Zeitdruck, die richtige Seite blinkt, ein falsches Wort kommt nochmal). **SKIP** oder Esc überspringt es, danach
startet direkt das Spiel. Taucht ein Modifier zum ersten Mal auf, pausiert das Level mit voller Zeit und eine Karte
erklärt ihn; **GOT IT** (oder Enter) spielt weiter. Jede Karte erscheint nur einmal.

Unter **STATS** im Menü stehen Spiele, Hi-Score, durchschnittliches Level (auf dem man verloren hat), durchschnittliche
Reaktionszeit (nur Level mit TRUE/FALSE-Antwort, bei Wait ab NOW) und Spielzeit ohne Pausen, dazu 26 Awards: Level 10, 25, 50 und 100
schaffen, 10 Surges und je 10 Level mit einem Modifier (alle Spiegel zählen zusammen), jeweils über alle Spiele. Badges antippen zeigt Bedingung und
Fortschritt. Ein neuer Award erscheint sofort kurz unter dem Timer und wird auf dem Game-Over-Screen aufgelistet.

Unter **SETTINGS** lassen sich Sound (an/aus, Lautstärke in 8 Stufen), die Scanlines, **COLORBLIND** und
**FLIP CONTROLS** (TRUE und FALSE tauschen die Seiten, auch im Tutorial und auf den Hinweisen) einstellen. Im
Farbenblind-Modus steht jede Farbe für eine Form (Rot = HEART, Grün = TRIANGLE, Blau = SQUARE, Gelb = STAR, Lila =
PLUS, Cyan = CIRCLE): Die Wörter nennen Formen, und die Buchstaben sind mit den Formen ihrer Farbe gefüllt. Gefragt
ist dasselbe, nur passt jetzt das Wort zu den Formen in seinen Buchstaben oder nicht. Der Background-Modifier zeigt
dann große, gedämpfte Formen statt einer Farbe; SPAM! bleibt einfarbig. Tutorial und Modifier-Karten zeigen im
Modus ebenfalls Formen. BLUR, ZOOM, MOVING und SHAKY machen die kleinen Formen unkenntlich und kommen in Spielen mit
diesem Modus nicht vor (ihre Awards gibt es nur ohne ihn), und FONT FLIP wechselt dort nur zwischen dicken Schriften,
in denen die Formen Platz haben. Der Highscore gilt für beide Modi. **REPLAY** zeigt
das Tutorial nochmal (die Modifier-Karten bleiben dabei gesehen). **HOLD TO RESET** (1,5 s gedrückt halten) löscht
beide Highscores, Stats, Awards, Einstellungen und den Tutorial-Fortschritt. Esc führt zurück ins Menü. Alles wird lokal im
Browser gespeichert.

Sounds gibt es für Treffer, Fehler, Zeitablauf, jeden Tipp einer Spam-Aufgabe (wird pro Tipp höher), Buttons, das
Surge-Banner, neue Awards, die Karte eines neuen Modifiers, den Moment, in dem der Timer rot wird (einmal pro Level),
das Abschalten des Bildschirms nach einem Fehler sowie einen Jingle für Game Over und neuen Rekord. Es sind
Chiptune-Sounds, die der Browser beim Abspielen aus Oszillatoren erzeugt, also ohne Sound-Dateien. Sie starten erst
nach der ersten Eingabe, weil Browser vorher keinen Ton erlauben.

## Als App installieren

ColorMatch lässt sich als App installieren (PWA). In Chrome, Edge und auf Android erscheint dafür oben rechts im Menü
**INSTALL**; sonst geht es über das Browsermenü (Safari auf dem iPhone: Teilen → Zum Home-Bildschirm). Die App startet
im Vollbild und läuft nach dem ersten Besuch auch offline. Mit Internet lädt sie immer die neueste Version.

## Entwicklung

Voraussetzung: Node.js 20.19+ oder 22.13+.

```bash
npm ci
npm run dev        # Dev-Server mit Hot Reload
npm run dev -- --host  # zusätzlich im WLAN erreichbar, z. B. zum Testen auf dem Handy
npm run check      # lint, typecheck, Unit-Tests und build
npm test           # Unit-Tests (Vitest)
npm run test:e2e   # Browser-Tests (Playwright), spielen das Spiel in Chromium
npm run typecheck  # svelte-check (TypeScript und Svelte)
npm run lint       # ESLint und Prettier prüfen
npm run format     # mit Prettier formatieren
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
```

Die Browser-Tests in `e2e/` brauchen einmalig ein Chromium: `npx playwright install chromium`. Sie bauen das Spiel
dafür mit `npm run build:e2e` und spielen es wie ein Mensch: Menü, Tutorial, Level, Game Over, Settings und Stats. Die
CI führt sie zusätzlich zu `npm run check` aus und veröffentlicht nur, wenn beides grün ist. Im Test-Build und auf dem
Dev-Server legt `?seed=42` in der Adresse den Zufall fest, so lässt sich ein Spiel genau wiederholen.

Das Spiel ist mit Svelte 5 und TypeScript gebaut (`src/`). Abhängigkeiten laufen nur in eine Richtung, von `ui` über
`app` zu `core`; ESLint prüft das. Über Ordnergrenzen hinweg beginnen Imports mit `@/`, z. B. `@/core/game.ts`.

- `src/core/` – reine Spiellogik ohne DOM und ohne Speicherzugriff: Zustandsautomat (`game.ts`), Aufgaben, Modifier,
  Farben, Highscore, Einstellungen, Awards (`awards.ts`), Stats (`stats.ts`), Tutorial (`tutorial.ts`),
  Modifier-Karten (`intros.ts`), Progression (`progression.ts`: Einführungsreihenfolge, Auswahl pro Level, Surges,
  Zeitlimit) und der Spielstand (`save.ts`). Alle Übergänge sind Funktionen `(Zustand, Eingabe, Zeit, Zufall) → neuer
Zustand` und damit direkt testbar.
- `src/platform/` – die Anbindung an den Browser: Speichern (`storage.ts`), Sound über die Web Audio API (`sound.ts`;
  `synth.ts` beschreibt, wie jeder Sound erzeugt wird), Schriften (`fonts.ts`; die 28 Schriften für Font Flip lädt
  das Spiel nach dem Start im Hintergrund) und das Installieren als App.
- `src/app/` – Spielablauf ohne Darstellung: Navigation mit den Pfeiltasten, Warteschlange der Award-Meldungen.
- `src/ui/` – Svelte-Komponenten: `screens/` (ein Screen pro Datei), `hud/` (Level, Timer und Hinweise über dem
  Spiel) und `word/` (das Wort mit seinen Modifiern). Modifier werden per CSS (Transform, Filter) dargestellt;
  Bewegung, Zittern, Pulsieren, Mischen, Einfliegen, Schriftwechsel und Negativ berechnet `word/effects.ts` aus der
  Zeit seit Levelbeginn.
- `src/App.svelte` – verbindet alles: Spielschleife (`requestAnimationFrame`), Tastatur und Touch, Pause beim
  Verlassen des Tabs, Speichern des Spielstands, Sounds zu Spielereignissen.
- `public/` – wird unverändert mitgeliefert: Web-App-Manifest, Icons und der Service Worker `sw.js` für den
  Offline-Betrieb. Der Service Worker läuft nur im Produktions-Build, zum Testen also `npm run build` und
  `npm run preview`. Die PNG-Icons und `favicon.ico` sind aus `favicon.svg` gerendert und müssen bei Änderungen neu
  exportiert werden.

## Deployment

Bei jedem Push auf `main` baut der Workflow `.github/workflows/deploy.yml` das Spiel und veröffentlicht `dist/`
auf GitHub Pages. Dafür muss unter **Settings → Pages → Build and deployment → Source** einmalig
**GitHub Actions** ausgewählt sein.
