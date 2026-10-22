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

## So läuft das Spiel (0.7)

Version 0.7 ist für den Desktop gebaut, das Handy läuft mit. Der Spielstand aus 0.6 passt nicht auf die neue Karte und bleibt unangetastet gespeichert.

- **Karte:** 96 × 96 Felder statt 29 × 29. In der Mitte das Heimatland, drumherum Nordwald, Heide, Marsch, Bergland und Dünenküste mit Flüssen und Seen. Weit herausgezoomt zeigt eine Übersicht die ganze Insel, unten rechts liegt die Minikarte.
- **Steuerung:** Linke oder rechte Maustaste ziehen verschiebt, Mausrad zoomt zum Zeiger, WASD und Pfeile schieben. B Bauleiste, P Pfad, R Drehen, H Hof, Leertaste Pause (dann steht alles still), 1 bis 4 Tempo (auch die Leute laufen schneller), U Ausbau, X Abriss, Esc bricht ab.
- **Bauen:** Unten ein Gebäude wählen, ein Geist zeigt, wo es passt (grün) oder warum nicht (rot). Klick baut, Shift baut mehrere. Gebäude haben Grundflächen von 1 × 1 bis 3 × 3.
- **Wege:** Unter Bauen, Wege mit gedrückter Maustaste ziehen: Pfad (kostenlos), Schotterweg (ab Hofstufe 2), Pflasterstraße (ab Hofstufe 4), über schmales Wasser als Brücke. Jedes Gebäude braucht einen Weg zum Hof, sonst halbe Leistung (Wohnhäuser halber Platz, Dorfleben ohne Wirkung) und ein rotes Zeichen darüber. Beim Bauen dreht sich die Tür von selbst zum Weg und das Gebäude rastet bündig an, R dreht von Hand. Ältere Spielstände bekommen beim Laden Trampelpfade.
- **Logistik:** Betriebe legen ihre Ware vor die Tür, Träger bringen sie zum nächsten Lager (Hof oder Lagerhaus). Ladung je Gang: zu Fuß 5, mit Handkarren 10 (Stellmacher), mit Ochsenkarren 25 (Ochsenstall, nur wenn der Weg bis zum Lager Schotter oder Pflaster ist, Ochsen fressen Weizen). Ist der Vorrat voll, ruht der Betrieb. Ein Lagerhaus nah an den Betrieben und schnelle Wege machen den Unterschied.
- **Arbeitsfläche:** Holzfäller, Steinbruch, Fischer, Jäger, Imker und Weiden brauchen passenden Boden im Umkreis. Gleiche Betriebe teilen sich überlappende Felder. Werkstätten bekommen Bonus durch Zulieferer bis 6 Felder entfernt.
- **Hof:** Der Häuptlingshof ist das Rathaus. Jede der 8 Hofstufen schaltet Gebäude, Gebiete, Bereiche und ein Kapitel der Geschichte frei. Kein Gebäude steht höher als der Hof. Es geht los mit einem Minidorf, ohne Tutorial. Überfälle beginnen ab Hofstufe 2.
- **Oberfläche:** Oben Hofstufe mit Ziel, die Rohstoffe der aktuellen Stufe mit Lagergrenze und Rate pro Minute, Einwohner, Baumeister, Münzen, Überfall und Tempo. Links Leiste mit Insel, Dorf, Waren, Hafen, Wehr, Raubzug, Chronik und eine Tafel mit nächstem Ziel, Baumeistern und Engpässen. Rechts die Auswahl mit Betrieb, Ausbau und Lage.
- **Wirtschaft:** Holz → Bretter oder Holzkohle, Weizen → Brot, Erz + Kohle → Eisen, Lehm + Kohle → Ziegel, Wolle → Stoff, Flachs → Leinen → Segel, Honig → Met, Milch → Käse, Fell → Leder, Stoff + Leder → Kleidung, Eisen → Werkzeug, Waffen, Rüstung.
- **Dorf:** Wohnhäuser geben Platz, Einwohner arbeiten, essen Fisch, Brot oder Käse und zahlen Steuern. Laune macht alles schneller.
- **Überfälle:** laufen live auf der Insel. Plünderer landen an der Küste nahe am Dorf, Hof, Wachtürme und Bogenposten schießen in ihrer Reichweite.
- **Raubzug:** Bis zu 3 Krieger mit Proviant, Waffen und Rüstung, Beute sammeln und rechtzeitig heimfahren.
- **Offline:** Produktion und Bauaufträge laufen bis zu 8 Stunden weiter.

- **Gebäude:** Jede Art hat ihre eigene Form (Sägewerk mit Wasserrad, Schmiede mit offener Esse, Bäckerei mit Kuppelofen, Lagerhaus als Scheune und so weiter) und wächst mit den Stufen von Holz über Fachwerk und Stein zur Halle.

## Neu in 0.8

- **Ton** (`12-audio.js`): Umgebung je Biom, Arbeitsgeräusche, Ereignistöne und ruhige Musik, alles per WebAudio erzeugt. Regler im Menü.
- **Rückmeldung** (`12b-juice.js`): Hüpfen und Staub bei fertigen Bauten, Fest beim Hof-Aufstieg, Zeichen über ruhenden Betrieben mit dem Grund.
- **Jahreszeiten** (`03s-seasons.js`, `06c-weather.js`): Kalender, Felder wachsen sichtbar und werden im Herbst geerntet, Winter mit Vorratsziel, Schnee, Regen, Nebel.
- **Story** (`00s-story-data.js`, `08s-story.js`): Szenen mit Figuren und Wahl, Gunst von Björn und Sigrid, der Rivale Jarl Hrafn, 16 Ereignisse, Chronik als Saga.
- **Kampf** (`09-battle.js`, `09b-defense.js`): Plünderer landen an der Küste und laufen echte Wege, Palisaden und Tore, Verteidiger, Schäden mit Reparatur, Trophäen am Hof.

Der Stand vor 0.8 liegt im Zweig `stand-0.7.4`.

## Entwicklung

```
npm install          # baut www/ und synchronisiert ios/
npm run sync         # nach Änderungen in src/
open ios/App/App.xcodeproj
```

Zum schnellen Testen im Browser reicht `npm run build` und dann `www/index.html` öffnen.
