/* ---------- Geschichte: Figuren, Szenen, Ereignisse (nur Daten) ---------- */
/* Folgen (fx): r Rohstoffe (+/-), food Nahrung aus dem Vorrat, f Gunst {bjorn,sigrid}, joy [Wert, Minuten, Text] zeitweise Zufriedenheit,
   pop Einwohner, raid Sekunden bis zum nächsten Überfall, wound [Figur, Minuten], stop [Gebäude, Minuten] steht still, pct Anteil vom Bestand, sell Überschuss verkaufen */
const FIGS={
  ragna:{n:'Ragna',r:'Anführerin der Sippe'}, bjorn:{n:'Björn',r:'Krieger, will Ruhm'}, sigrid:{n:'Sigrid',r:'Bäuerin, will Frieden'},
  haendler:{n:'Ottar',r:'Händler aus dem Süden'}, hrafn:{n:'Jarl Hrafn',r:'Herr der Plünderer'}, bote:{n:'Hrafns Bote',r:'Spricht für den Rabenjarl'},
  jarl:{n:'Der alte Jarl',r:'Kennt die Berge'}, dorf:{n:'Leute vom Dorf',r:'Nordhof'}, skalde:{n:'Ulf',r:'Skalde'}
};
/* Gunst: ab GUNST.hi gibt es Boni, ab GUNST.lo murrt die Figur */
const GUNST={min:-10,max:10,hi:5,lo:-4,atk:2,price:1.2,murr:-4};
const SCN={
  /* Kapitel: ersetzen die alten Kapitelkarten, Text aus CHAPTER als Grundlage */
  ch1:{kap:1,saga:'landete Ragna mit der Sippe an einer fremden Küste',lines:[
    ['ragna','Der Sturm hat uns an eine fremde Küste geworfen. Ein Hof, eine Hütte, ein Beil. Mehr ist uns nicht geblieben.'],
    ['bjorn','Ein Beil reicht. Gib mir einen Tag, und hier steht eine Palisade.'],
    ['sigrid','Palisaden kann man nicht essen. Im Wasser stehen Fische, und hinter dem Strand liegt Wiese für Felder.'],
    ['ragna','Hinter den Wäldern liegt mehr, als man vom Strand aus sieht. Aber womit fangen wir an?']],
    ch:[{t:'Holz schlagen',fx:{r:{holz:20},f:{bjorn:1}},re:['bjorn','Ein guter Anfang. Holz hält, was es verspricht.'],saga:'ließ Ragna zuerst Holz schlagen, wie Björn es wollte'},
        {t:'Netze auswerfen',fx:{r:{fisch:20},f:{sigrid:1}},re:['sigrid','Wer satt ist, baut schneller. Du wirst sehen.'],saga:'warf die Sippe zuerst die Netze aus, wie Sigrid es riet'}],def:1},
  ch2:{kap:2,lines:[
    ['haendler','Ottar heiße ich. Ich tausche Salz gegen Holz und Eisen gegen Fisch. Mein Schiff liegt in eurer Bucht.'],
    ['bote','Ich spreche für Jarl Hrafn. Diese Inseln gehören ihm. Dreißig Münzen Tribut, oder seine Männer holen sich mehr.'],
    ['bjorn','Schick ihn zurück ins Meer, Ragna. Wer einmal zahlt, zahlt für immer.'],
    ['sigrid','Ein Hof brennt schneller, als er gebaut ist. Zahl, und wir gewinnen Zeit.']],
    ch:[{t:'Tribut zahlen',fx:{r:{muenzen:-30},raid:360,f:{sigrid:1,bjorn:-1}},re:['bote','Der Jarl wird zufrieden sein. Fürs Erste.'],saga:'zahlte Ragna dem Boten Hrafns dreißig Münzen Tribut'},
        {t:'Den Boten abweisen',fx:{f:{bjorn:1,sigrid:-1}},re:['bote','Dann sehen wir uns bald wieder. Mit Feuer.'],saga:'wies Ragna den Boten Hrafns ab'}],def:1},
  ch3:{kap:3,lines:[
    ['bjorn','Die Sippe wächst, und mit ihr der Mut. Ich will die Langschiffe ausrüsten und jenseits des Meeres nach Beute suchen.'],
    ['sigrid','Und wer erntet, während ihr fort seid? Im Osten summt das Heideland vor Bienen.'],
    ['ragna','Beides hat seinen Platz. Björn, was brauchst du?'],
    ['bjorn','Proviant für die Fahrt. Und dein Vertrauen.']],
    ch:[{t:'Langschiffe ausrüsten',fx:{r:{bretter:-20,proviant:4},f:{bjorn:2}},re:['bjorn','Die Ruder sind bereit. Die Welt soll von Nordhof hören!'],saga:'rüstete Ragna Björns Langschiffe aus'},
        {t:'Erst das Dorf',fx:{r:{weizen:30},f:{sigrid:1,bjorn:-1}},re:['sigrid','Volle Speicher sind auch eine Art Beute.'],saga:'blieben die Langschiffe im Hafen, und die Felder gingen vor'}],def:1},
  ch4:{kap:4,lines:[
    ['sigrid','Im Westen liegt nasses Marschland. Lehm, Flachs und Weiden für Kühe. Wer Ziegel brennt, baut für Generationen.'],
    ['ragna','Heute früh lag ein toter Rabe am Tor. In ihm steckte ein Brandpfeil.'],
    ['bote','Hrafn lässt ausrichten: Je höher eure Mauern, desto heller brennen sie.'],
    ['bjorn','Soll er kommen. Wir lachen über seine Raben.']],
    ch:[{t:'Mit Spott antworten',fx:{f:{bjorn:1},joy:[6,8,'Stolz der Sippe']},re:['bjorn','Hört ihr, wie das Dorf lacht? Das hört Hrafn bis übers Meer.'],saga:'schickte Ragna Hrafns Raben mit Spott zurück'},
        {t:'Schweigen und bauen',fx:{r:{stein:30},f:{sigrid:1}},re:['sigrid','Stein redet nicht. Er hält.'],saga:'schwieg Ragna zu Hrafns Drohung und ließ Stein brechen'}],def:1},
  ch5:{kap:5,lines:[
    ['jarl','In den Gipfeln liegt Erz, Kind. Mein Vater hat es geschürft, bevor Hrafns Vater ihn vertrieb.'],
    ['bjorn','Eisen heißt Äxte. Mit Äxten halten wir Hrafn auf.'],
    ['sigrid','Eisen heißt Pflüge und Werkzeug. Damit bauen wir Häuser aus Stein.']],
    ch:[{t:'Waffen schmieden',fx:{r:{waffe:3},f:{bjorn:1}},re:['jarl','Gute Klingen. Mein Vater hätte gelächelt.'],saga:'ließ Ragna aus dem ersten Bergeisen Waffen schmieden'},
        {t:'Werkzeug schmieden',fx:{r:{werkzeug:3},f:{sigrid:1}},re:['jarl','Kluge Wahl. Wer baut, bleibt.'],saga:'wurde aus dem ersten Bergeisen Werkzeug für die Sippe'}],def:1},
  ch6:{kap:6,lines:[
    ['dorf','Das Dorf ist eine Stadt geworden. Wir wollen einen Ort für unsere Götter und feine Kleider für die Feste.'],
    ['bote','Hrafn hält drei eurer Fischer gefangen. Dreihundert Münzen, dann sind sie bei Mondwechsel zurück.'],
    ['sigrid','Zahl. Silber kann man wieder verdienen, Menschen nicht.'],
    ['bjorn','Gib mir ein Boot und eine Nacht. Ich hole sie selbst.']],
    ch:[{t:'Lösegeld zahlen',fx:{r:{muenzen:-300},f:{sigrid:1}},re:['sigrid','Sie sind frei und wieder bei ihren Familien. Das war es wert.'],saga:'kaufte Ragna drei Fischer aus Hrafns Gewalt frei'},
        {t:'Björn schicken',fx:{wound:['bjorn',15],f:{bjorn:2,sigrid:-1},joy:[5,8,'Björns Heldentat']},re:['bjorn','Drei Fischer, zurück im Netz. Und eine Narbe mehr für mich.'],saga:'holte Björn drei Fischer aus Hrafns Lager zurück und kam verwundet heim'}],def:1},
  ch7:{kap:7,lines:[
    ['haendler','Mit Segeln aus eigenem Leinen erreicht ihr die Dünenküste. Dort spült das Meer Bernstein an, das Gold des Nordens.'],
    ['hrafn','Ragna. Du baust gut, das muss man dir lassen. Bald hole ich mir alles selbst.'],
    ['ragna','Dann komm, Hrafn. Wir werden bereit sein.']],
    ch:[{t:'Krieger sammeln',fx:{r:{ruestung:2},f:{bjorn:1}},re:['bjorn','Jeder, der eine Axt halten kann, steht bereit.'],saga:'sammelte Ragna Krieger gegen Hrafns Ankunft'},
        {t:'Bund mit den Händlern',fx:{r:{muenzen:-100,bernstein:2},f:{sigrid:1}},re:['haendler','Ein Bund mit Nordhof. Darauf trinke ich.'],saga:'schloss Ragna einen Bund mit den Händlern der Bernsteinküste'}],def:0},
  ch8:{kap:8,hrafn:1,lines:[
    ['ragna','Nordhof ist das Herz der Inseln. Händler, Krieger und Skalden kommen von weit her.'],
    ['bjorn','Schwarze Segel am Horizont! Das ist Hrafns Drachenschiff.'],
    ['hrafn','Heute endet deine Saga, Ragna. Oder meine.'],
    ['sigrid','Alle an die Mauern. Besetzt die Türme!']],end:'Zur Wehr',go:'wehr',saga2:'segelte Jarl Hrafn selbst gegen Nordhof'},
  /* Hrafns Angriff im letzten Kapitel */
  hrafnWin:{t:'Der Rabe fällt',lines:[
    ['ragna','Hrafn ist gefallen. Sein Drachenschiff treibt leer in der Bucht.'],
    ['bjorn','Das singen die Skalden noch in hundert Jahren!'],
    ['sigrid','Und jetzt: Frieden. Endlich Frieden.']],fx:{r:{silber:5,rune:2,muenzen:500},joy:[15,30,'Sieg über Hrafn']},saga:'besiegte die Sippe Jarl Hrafn vor den Mauern von Nordhof'},
  hrafnLose:{t:'Hrafn plündert',rep:1,lines:[
    ['hrafn','Eure Vorräte gehören jetzt mir. Ich komme wieder, Ragna, bis nichts mehr steht.'],
    ['ragna','Wir bauen neu. Beim nächsten Mal sind die Türme stärker.']],fx:{raid:-300},saga:'plünderte Hrafn Nordhof und segelte davon, doch Ragna gab nicht auf'},
  /* Wegmarken */
  haus1:{t:'Ein neues Dach',lines:[
    ['sigrid','Ein neues Dach über neuen Köpfen. So fängt ein Dorf an.'],
    ['ragna','Wo Herdfeuer brennen, kommen Menschen. Baut weiter.']],fx:{f:{sigrid:1}},saga:'wurde das erste neue Haus auf der Insel gebaut'},
  raid1w:{t:'Die ersten Plünderer',lines:[
    ['bjorn','Sie rennen zu ihren Booten! Habt ihr gesehen, wie sie rennen?'],
    ['ragna','Das war nur Hrafns Vorhut. Er wird mehr schicken.']],
    ch:[{t:'Den Sieg feiern',fx:{food:-15,joy:[8,6,'Siegesfeier'],f:{bjorn:1}},re:['bjorn','Auf Nordhof! Und auf jeden, der es verteidigt!'],saga:'feierte die Sippe ihren ersten Sieg über Hrafns Plünderer'},
        {t:'Wachen verstärken',fx:{r:{holz:-20},raid:120,f:{sigrid:1}},re:['sigrid','Klug. Wer wacht, schläft ruhiger.'],saga:'verstärkte Ragna nach dem ersten Sieg die Wachen'}],def:1},
  raid1l:{t:'Die ersten Plünderer',lines:[
    ['sigrid','Sie haben die Speicher geleert. Die Kinder weinen.'],
    ['bjorn','Das zahlen wir Hrafn heim. Zehnfach.']],
    ch:[{t:'Rache schwören',fx:{f:{bjorn:1},joy:[4,6,'Rachedurst']},re:['bjorn','Bei Odins Auge: Er wird es bereuen.'],saga:'schwor Björn Rache für den ersten Überfall'},
        {t:'Gemeinsam aufbauen',fx:{r:{holz:15},joy:[4,6,'Zusammenhalt'],f:{sigrid:1}},re:['sigrid','Jede Hand hilft. Morgen steht alles wieder.'],saga:'baute die Sippe nach dem ersten Überfall gemeinsam auf'}],def:1},
  run1ok:{t:'Heimkehr',lines:[
    ['bjorn','Die Schiffe sind zurück, schwer von Beute!'],
    ['sigrid','Und alle Ruderer leben. Das zählt mehr als Silber.']],fx:{f:{bjorn:1}},saga:'kehrte der erste Raubzug mit Beute heim'},
  run1bad:{t:'Heimkehr',lines:[
    ['bjorn','Die See war gegen uns. Wir kommen mit leeren Händen.'],
    ['ragna','Ihr lebt. Das reicht diesmal. Das nächste Mal seid ihr klüger.']],fx:{f:{bjorn:-1}},saga:'scheiterte der erste Raubzug über das Meer'},
  lagervoll:{t:'Volle Speicher',lines:[
    ['sigrid','Die Speicher sind voll bis unters Dach. Was nicht mehr hineinpasst, verdirbt.'],
    ['haendler','Ich nehme euch gern etwas ab. Zum fairen Preis, versteht sich.']],
    ch:[{t:'An Ottar verkaufen',fx:{sell:25,f:{sigrid:1}},re:['haendler','Ein gutes Geschäft für beide.'],saga:'verkaufte Ragna den Überschuss ihrer Speicher an Ottar'},
        {t:'Ein Lagerhaus bauen',fx:{},re:['ragna','Wir bauen ein Lagerhaus. Dann passt mehr hinein.'],saga:'beschloss Ragna, ein größeres Lager zu bauen'}],def:1},
  pop10:{t:'Zehn Herdfeuer',lines:[
    ['ragna','Zehn Menschen leben jetzt auf der Insel.'],
    ['dorf','Wir haben gehört, hier gibt es Arbeit und Schutz.']],fx:{joy:[4,5,'Neue Nachbarn']},saga:'lebten zehn Menschen auf der Insel'},
  pop20:{t:'Das erste Thing',lines:[
    ['dorf','Zwanzig sind wir! Wir wollen ein Thing, eine Versammlung, wie in der alten Heimat.'],
    ['bjorn','Am Thing spreche ich für die Krieger.'],
    ['sigrid','Und ich für die Bauern. Wer soll beginnen, Ragna?']],
    ch:[{t:'Björn spricht',fx:{f:{bjorn:2,sigrid:-1}},re:['bjorn','Ruhm für Nordhof! Und Beute für jeden, der rudert!'],saga:'hielt die Sippe ihr erstes Thing, und Björn sprach für alle'},
        {t:'Sigrid spricht',fx:{f:{sigrid:2,bjorn:-1}},re:['sigrid','Felder, Handel und Frieden. Dann wird Nordhof alt.'],saga:'hielt die Sippe ihr erstes Thing, und Sigrid sprach für alle'}],def:1},
  pop40:{t:'Vierzig Seelen',lines:[
    ['ragna','Vierzig Menschen. Als wir landeten, waren wir vier.'],
    ['skalde','Das wird ein Lied. Darf ich es in der Halle singen?']],
    ch:[{t:'Lied bestellen',fx:{r:{muenzen:-60},joy:[10,10,'Lied der Landung']},re:['skalde','Hört, wie der Sturm die Sippe an Land warf ...'],saga:'sang der Skalde Ulf zum ersten Mal das Lied von Nordhof'},
        {t:'Später',fx:{},re:['skalde','Ich warte. Gute Lieder reifen.'],saga:'zählte Nordhof vierzig Seelen'}],def:1},
  winter1:{t:'Der erste Winter',lines:[
    ['ragna','Der erste Winter. Der Fjord friert zu, und die Tage werden kurz.'],
    ['sigrid','Wenn wir die Vorräte teilen, kommt jeder durch.'],
    ['bjorn','Oder wir zählen genau und halten durch.']],
    ch:[{t:'Vorräte teilen',fx:{food:-20,joy:[8,10,'Geteiltes Brot'],f:{sigrid:1}},re:['sigrid','Niemand friert allein.'],saga:'teilte die Sippe im ersten Winter ihre Vorräte'},
        {t:'Streng einteilen',fx:{joy:[-3,10,'Knappe Rationen'],f:{bjorn:1}},re:['bjorn','Hart, aber klug. So überlebt man.'],saga:'teilte Ragna im ersten Winter die Vorräte streng ein'}],def:1},
  /* Gunst */
  bjornHi:{t:'Björns Gefolge',lines:[
    ['bjorn','Ragna, du hast zu mir gehalten. Meine Männer folgen dir jetzt überallhin.']],perk:'Björns Gefolge: +'+GUNST.atk+' Angriff für jeden Krieger auf Raubzügen',saga:'schwor Björns Gefolge Ragna die Treue'},
  sigridHi:{t:'Sigrids Handel',lines:[
    ['sigrid','Die Händler kennen meinen Namen. Sie zahlen uns jetzt mehr für unsere Waren.']],perk:'Sigrids Handel: +20 % beim Verkauf im Hafen',saga:'kannten die Händler des Nordens Sigrids Namen'},
  bjornLo:{t:'Björn murrt',lines:[
    ['bjorn','Immer hörst du auf Sigrid. Die Krieger murren, Ragna.']],perk:'Solange Björn murrt: '+GUNST.murr+' Zufriedenheit',saga:'murrten die Krieger um Björn'},
  sigridLo:{t:'Sigrid murrt',lines:[
    ['sigrid','Du hörst mich nicht mehr, Ragna. Die Bauern murren.']],perk:'Solange Sigrid murrt: '+GUNST.murr+' Zufriedenheit',saga:'murrten die Bauern um Sigrid'}
};
/* Ereignisse: c Bedingung, p Wer ruft, none Folge ohne Antwort nach EVWAIT Sekunden */
const EVWAIT=120, EVGAP=[240,480];
const OFFERS=[['werkzeug',3,90],['eisen',8,80],['ziegel',15,70],['met',6,50],['bretter',25,60],['proviant',6,45]];
const EVENTS=[
  {id:'sturm',t:'Sturm über der Bucht',p:'dorf',ic:'sturm',c:()=>countType('steg')>0,lines:[['dorf','Der Sturm heute Nacht hat den Fischersteg zerschlagen. Die Planken treiben im Wasser.']],
    ch:[{t:'Gleich reparieren',fx:{r:{holz:-20}},saga:'wurde der sturmzerschlagene Steg sofort wieder aufgebaut'},{t:'Nach dem Sturm',fx:{stop:['steg',4]},saga:'lag der Fischersteg nach einem Sturm still'}],
    none:{fx:{stop:['steg',4]},saga:'lag der Fischersteg nach einem Sturm still'}},
  {id:'wolf',t:'Wolf im Wald',p:'dorf',ic:'wald',c:()=>countType('holzfaeller')>0,lines:[['dorf','Ein Wolf schleicht um den Holzfäller. Keiner traut sich mehr in den Wald.'],['bjorn','Ein Wolf? Gib mir einen Speer.']],
    ch:[{t:'Björn jagt ihn',fx:{r:{fell:2},f:{bjorn:1}},saga:'erlegte Björn einen Wolf, der die Holzfäller bedrohte'},{t:'Feuer am Waldrand',fx:{r:{holz:-10},f:{sigrid:1}},saga:'hielten Feuer am Waldrand einen Wolf fern'}],
    none:{fx:{stop:['holzfaeller',3]},saga:'mieden die Holzfäller den Wald, weil ein Wolf umging'}},
  {id:'kuh',t:'Kranke Kuh',p:'dorf',ic:'milch',c:()=>countType('kuhweide')>0,lines:[['dorf','Die beste Kuh frisst nicht mehr und steht nur noch da.'],['sigrid','Die Kräuterfrau im Moor weiß Rat. Aber sie will bezahlt werden.']],
    ch:[{t:'Kräuterfrau holen',fx:{r:{muenzen:-40},f:{sigrid:1}},saga:'heilte eine Kräuterfrau die beste Kuh der Sippe'},{t:'Notschlachten',fx:{r:{fell:2},joy:[-3,5,'Verlorene Kuh']},saga:'musste die Sippe ihre beste Kuh schlachten'}],
    none:{fx:{r:{milch:-15}},saga:'gab die kranke Kuh lange keine Milch'}},
  {id:'haendler',t:'Sonderangebot',p:'haendler',ic:'waage',c:()=>hofL()>=2,prep:()=>{const o=OFFERS.filter(x=>KNOWN.has(x[0]));const x=pick(o.length?o:OFFERS);return{k:x[0],a:x[1],c:x[2]};},
    lines:[['haendler',p=>'Ein Händler aus dem Süden segelt mit mir. Er hat '+p.a+' '+RES[p.k].n+' an Bord, feinste Ware. Nur heute, nur für euch.']],
    ch:[{t:p=>'Kaufen',fx:p=>({r:{muenzen:-p.c,[p.k]:p.a}}),saga:'kaufte Ragna einem Händler aus dem Süden seine Ware ab'},{t:'Ablehnen',fx:{},saga:'zog ein Händler aus dem Süden unverrichteter Dinge weiter'}],
    none:{fx:{},saga:'zog ein Händler aus dem Süden unverrichteter Dinge weiter'}},
  {id:'skalde',t:'Ein Skalde',p:'skalde',ic:'met',c:()=>S.pop.n>=6,lines:[['skalde','Ich bin Ulf, Skalde aus dem Norden. Für ein Mahl und ein paar Münzen singe ich euch von euren Taten.']],
    ch:[{t:'Auftreten lassen',fx:{r:{muenzen:-30},joy:[8,8,'Lied des Skalden']},saga:'sang der Skalde Ulf in der Halle von Nordhof'},{t:'Nur ein Mahl geben',fx:{food:-10,joy:[3,5,'Ein kurzes Lied']},saga:'bekam ein Skalde ein Mahl und sang ein kurzes Lied'}],
    none:{fx:{},saga:'zog der Skalde Ulf ungehört weiter'}},
  {id:'streit',t:'Streit am Herdfeuer',p:'bjorn',ic:'feuer',c:()=>(S.chap||0)>=2,lines:[['bjorn','Die Männer sollen rudern, nicht Rüben ziehen!'],['sigrid','Und wovon leben deine Ruderer im Winter? Von Ruhm?'],['ragna','Genug. Ich entscheide.']],
    ch:[{t:'Björn hat recht',fx:{f:{bjorn:2,sigrid:-2}},saga:'gab Ragna im Streit am Herdfeuer Björn recht'},{t:'Sigrid hat recht',fx:{f:{sigrid:2,bjorn:-2}},saga:'gab Ragna im Streit am Herdfeuer Sigrid recht'}],
    none:{fx:{f:{bjorn:-1,sigrid:-1}},saga:'blieb der Streit zwischen Björn und Sigrid ungeschlichtet'}},
  {id:'moor',t:'Fund im Moor',p:'dorf',ic:'moor',c:()=>S.open.includes(REGI.moor),lines:[['dorf','Beim Torfstechen ist etwas im Moor aufgetaucht. Ein alter Kessel, und er glänzt.'],['ragna','Moorfunde gehören den Göttern, sagen die Alten.']],
    ch:[{t:'Ausgraben',fx:{r:{silber:2,bernstein:1},f:{bjorn:1}},saga:'hob die Sippe einen Silberkessel aus dem Moor'},{t:'Den Göttern lassen',fx:{joy:[6,10,'Gunst der Götter']},saga:'ließ Ragna einen Moorfund den Göttern'}],
    none:{fx:{joy:[6,10,'Gunst der Götter']},saga:'versank ein Kessel wieder im Moor'}},
  {id:'schiffbruch',t:'Schiffbrüchige',p:'dorf',ic:'schiff',c:()=>D.house-S.pop.n>=3,lines:[['dorf','Am Strand liegen Schiffbrüchige, halb erfroren. Eine Familie, drei Leute.'],['sigrid','Gebt ihnen zu essen. Sie können arbeiten.']],
    ch:[{t:'Aufnehmen',fx:{food:-20,pop:3,f:{sigrid:1}},saga:'nahm Ragna drei Schiffbrüchige in die Sippe auf'},{t:'Versorgen, weiterschicken',fx:{food:-5},saga:'gab die Sippe Schiffbrüchigen Brot und schickte sie weiter'}],
    none:{fx:{},saga:'zogen Schiffbrüchige an der Insel vorüber'}},
  {id:'ernte',t:'Reiche Ernte',p:'sigrid',ic:'weizen',c:()=>countType('feld')>0,lines:[['sigrid','Die Ähren sind schwer wie nie. Das reicht für ein Fest oder für den Winter.']],
    ch:[{t:'Erntefest',fx:{r:{weizen:-15},joy:[8,8,'Erntefest'],f:{sigrid:1}},saga:'feierte die Sippe ein großes Erntefest'},{t:'Einlagern',fx:{r:{weizen:25}},saga:'wurde eine reiche Ernte eingelagert'}],
    none:{fx:{r:{weizen:10}},saga:'brachte die Sippe eine reiche Ernte ein'}},
  {id:'rune',t:'Ein alter Runenstein',p:'dorf',ic:'rune',c:()=>hofL()>=3,lines:[['dorf','Die Kinder haben am Bach einen Stein mit Runen gefunden. Niemand kann sie lesen.']],
    ch:[{t:'Am Hof aufstellen',fx:{joy:[6,12,'Runenstein am Hof']},saga:'stellte Ragna einen alten Runenstein am Hof auf'},{t:'An Ottar verkaufen',fx:{r:{muenzen:60},f:{sigrid:1}},saga:'verkaufte die Sippe einen alten Runenstein'}],
    none:{fx:{},saga:'versank ein Runenstein wieder im Bach'}},
  {id:'spaeher',t:'Hrafns Späher',p:'bjorn',ic:'schiff',c:()=>hofL()>=2&&S.raid.next&&!S.raid.pending,lines:[['bjorn','Ein schwarzes Boot kreuzt vor der Küste. Hrafns Späher! Lass mich ihn jagen.']],
    ch:[{t:'Björn jagt ihn',fx:{raid:240,f:{bjorn:1}},saga:'jagte Björn Hrafns Späher von der Küste'},{t:'Türme besetzen',fx:{r:{holz:-20},raid:120},saga:'wurden die Türme gegen Hrafns Späher besetzt'}],
    none:{fx:{raid:-120},saga:'entkam Hrafns Späher, und die Plünderer kamen früher'}},
  {id:'bienen',t:'Bienenschwarm',p:'dorf',ic:'honig',c:()=>countType('imkerei')>0||S.open.includes(REGI.heide),lines:[['dorf','Ein wilder Bienenschwarm hängt in der Esche beim Hof.']],
    ch:[{t:'Einfangen',fx:{r:{honig:10}},saga:'fing die Sippe einen wilden Bienenschwarm ein'},{t:'In Ruhe lassen',fx:{joy:[3,6,'Summende Esche']},saga:'summte ein Bienenschwarm in der Esche beim Hof'}],
    none:{fx:{joy:[3,6,'Summende Esche']},saga:'summte ein Bienenschwarm in der Esche beim Hof'}},
  {id:'brand',t:'Feuer in der Werkstatt',p:'dorf',ic:'feuer',c:()=>countType('saegewerk')+countType('koehlerei')>0,lines:[['dorf','Funken aus dem Ofen! Das Bretterlager brennt!']],
    ch:[{t:'Eimerkette bilden',fx:{joy:[-3,5,'Rußige Gesichter'],f:{sigrid:1}},saga:'löschte eine Eimerkette einen Brand in der Werkstatt'},{t:'Brennendes einreißen',fx:{r:{bretter:-10},f:{bjorn:1}},saga:'rissen Björns Männer eine brennende Werkstattwand ein'}],
    none:{fx:{pct:{bretter:-.3}},saga:'verbrannte ein Teil der Bretter in der Werkstatt'}},
  {id:'hochzeit',t:'Hochzeit',p:'dorf',ic:'herz',c:()=>S.pop.n>=10,lines:[['dorf','Thora und Leif wollen heiraten. Das ganze Dorf hofft auf ein Fest.']],
    ch:[{t:'Großes Fest',fx:{r:{muenzen:-60},joy:[10,10,'Hochzeitsfest'],pop:1},saga:'feierte Nordhof die Hochzeit von Thora und Leif'},{t:'Kleines Fest',fx:{food:-10,joy:[4,6,'Hochzeit']},saga:'heirateten Thora und Leif im kleinen Kreis'}],
    none:{fx:{joy:[2,5,'Stille Hochzeit']},saga:'heirateten Thora und Leif im Stillen'}},
  {id:'ratten',t:'Ratten im Lager',p:'sigrid',ic:'lager',c:()=>countType('lager')>0,lines:[['sigrid','Ratten im Lagerhaus! Sie fressen sich durch das Korn.'],['haendler','Ich hätte zwei Katzen an Bord. Nicht billig.']],
    ch:[{t:'Katzen kaufen',fx:{r:{muenzen:-40},f:{sigrid:1}},saga:'zogen zwei Katzen vom Händlerschiff ins Lagerhaus'},{t:'Selbst jagen',fx:{pct:{weizen:-.1,brot:-.1},f:{bjorn:1}},saga:'jagte Björn die Ratten aus dem Lagerhaus'}],
    none:{fx:{pct:{weizen:-.25,brot:-.25,fisch:-.15}},saga:'fraßen Ratten einen Teil der Vorräte'}},
  {id:'wal',t:'Gestrandeter Wal',p:'dorf',ic:'fisch',c:()=>true,lines:[['dorf','Ein Wal ist am Strand gestrandet! Fleisch und Tran für Wochen.'],['ragna','Die Alten sagen, ein Wal ist ein Geschenk des Meeres.']],
    ch:[{t:'Zerlegen',fx:{r:{fisch:30},f:{sigrid:1}},saga:'zerlegte die Sippe einen gestrandeten Wal'},{t:'Dem Meer zurückgeben',fx:{joy:[6,8,'Gabe an das Meer']},saga:'gab Ragna einen gestrandeten Wal dem Meer zurück'}],
    none:{fx:{r:{fisch:10}},saga:'holte die Flut einen gestrandeten Wal zurück'}}
];
/* Bild für die Saga-Zeile einer Szene */
const SCIC={ch2:'rabe',ch4:'rabe',ch6:'rabe',ch7:'rabe',haus1:'haus',raid1w:'schild',raid1l:'abriss',run1ok:'schiff',run1bad:'schiff',lagervoll:'lager',pop10:'leute',pop20:'leute',pop40:'leute',
  winter1:'sturm',bjornHi:'schwert',sigridHi:'waage',bjornLo:'sauer',sigridLo:'sauer',hrafnWin:'krone',hrafnLose:'rabe'};
