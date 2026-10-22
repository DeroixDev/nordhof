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

- **Insel:** Feld antippen, bauen. Lage zählt: Holzfäller neben Wald, Bäckerei neben Feldern, Schmiede neben Schmelze geben Bonus.
- **Gebiete:** Um das Heimatland liegen Nordwald, Heide, Moor, Gebirge und Dünen. Jedes wird mit Rohstoffen, Zeit und genug Einwohnern erkundet und hat eigene Funde und Gebäude: Jäger nur im Nordwald, Imker in der Heide, Lehm und Flachs im Moor, Erz und Silber im Gebirge, Bernstein an den Dünen.
- **Bauzeiten:** Bauen, Ausbauen und Erkunden dauert, von Sekunden bis Stunden. Jeder Auftrag braucht einen freien Baumeister. Am Anfang gibt es 2, jede Bauhütte bringt einen weiteren (höchstens 5). Mit Münzen geht es sofort.
- **Wirtschaft:** Holz → Bretter oder Holzkohle, Weizen → Brot, Erz + Kohle → Eisen, Lehm + Kohle → Ziegel, Wolle → Stoff, Flachs → Leinen → Segel, Honig → Met, Milch → Käse, Fell → Leder, Stoff + Leder → Kleidung, Eisen → Werkzeug, Waffen, Rüstung.
- **Ausbau:** Stufe 1 bis 8. Ab Stufe 3 braucht es Werkzeug, ab Stufe 5 Silber, ab Stufe 7 Runensteine.
- **Dorf:** Hütten, Langhäuser und Steinhäuser geben Wohnraum. Einwohner arbeiten in den Betrieben, essen Fisch, Brot oder Käse und zahlen Steuern. Brunnen, Markt, Methalle und Stabkirche heben die Laune. Der Reiter „Dorf“ zeigt Herstellung und Verbrauch je Rohstoff.
- **Info:** Das kleine i an jedem Gebäude, Rohstoff, Krieger und Ziel erklärt Kosten, Ketten und Werte.
- **Oberfläche:** Am Desktop oben Reiter, Einwohner, freie Baumeister, Münzen, nächster Überfall und Tempo; links laufende Bauaufträge und das Lager nach Gruppen mit Zu- und Abfluss; rechts die Auswahl. Am Handy oben die Kennzahlen, eine Reihe Rohstoffe und die Schublade „Lager“.
- **Tempo:** Anhalten oder 1×, 2×, 4×, 8×. Angehalten bleibt die Zeit auch bei geschlossener App stehen.
- **Überfälle:** laufen live auf der Insel. Plünderer landen, laufen auf die nächsten Gebäude zu, Hof, Wachtürme und Bogenposten schießen in ihrer Reichweite, die mit jeder Stufe wächst. Brandpfeile verdreifachen kurz den Schaden.
- **Menü:** Einstellungen (Tag und Nacht, Akku sparen, weniger Animationen, FPS), Spielstand als Text oder Datei sichern und wieder laden, Statistik, Anleitung und ein Entwicklermenü zum Ändern von Rohstoffen, Einwohnern, Stufen, Gebieten, Zeit und den Rohdaten.
- **Offline:** Produktion läuft bis zu 8 Stunden weiter, Bauaufträge werden auch offline fertig. Beim Öffnen kommt ein Bericht.
- **Wehr:** Alle 15 Minuten Plünderer. Palisaden, Wachtürme und Bogenposten halten sie auf.
- **Raubzug:** Bis zu 3 Krieger mit Proviant, Waffen und Rüstung. Nach einigen Schritten zieht ein Sturm auf und es wird gefährlicher. Nur am Schiff oder am Signalfeuer kommst du raus. Wer fällt, verliert, was er trägt; das Runenfach kommt immer heim.

## Entwicklung

```
npm install          # baut www/ und synchronisiert ios/
npm run sync         # nach Änderungen an src/game.html
open ios/App/App.xcodeproj
```

Zum schnellen Testen im Browser reicht `npm run build` und dann `www/index.html` öffnen.
