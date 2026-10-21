# Nordhof

Offline-Idle-Spiel fürs iPhone. Du baust eine kleine Insel im Nordmeer aus, verarbeitest Rohstoffe in Werkstätten, baust Gebäude aus, wehrst Plünderer ab und fährst auf Raubzüge im Stil eines Extraction-Looters: plündern, solange du dich traust, und lebend zurück zum Schiff.

Aufbau: Das Spiel ist eine einzige Datei (`src/game.html`, Vanilla JS mit Canvas). `scripts/build.mjs` macht daraus `www/index.html` mit lokalen Schriften, Capacitor packt das in eine iOS-App. Der Spielstand liegt auf dem iPhone, kein Konto, kein Server, kein Internet nötig.

## Einmalige Einrichtung am Mac

Xcode, Node.js und die Apple-ID in Xcode sind schon von WDID eingerichtet. Dann nur noch:

1. Terminal öffnen und eingeben:
   ```
   cd ~/Documents && git clone https://github.com/DeroixDev/Nordhof.git Nordhof.nosync
   ```
2. iPhone per Kabel anschließen und entsperren.
3. Im Finder `Dokumente/Nordhof.nosync` öffnen und **„Nordhof aktualisieren.command“ doppelklicken** (beim ersten Mal Rechtsklick → Öffnen).
4. Beim ersten Start auf dem iPhone: *Einstellungen → Allgemein → VPN & Geräteverwaltung →* deine Apple-ID → *Vertrauen*.

Mit kostenloser Apple-ID sind höchstens 3 selbst installierte Apps gleichzeitig möglich. Nordhof und WDID zählen beide mit.

## Jede Woche

Die Signatur läuft nach 7 Tagen ab. iPhone anschließen und „Nordhof aktualisieren.command“ doppelklicken. Der Spielstand bleibt erhalten.

## So läuft das Spiel

- **Insel:** Feld antippen, bauen. Lage zählt: Holzfäller neben Wald, Bäckerei neben Feldern, Schmiede neben Schmelze geben Bonus. Wildnis am Rand lässt sich erschließen.
- **Wirtschaft:** Holz → Bretter, Weizen → Brot, Brot + Fisch → Proviant, Erz + Holz → Eisen, Wolle → Stoff, Eisen → Werkzeug, Waffen, Rüstung.
- **Ausbau:** Stufe 1 bis 5. Ab Stufe 3 braucht es Werkzeug, ab Stufe 4 Silber.
- **Offline:** Produktion läuft bis zu 8 Stunden weiter, beim Öffnen kommt ein Bericht.
- **Wehr:** Alle 15 Minuten Plünderer. Palisaden, Wachtürme und Bogenposten halten sie auf.
- **Raubzug:** Bis zu 3 Krieger mit Proviant, Waffen und Rüstung. Nach einigen Schritten zieht ein Sturm auf und es wird gefährlicher. Nur am Schiff oder am Signalfeuer kommst du raus. Wer fällt, verliert, was er trägt; das Runenfach kommt immer heim.

## Entwicklung

```
npm install          # baut www/ und synchronisiert ios/
npm run sync         # nach Änderungen an src/game.html
open ios/App/App.xcodeproj
```

Zum schnellen Testen im Browser reicht `npm run build` und dann `www/index.html` öffnen.
