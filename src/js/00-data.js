const TW=64, TH=32, N=29, MID=14, SAVE='nordhof-save-v1', MAXLVL=8, TAU=Math.PI*2;

/* ---------- Daten ---------- */
const RES={
  holz:{n:'Holz',p:1,k:'roh'}, stein:{n:'Stein',p:1,k:'roh'}, lehm:{n:'Lehm',p:1,k:'roh'}, weizen:{n:'Weizen',p:1,k:'roh'}, fisch:{n:'Fisch',p:1,k:'roh',food:1},
  wolle:{n:'Wolle',p:2,k:'roh'}, flachs:{n:'Flachs',p:2,k:'roh'}, honig:{n:'Honig',p:2,k:'roh'}, milch:{n:'Milch',p:2,k:'roh'}, erz:{n:'Erz',p:2,k:'roh'}, fell:{n:'Fell',p:3,k:'roh'},
  bretter:{n:'Bretter',p:4,k:'ware'}, kohle:{n:'Holzkohle',p:4,k:'ware'}, ziegel:{n:'Ziegel',p:6,k:'ware'}, brot:{n:'Brot',p:6,k:'ware',food:1}, kaese:{n:'Käse',p:8,k:'ware',food:1},
  met:{n:'Met',p:10,k:'ware'}, leder:{n:'Leder',p:9,k:'ware'}, leinen:{n:'Leinen',p:8,k:'ware'}, stoff:{n:'Wollstoff',p:9,k:'ware'}, eisen:{n:'Eisen',p:12,k:'ware'}, proviant:{n:'Proviant',p:9,k:'ware'},
  kleidung:{n:'Kleidung',p:26,k:'ware'}, segel:{n:'Segel',p:30,k:'ware'},
  werkzeug:{n:'Werkzeug',p:28,k:'ausr'}, waffe:{n:'Waffe',p:45,k:'ausr'}, ruestung:{n:'Rüstung',p:55,k:'ausr'},
  bernstein:{n:'Bernstein',p:35,k:'beute'}, silber:{n:'Silber',p:45,k:'beute'}, rune:{n:'Runenstein',p:70,k:'beute'}, muenzen:{n:'Münzen',p:1,k:'geld'}
};
const FOOD=Object.keys(RES).filter(k=>RES[k].food);
const RECIPES={
  bretter:{in:{holz:2},out:1,t:4}, kohle:{in:{holz:3},out:1,t:5}, brot:{in:{weizen:3},out:1,t:6}, proviant:{in:{brot:1,fisch:2},out:2,t:8},
  eisen:{in:{erz:2,kohle:1},out:1,t:8}, ziegel:{in:{lehm:2,kohle:1},out:2,t:8}, stoff:{in:{wolle:2},out:1,t:6}, leinen:{in:{flachs:2},out:1,t:6},
  met:{in:{honig:2},out:1,t:8}, kaese:{in:{milch:3},out:1,t:8}, leder:{in:{fell:2},out:1,t:8},
  kleidung:{in:{stoff:1,leder:1},out:1,t:12}, segel:{in:{leinen:3,bretter:1},out:1,t:14},
  werkzeug:{in:{eisen:1,bretter:1},out:1,t:10}, waffe:{in:{eisen:2,bretter:1},out:1,t:12}, ruestung:{in:{eisen:2,leder:2},out:1,t:14}
};
/* st: Aussehen. s=house: Satteldachhaus (ex/ey halbe Breite in Feldern, h Wandhöhe, rh Dachhöhe, ax Firstrichtung, mat Wandmaterial, prop Beiwerk) */
const B={
  hof:{n:'Häuptlingshof',g:'',hidden:1,kind:'home',cap:0,cost:{},st:{s:'house',ex:.4,ey:.24,h:12,rh:15,ax:'x',wall:'#8A5A32',roof:'#6E7F4E',mat:'wood',turf:1,prop:'banner'}},
  huette:{n:'Hütte',g:'Wohnen',kind:'home',cap:4,cost:{holz:15},st:{s:'house',ex:.22,ey:.2,h:7,rh:13,ax:'y',wall:'#A27C55',roof:'#7E9A55',mat:'wood',turf:1}},
  langhaus:{n:'Langhaus',g:'Wohnen',kind:'home',cap:10,cost:{bretter:25,stein:15},req:8,st:{s:'house',ex:.42,ey:.2,h:9,rh:13,ax:'x',wall:'#9C7048',roof:'#5C4A3A',mat:'wood'}},
  steinhaus:{n:'Steinhaus',g:'Wohnen',kind:'home',cap:18,cost:{ziegel:30,bretter:20,werkzeug:2},req:24,st:{s:'house',ex:.32,ey:.28,h:15,rh:14,ax:'y',wall:'#D9D2C4',roof:'#9A3224',mat:'stone',chim:1}},
  holzfaeller:{n:'Holzfäller',g:'Rohstoffe',kind:'prod',out:'holz',rate:.5,jobs:2,cost:{holz:10},adj:{t:'forest',v:.2,max:.8},st:{s:'house',ex:.26,ey:.2,h:9,rh:11,ax:'y',wall:'#B9A07A',roof:'#6E4A2E',mat:'wood',prop:'logs'}},
  steinbruch:{n:'Steinbruch',g:'Rohstoffe',kind:'prod',out:'stein',rate:.35,jobs:2,cost:{holz:15},adj:{t:'rock',v:.2,max:.8},need:'rock',st:{s:'mine',h:10,f:.55,body:'#8C8F88'}},
  feld:{n:'Weizenfeld',g:'Rohstoffe',kind:'prod',out:'weizen',rate:.4,jobs:1,cost:{holz:10},adj:{b:'feld',v:.1,max:.4},st:{s:'field',crop:'weizen'}},
  steg:{n:'Fischersteg',g:'Rohstoffe',kind:'prod',out:'fisch',rate:.35,jobs:2,cost:{holz:20,stein:5},adj:{t:'water',v:.1,max:.5},need:'coast',st:{s:'dock'}},
  lehmgrube:{n:'Lehmgrube',g:'Rohstoffe',kind:'prod',out:'lehm',rate:.3,jobs:2,cost:{holz:20},reg:['moor'],adj:{t:'moor',v:.1,max:.4},st:{s:'pit'}},
  jaeger:{n:'Jägerhütte',g:'Rohstoffe',kind:'prod',out:'fell',rate:.18,jobs:2,cost:{holz:25,stein:10},reg:['taiga'],adj:{t:'forest',v:.15,max:.6},st:{s:'house',ex:.2,ey:.18,h:7,rh:12,ax:'x',wall:'#7F6B57',roof:'#4C6B45',mat:'wood',turf:1,prop:'hides'}},
  schafweide:{n:'Schafweide',g:'Rohstoffe',kind:'prod',out:'wolle',rate:.25,jobs:1,cost:{bretter:20,muenzen:80},adj:{t:'grass',v:.1,max:.5},st:{s:'pasture',animal:'schaf'}},
  flachsfeld:{n:'Flachsfeld',g:'Rohstoffe',kind:'prod',out:'flachs',rate:.3,jobs:1,cost:{holz:15,muenzen:40},reg:['moor','heide'],adj:{b:'flachsfeld',v:.1,max:.4},st:{s:'field',crop:'flachs'}},
  imkerei:{n:'Imkerei',g:'Rohstoffe',kind:'prod',out:'honig',rate:.2,jobs:1,cost:{bretter:15},reg:['heide'],adj:{t:'heide',v:.1,max:.6},st:{s:'hives'}},
  erzmine:{n:'Erzmine',g:'Rohstoffe',kind:'prod',out:'erz',rate:.25,jobs:3,cost:{bretter:20,stein:40},reg:['berg'],adj:{t:'rock',v:.15,max:.6},need:'rock',st:{s:'mine',h:14,f:.6,body:'#5E5450'}},
  silbermine:{n:'Silbermine',g:'Rohstoffe',kind:'prod',out:'silber',rate:.02,jobs:3,cost:{bretter:60,eisen:10},reg:['berg'],need:'peak',adj:{t:'berg',v:.1,max:.4},st:{s:'mine',h:16,f:.62,body:'#6E7A80'}},
  sammler:{n:'Bernsteinsammler',g:'Rohstoffe',kind:'prod',out:'bernstein',rate:.015,jobs:2,cost:{bretter:40,muenzen:200},reg:['duene'],need:'coast',adj:{t:'water',v:.1,max:.5},st:{s:'house',ex:.2,ey:.18,h:7,rh:11,ax:'y',wall:'#C9B08A',roof:'#7E8A6A',mat:'wood',turf:1,prop:'crates'}},
  kuhweide:{n:'Kuhweide',g:'Rohstoffe',kind:'prod',out:'milch',rate:.25,jobs:2,cost:{bretter:25,muenzen:100},req:12,adj:{t:'grass',v:.1,max:.5},st:{s:'pasture',animal:'kuh'}},
  saegewerk:{n:'Sägewerk',g:'Werkstätten',kind:'craft',rec:['bretter'],jobs:3,cost:{holz:40,stein:10},adj:{b:'holzfaeller',v:.2,max:.6},st:{s:'house',ex:.36,ey:.24,h:10,rh:10,ax:'x',wall:'#C9B08A',roof:'#8A5A32',mat:'wood',prop:'planks'}},
  koehlerei:{n:'Köhlerei',g:'Werkstätten',kind:'craft',rec:['kohle'],jobs:2,cost:{holz:30,stein:20},adj:{b:'holzfaeller',v:.15,max:.45},st:{s:'kiln'}},
  baeckerei:{n:'Bäckerei',g:'Werkstätten',kind:'craft',rec:['brot'],jobs:2,cost:{bretter:10,stein:20},adj:{b:'feld',v:.15,max:.6},st:{s:'house',ex:.28,ey:.24,h:11,rh:12,ax:'y',wall:'#E2D6BE',roof:'#9A3224',mat:'plaster',chim:1}},
  raeucherei:{n:'Räucherei',g:'Werkstätten',kind:'craft',rec:['proviant'],jobs:2,cost:{bretter:15,stein:10},adj:{b:'steg',v:.2,max:.4},st:{s:'house',ex:.26,ey:.22,h:9,rh:11,ax:'x',wall:'#7F6B57',roof:'#3E3A36',mat:'wood',chim:1,prop:'fishrack'}},
  schmelze:{n:'Schmelze',g:'Werkstätten',kind:'craft',rec:['eisen'],jobs:3,cost:{bretter:25,stein:40},adj:{b:'erzmine',v:.2,max:.6},st:{s:'house',ex:.3,ey:.26,h:12,rh:9,ax:'y',wall:'#6B6F6C',roof:'#2F3436',mat:'stone',chim:2}},
  ziegelei:{n:'Ziegelei',g:'Werkstätten',kind:'craft',rec:['ziegel'],jobs:3,cost:{bretter:20,stein:30},req:12,adj:{b:'lehmgrube',v:.2,max:.6},st:{s:'house',ex:.34,ey:.22,h:9,rh:10,ax:'x',wall:'#B5694A',roof:'#6E4A2E',mat:'stone',chim:1,prop:'bricks'}},
  webstuhl:{n:'Webstube',g:'Werkstätten',kind:'craft',rec:['stoff','leinen'],jobs:2,cost:{bretter:30,muenzen:120},adj:{b:'schafweide',v:.2,max:.6},st:{s:'house',ex:.28,ey:.22,h:10,rh:12,ax:'y',wall:'#D8CBB4',roof:'#5C7246',mat:'plaster'}},
  metbrauerei:{n:'Metbrauerei',g:'Werkstätten',kind:'craft',rec:['met'],jobs:2,cost:{bretter:30,stein:20},req:10,adj:{b:'imkerei',v:.2,max:.6},st:{s:'house',ex:.3,ey:.22,h:10,rh:11,ax:'x',wall:'#A07A4E',roof:'#5A3B24',mat:'wood',prop:'barrels'}},
  molkerei:{n:'Molkerei',g:'Werkstätten',kind:'craft',rec:['kaese'],jobs:2,cost:{bretter:30,ziegel:10},req:16,adj:{b:'kuhweide',v:.2,max:.6},st:{s:'house',ex:.28,ey:.24,h:10,rh:12,ax:'y',wall:'#EDE6D6',roof:'#3F5E6B',mat:'plaster'}},
  gerberei:{n:'Gerberei',g:'Werkstätten',kind:'craft',rec:['leder'],jobs:2,cost:{bretter:20,stein:20},req:10,adj:{b:'jaeger',v:.2,max:.6},st:{s:'house',ex:.28,ey:.2,h:9,rh:10,ax:'x',wall:'#8B6A48',roof:'#4E4A46',mat:'wood',prop:'hides'}},
  schmiede:{n:'Schmiede',g:'Werkstätten',kind:'craft',rec:['werkzeug','waffe','ruestung'],jobs:3,cost:{bretter:30,eisen:10,stein:30},adj:{b:'schmelze',v:.25,max:.5},st:{s:'house',ex:.3,ey:.26,h:11,rh:10,ax:'y',wall:'#4E4A46',roof:'#9A3224',mat:'stone',chim:2,prop:'anvil'}},
  schneiderei:{n:'Schneiderei',g:'Werkstätten',kind:'craft',rec:['kleidung','segel'],jobs:3,cost:{bretter:40,ziegel:20},req:20,adj:{b:'webstuhl',v:.2,max:.6},st:{s:'house',ex:.32,ey:.24,h:12,rh:12,ax:'x',wall:'#E4D3B8',roof:'#7A2418',mat:'plaster',prop:'cloth'}},
  brunnen:{n:'Brunnen',g:'Dorfleben',kind:'joy',joy:5,cost:{stein:25},st:{s:'well'}},
  markt:{n:'Marktplatz',g:'Dorfleben',kind:'joy',joy:6,tax:.1,jobs:2,cost:{bretter:40,muenzen:150},req:10,st:{s:'market'}},
  taverne:{n:'Methalle',g:'Dorfleben',kind:'joy',joy:12,uses:{met:.02},jobs:2,cost:{bretter:40,stein:30},req:12,st:{s:'house',ex:.42,ey:.26,h:11,rh:15,ax:'x',wall:'#7A5636',roof:'#3E3A36',mat:'wood',chim:1,prop:'barrels'}},
  tempel:{n:'Stabkirche',g:'Dorfleben',kind:'joy',joy:15,jobs:1,cost:{ziegel:40,bretter:30,bernstein:3},req:20,st:{s:'temple'}},
  bauhuette:{n:'Bauhütte',g:'Wehr & Lager',kind:'builder',cost:{holz:60,stein:40,muenzen:100},max:3,st:{s:'house',ex:.22,ey:.2,h:8,rh:10,ax:'x',wall:'#C49A62',roof:'#C4862A',mat:'wood',prop:'planks'}},
  lager:{n:'Lagerhaus',g:'Wehr & Lager',kind:'store',cost:{holz:30,stein:20},st:{s:'house',ex:.4,ey:.3,h:12,rh:10,ax:'x',wall:'#A87C52',roof:'#5A3B24',mat:'wood',prop:'crates'}},
  palisade:{n:'Palisade',g:'Wehr & Lager',kind:'def',hp:25,cost:{holz:40},st:{s:'wall'}},
  turm:{n:'Wachturm',g:'Wehr & Lager',kind:'def',dmg:4,cost:{bretter:20,stein:30},st:{s:'tower',h:40,f:.36,body:'#8B8F8A',roof:'#9A3224'}},
  bogenposten:{n:'Bogenposten',g:'Wehr & Lager',kind:'def',dmg:3,hp:5,cost:{bretter:20,eisen:5},st:{s:'tower',h:24,f:.42,body:'#9C7A52',roof:'#5C7246'}}
};
const GROUPS=['Wohnen','Rohstoffe','Werkstätten','Dorfleben','Wehr & Lager'];
const BASEHOUSE=6;
const DESC={
  hof:'Das Herz der Insel. Hier wohnt deine Sippe, 6 Plätze sind immer frei.',
  huette:'Einfaches Grassodenhaus. Mehr Einwohner heißt mehr Arbeitskräfte und mehr Steuern.',
  langhaus:'Das klassische Wohnhaus des Nordens. Viel Platz für Familien.',
  steinhaus:'Gemauert und warm. Bietet am meisten Wohnraum.',
  holzfaeller:'Fällt Bäume. Jedes freie Waldfeld daneben gibt Bonus.',
  steinbruch:'Bricht Stein aus dem Fels. Muss an Fels grenzen.',
  feld:'Baut Weizen an. Felder nebeneinander wachsen besser.',
  steg:'Fischer fahren täglich raus. Nur an der Küste.',
  lehmgrube:'Sticht Lehm aus der Marsch. Rohstoff für Ziegel.',
  jaeger:'Jäger ziehen in die Wälder und bringen Felle.',
  schafweide:'Schafe geben Wolle für die Webstube.',
  flachsfeld:'Blauer Flachs wird zu Leinen gesponnen.',
  imkerei:'Bienenkörbe für Honig. Heide ringsum hilft.',
  erzmine:'Fördert Eisenerz aus dem Berg. Muss an Fels grenzen.',
  kuhweide:'Kühe geben Milch für die Molkerei.',
  saegewerk:'Sägt Holz zu Brettern, dem wichtigsten Baustoff.',
  koehlerei:'Verkohlt Holz im Meiler. Kohle braucht die Schmelze und die Ziegelei.',
  baeckerei:'Backt Brot aus Weizen. Brot ernährt die Einwohner.',
  raeucherei:'Macht aus Brot und Fisch haltbaren Proviant für Raubzüge.',
  schmelze:'Schmilzt Erz mit Holzkohle zu Eisen.',
  ziegelei:'Brennt Lehm zu Ziegeln für Steinhäuser und Kirchen.',
  webstuhl:'Webt Wollstoff oder Leinen.',
  metbrauerei:'Braut Met aus Honig. Die Methalle schenkt ihn aus.',
  molkerei:'Macht Käse aus Milch. Käse ist die beste Nahrung.',
  gerberei:'Gerbt Felle zu Leder für Rüstungen und Kleidung.',
  schmiede:'Schmiedet Werkzeug, Waffen und Rüstungen.',
  schneiderei:'Näht Kleidung für die Einwohner und Segel für Schiffe.',
  brunnen:'Frisches Wasser macht das Dorf zufriedener.',
  markt:'Händler und Gerede. Mehr Zufriedenheit und 10 % mehr Steuern je Stufe.',
  taverne:'Hier wird gefeiert. Braucht Met, dann steigt die Zufriedenheit stark.',
  tempel:'Die Stabkirche gibt dem Dorf Halt. Großer Zufriedenheitsschub.',
  lager:'Mehr Platz für jeden Rohstoff.',
  bauhuette:'Hier wohnt ein weiterer Baumeister. Jeder Baumeister kann gleichzeitig ein Gebäude bauen oder ausbauen.',
  silbermine:'Schürft Silber aus den Gipfeln. Muss an einen Gipfel grenzen.',
  sammler:'Sammelt Bernstein, den die Brandung an den Strand spült.',
  palisade:'Holzwall gegen Plünderer. Mehr Lebenspunkte für die Insel.',
  turm:'Bogenschützen auf dem Turm treffen hart.',
  bogenposten:'Kleiner Posten mit etwas Schutz und Schaden.'
};
const RDESC={
  holz:'Grundbaustoff. Wird zu Brettern und Holzkohle.',stein:'Für Fundamente, Mauern und Brunnen.',lehm:'Wird mit Kohle zu Ziegeln gebrannt.',
  weizen:'Die Bäckerei macht Brot daraus.',fisch:'Nahrung für die Einwohner und Zutat für Proviant.',wolle:'Wird zu Wollstoff gewebt.',
  flachs:'Wird zu Leinen gewebt.',honig:'Wird zu Met gebraut.',milch:'Wird zu Käse.',erz:'Wird mit Kohle zu Eisen geschmolzen.',fell:'Wird zu Leder gegerbt.',
  bretter:'Der wichtigste Baustoff für Gebäude und Ausbau.',kohle:'Brennstoff für Schmelze und Ziegelei.',ziegel:'Für Steinhäuser, Molkerei und Kirche.',
  brot:'Nahrung. Mehrere Nahrungssorten machen zufriedener.',kaese:'Nahrung. Mehrere Nahrungssorten machen zufriedener.',met:'Die Methalle schenkt ihn aus.',
  leder:'Für Rüstungen und Kleidung.',leinen:'Für Segel.',stoff:'Für Kleidung.',eisen:'Für Werkzeug, Waffen und Rüstungen.',
  proviant:'Jeder Krieger braucht einen Sack auf dem Raubzug, Extrasäcke zum Rasten.',kleidung:'Einwohner tragen sie auf. Gibt Zufriedenheit.',
  segel:'Für die großen Inselerweiterungen.',werkzeug:'Nötig für höhere Gebäudestufen.',waffe:'Ein Krieger mit Waffe schlägt fester zu.',
  ruestung:'Ein Krieger mit Rüstung hält mehr aus.',bernstein:'Beute. Wertvoll, auch für die Stabkirche.',silber:'Beute. Nötig ab Stufe 4.',
  rune:'Seltene Beute, sehr wertvoll.',muenzen:'Kommen aus Steuern, Handel und Raubzügen.'
};
const ADJICON={forest:'wald',rock:'stein',water:'wasser',grass:'wiese'};
const TERR={grass:{n:'Wiese',c:'#A3B57E'},forest:{n:'Wald',c:'#86996A'},rock:{n:'Fels',c:'#A7A89E'},sand:{n:'Strand',c:'#E2D3A6'},tundra:{n:'Schneefeld',c:'#C9D3CB'},heide:{n:'Heide',c:'#ADA184'},moor:{n:'Marsch',c:'#869673'},berg:{n:'Gipfel',c:'#8E918A'}};
/* Gebiete rund um das Heimatland. a = Richtung in Grad (Weltkoordinaten), finds = was es nur dort gibt */
const REG=[
  {id:'heim',n:'Heimatland',ic:'wiese'},
  {id:'taiga',n:'Nordwald',ic:'wald',a:-135,cost:{holz:80,stein:40,muenzen:100},t:120,req:6,finds:['holz','fell'],desc:'Verschneiter Nadelwald. Nur hier ziehen Jäger los.'},
  {id:'heide',n:'Heideland',ic:'heide',a:153,cost:{bretter:60,muenzen:200},t:300,req:10,finds:['honig','wolle'],desc:'Violette Heide voller Bienen. Nur hier stehen Imkereien.'},
  {id:'moor',n:'Marschland',ic:'moor',a:81,cost:{bretter:80,stein:60,muenzen:300},t:600,req:12,finds:['lehm','flachs'],desc:'Nasses Marschland. Nur hier gibt es Lehm und Flachs.'},
  {id:'berg',n:'Bergland',ic:'berg',a:-60,cost:{bretter:150,ziegel:40,muenzen:600},t:1200,req:18,finds:['erz','silber'],desc:'Schroffe Gipfel. Nur hier gibt es Erz und Silber.'},
  {id:'duene',n:'Dünenküste',ic:'duene',a:12,cost:{bretter:200,ziegel:60,segel:3,muenzen:1000},t:2700,req:26,finds:['bernstein','fisch'],desc:'Wind und Sand. Nur hier spült das Meer Bernstein an.'}
];
const REGI=Object.fromEntries(REG.map((r,i)=>[r.id,i]));
/* Bauzeiten in Sekunden für Stufe 1, Ausbau auf Stufe L+1 dauert bt·2,4^L */
const BTK={home:20,prod:30,craft:60,joy:90,store:40,def:45,builder:30};
const BT={langhaus:60,steinhaus:120,markt:120,taverne:180,tempel:300,schneiderei:120,silbermine:180,sammler:150,schmiede:120};
const DIFF=[null,
  {n:'Fischerdorf',hp:14,atk:2.5,storm:14,loot:[['muenzen',40],['eisen',25],['bernstein',20],['silber',10],['rune',5]]},
  {n:'Grabhügel',hp:26,atk:4.5,storm:11,loot:[['muenzen',20],['bernstein',30],['silber',30],['rune',12],['eisen',8]]},
  {n:'Festung des Jarls',hp:45,atk:7.5,storm:9,loot:[['silber',35],['rune',30],['bernstein',25],['muenzen',10]]}
];
const CELLICON={ship:'schiff',truhe:'truhe',feind:'schaedel',grab:'grab',leer:'pfad',feuer:'feuer',boss:'krone'};
const CREW=['Ragna','Bjørn','Sigrid'], CREWP=['ragna','bjorn','sigrid'];
const ENEMYP={feind:'raider',grab:'draugr',draugr:'draugr',boss:'jarl'};
const ENEMYN={feind:'Plünderer',grab:'Grabwächter',draugr:'Draugr',boss:'Jarl Eirik'};

