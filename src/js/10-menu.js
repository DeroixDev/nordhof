/* ---------- Menü ---------- */
const VERSION='0.7.6';
const MROW=(act,ic,label,extra,cls)=>'<button class="mrow'+(cls?' '+cls:'')+'" data-act="'+act+'"'+(extra||'')+'>'+IC(ic,'i24')+'<span class="ml">'+label+'</span><span class="chev"></span></button>';
const MHEAD=(ic,title,sub,back)=>'<div class="head">'+(back?'<button class="x back" data-act="mpage" data-p="main" aria-label="Zurück"></button>':IC(ic,'i48'))+'<div class="t"><h2>'+title+'</h2>'+(sub?'<p class="sub">'+sub+'</p>':'')+'</div><button class="x" data-act="closemodal" aria-label="Schließen"></button></div>';
const TOG=(key,label,ic)=>'<div class="switch"><span class="n">'+IC(ic,'i24')+label+'</span><button class="btn small '+(S.opt[key]?'':'alt')+'" data-act="opt" data-k="'+key+'">'+(S.opt[key]?'An':'Aus')+'</button></div>';
let mPage='main';
function showMenu(page){
  resetArm=false;mPage=page||'main';let h='';
  if(mPage==='main'){
    h=MHEAD('haus','Nordhof','Version '+VERSION+' · Spielstand nur auf diesem Gerät')+'<div class="mlist">'+
      MROW('closemodal','schiff','Weiterspielen')+MROW('mpage','arbeit','Einstellungen',' data-p="set"')+MROW('mpage','truhe','Spielstand sichern und laden',' data-p="save"')+
      MROW('mpage','krone','Statistik',' data-p="stats"')+MROW('mpage','haus','Steuerung und Anleitung',' data-p="help"')+MROW('mpage','rune','Über Nordhof',' data-p="about"')+
      MROW('mpage','schloss','Entwicklermenü',' data-p="dev"','dev')+'</div>'+
      '<div class="switch"><span class="n">'+IC('plus','i24')+'Neue Insel</span><button class="btn small alt" data-act="reset">Neu beginnen</button></div>';
  } else if(mPage==='set'){
    h=MHEAD('','Einstellungen','',1)+
      '<div class="switch"><span class="n">'+IC('uhr','i24')+'Tag und Nacht</span><button class="btn small '+(S.opt.dn!=='tag'?'':'alt')+'" data-act="dn" data-v="'+(S.opt.dn!=='tag'?'tag':'auto')+'">'+(S.opt.dn!=='tag'?'An':'Aus')+'</button></div>'+
      TOG('eco','Akku sparen (weniger Auflösung)','feuer')+TOG('calm','Weniger Animationen','herz')+TOG('fps','FPS anzeigen','uhr')+TOG('wetter','Wetter: Regen, Schnee, Nebel','winter')+sndHTML();
  } else if(mPage==='save'){
    h=MHEAD('','Spielstand','Alles bleibt auf dem Gerät. Zum Sichern als Text kopieren oder als Datei speichern.',1)+
      '<div class="btns"><button class="btn wide" data-act="exp" data-how="copy">'+IC('truhe','i16')+'Als Text kopieren</button></div>'+
      (window.Capacitor||window.top!==window?'':'<div class="btns"><button class="btn alt wide" data-act="exp" data-how="file">'+IC('truhe','i16')+'Als Datei speichern</button></div>')+
      '<h3>Laden</h3><textarea id="impTxt" class="ta" placeholder="Gesicherten Spielstand hier einfügen"></textarea>'+
      '<div class="btns"><button class="btn alt" style="flex:1" data-act="impfile">Datei wählen</button><button class="btn red" style="flex:1" data-act="imp">Laden und ersetzen</button></div><input type="file" id="impF" accept=".json,application/json,text/plain" hidden>';
  } else if(mPage==='stats'){
    let bs=0,lv=0;for(const i of BL){bs++;lv+=S.tiles[i].b.lvl;}
    const rows=[['uhr','Spielzeit',fmtDur((now()-(S.started||now()))/1000)],['krone','Hofstufe',hofL()],['leute','Einwohner',Math.floor(S.pop.n)+' / '+D.house],['haus','Gebäude',bs],['hoch','Stufen zusammen',lv],
      ['schiff','Gebiete erkundet',S.open.length+' / '+REG.length],['schild','Überfälle',S.raid.n||0],['schwert','Raubzüge gewonnen',S.wins.reduce((a,b)=>a+b,0)],['muenzen','Münzen',fmt(S.res.muenzen)]];
    h=MHEAD('','Statistik','',1)+'<div class="mlist">'+rows.map(r=>'<div class="mrow stat">'+IC(r[0],'i24')+'<span class="ml">'+r[1]+'</span><b>'+r[2]+'</b></div>').join('')+'</div>';
  } else if(mPage==='help'){
    const H=[['Maus','Linke Taste ziehen oder rechte Taste ziehen verschiebt die Karte. Mausrad zoomt dorthin, wo der Zeiger steht. Klick wählt ein Gebäude, Rechtsklick hebt die Auswahl auf.'],
      ['Tastatur','WASD oder Pfeile schieben, B öffnet die Bauleiste, H den Hof, Leertaste hält an, 1 bis 4 wählt das Tempo, U baut aus, X reißt ab, R dreht, P legt einen Pfad, Esc bricht ab.'],
      ['Wege','Unter Bauen, Wege: mit gedrückter Maustaste ziehen. Jedes Gebäude braucht einen Weg zum Hof, sonst arbeitet es nur halb so gut. Die Tür zeigt beim Bauen von selbst zum Weg, R dreht. Schotter und Pflaster machen die Leute schneller, ein Lagerhaus nah an den Betrieben verkürzt ihre Wege.'],
      ['Bauen','Unten ein Gebäude wählen, dann zeigt ein Geist, wo es hinpasst: grün geht, rot nicht, mit Grund. Klick baut, mit Shift mehrere hintereinander. Große Gebäude belegen 2×2 oder 3×3 Felder.'],
      ['Arbeitsfläche','Holzfäller, Steinbruch, Fischer und andere brauchen passenden Boden im Umkreis. Gleiche Betriebe teilen sich überlappende Felder, also lieber verteilen.'],
      ['Hof','Der Häuptlingshof ist wie ein Rathaus. Jede Stufe schaltet Gebäude, Gebiete, Bereiche und ein neues Kapitel frei. Kein Gebäude steht höher als der Hof.'],
      ['Gebiete','Schilder auf der Insel zeigen verschlossene Gebiete. Ab der passenden Hofstufe erkunden, dann gibt es dort eigene Rohstoffe und Gebäude.'],
      ['Dorf','Wohnhäuser bringen Einwohner. Sie arbeiten, essen und zahlen Steuern. Gute Laune macht alles schneller.'],
      ['Wehr','Ab Hofstufe 2 kommen Plünderer. Palisaden, Türme und Bogenposten halten sie auf.'],
      ['Raubzug','Mit bis zu 3 Kriegern losziehen, Beute sammeln und rechtzeitig am Schiff oder Signalfeuer heimfahren.'],
      ['Jahreszeiten','Oben in der Leiste, auf dem Handy rechts auf der Karte, steht die Jahreszeit. Antippen zeigt, was sie bewirkt. Felder bringen ihren Ertrag im Herbst auf einmal. Im Winter essen die Leute mehr, heizen mit Holz, und Fischer fangen weniger. Wer vorsorgt, hat ein zufriedenes Dorf.'],
      ['Offline','Bis zu 8 Stunden läuft alles weiter, auch Bauaufträge.']];
    h=MHEAD('','Steuerung und Anleitung','',1)+H.map(x=>'<h3>'+x[0]+'</h3><p class="note" style="margin:0">'+x[1]+'</p>').join('');
  } else if(mPage==='about'){
    h=MHEAD('','Über Nordhof','',1)+'<p class="note">Nordhof '+VERSION+'. Ein Offline-Aufbauspiel im Nordmeer. Kein Konto, kein Server, keine Werbung. Der Spielstand liegt nur auf diesem Gerät.</p>'+(oldSave()?'<p class="note">Der Spielstand aus Version 0.6 passt nicht auf die neue, große Karte. Er bleibt unangetastet gespeichert.</p>':'');
  } else if(mPage==='dev'){
    const ks=Object.keys(RES);
    h=MHEAD('','Entwicklermenü','Daten direkt ändern. Für Tests.',1)+
      '<h3>Rohstoffe</h3><div class="dgrid"><button class="btn small alt" data-act="dev" data-d="res100">Alle +100</button><button class="btn small alt" data-act="dev" data-d="res1000">Alle +1000</button><button class="btn small alt" data-act="dev" data-d="resfull">Lager voll</button><button class="btn small alt" data-act="dev" data-d="res0">Alle auf 0</button><button class="btn small alt" data-act="dev" data-d="coin1k">Münzen +1000</button><button class="btn small alt" data-act="dev" data-d="coin10k">Münzen +10000</button></div>'+
      '<div class="drow"><select id="dvK">'+ks.map(k=>'<option value="'+k+'">'+RES[k].n+'</option>').join('')+'</select><input id="dvN" type="number" inputmode="numeric" value="100"><button class="btn small" data-act="dev" data-d="setres">Setzen</button></div>'+
      '<h3>Dorf</h3><div class="drow"><span class="n">Einwohner <small style="font-weight:500">bis Wohnraum '+D.house+'</small></span><input id="dvP" type="number" inputmode="numeric" value="'+Math.floor(S.pop.n)+'"><button class="btn small" data-act="dev" data-d="setpop">Setzen</button></div>'+
      '<div class="dgrid"><button class="btn small alt" data-act="dev" data-d="fed">Hunger weg</button><button class="btn small alt" data-act="dev" data-d="heal">Krieger heilen</button></div>'+
      '<h3>Bauen und Gebiete</h3><div class="dgrid"><button class="btn small alt" data-act="dev" data-d="jobs">Aufträge fertig</button><button class="btn small alt" data-act="dev" data-d="bld5">5 Baumeister</button><button class="btn small alt" data-act="dev" data-d="lvup">Alle Stufe +1</button><button class="btn small alt" data-act="dev" data-d="lvmax">Alle bis Hofstufe</button><button class="btn small alt" data-act="dev" data-d="hofup">Hofstufe +1</button><button class="btn small alt" data-act="dev" data-d="open">Alle Gebiete offen</button><button class="btn small alt" data-act="dev" data-d="close">Nur Heimat offen</button></div>'+
      '<h3>Zeit</h3><div class="dgrid"><button class="btn small alt" data-act="dev" data-d="w10">+10 min</button><button class="btn small alt" data-act="dev" data-d="w60">+1 h</button><button class="btn small alt" data-act="dev" data-d="w480">+8 h</button><button class="btn small alt" data-act="dev" data-d="season">Nächste Jahreszeit</button><button class="btn small alt" data-act="dev" data-d="raid">Überfall jetzt</button><button class="btn small alt" data-act="dev" data-d="noraid">Überfall +1 h</button><button class="btn small alt" data-act="dev" data-d="dn">Licht: '+({auto:'Uhrzeit',tag:'Tag',nacht:'Nacht'}[S.opt.dn||'auto'])+'</button></div>'+
      '<h3>Rohdaten</h3><textarea id="dvJ" class="ta mono"></textarea><div class="btns"><button class="btn alt" style="flex:1" data-act="dev" data-d="jload">Neu laden</button><button class="btn red" style="flex:1" data-act="dev" data-d="japply">Übernehmen</button></div>';
  }
  openModal(h);
  if(mPage==='dev')$('#dvJ').value=JSON.stringify(serialize());
}
function updTempo(){const k=CLK.k;document.querySelectorAll('#tseg button').forEach(b=>b.classList.toggle('on',+b.dataset.k===k));const sm=$('#speedM');sm.innerHTML=k?k+'×':'<span class="pp"></span>';sm.classList.toggle('paused',!k);$('#paused').hidden=!!k;}
/* Welt-Zwischenspeicher nach Laden oder Neubeginn leeren */
function resetWorld(){initRoads();PATHC.clear();vill.length=0;for(const k in TREES)delete TREES[k];TCOL=null;LPC=null;groundDirty();RCENT=regionCenters();derive();sel=-1;hov=-1;if(place)endPlace();centerHof();}
function applyOpt(){updTempo();document.body.classList.toggle('calm',!!S.opt.calm);$('#fps').hidden=!S.opt.fps;updNight();}
/* Zeit vorspulen: alle Zeitpunkte rücken näher, der nächste Takt rechnet die Zeit nach wie nach einer Pause */
function timeWarp(ms){
  const sh=v=>v?v-ms:v;
  S.t-=ms;S.tiles.forEach(T=>{if(T.b&&T.b.until)T.b.until-=ms;});
  if(S.explore)S.explore.until-=ms;S.raid.next=sh(S.raid.next);if(S.raid.pending)S.raid.since-=ms;S.boat.until=sh(S.boat.until);
  S.crew.forEach(c=>{if(c.wounded)c.wounded-=ms;});if(S.started)S.started-=ms;
}
function devAct(d){
  const all=f=>{for(const k in RES)if(k!=='muenzen')f(k);};let msg='Erledigt';
  switch(d){
    case'res100':all(k=>S.res[k]+=100);break;case'res1000':all(k=>S.res[k]+=1000);break;
    case'resfull':all(k=>S.res[k]=Math.max(S.res[k],capped(k)?D.cap:999));break;case'res0':all(k=>S.res[k]=0);break;
    case'coin1k':S.res.muenzen+=1000;break;case'coin10k':S.res.muenzen+=10000;break;
    case'setres':{const k=$('#dvK').value,n=+$('#dvN').value;if(isFinite(n))S.res[k]=Math.max(0,n);msg=RES[k].n+' = '+fmt(S.res[k]);break;}
    case'setpop':{const n=+$('#dvP').value;if(isFinite(n))S.pop.n=Math.max(0,Math.floor(n));msg='Einwohner = '+S.pop.n;break;}
    case'fed':S.pop.hunger=0;break;case'heal':S.crew.forEach(c=>c.wounded=0);break;
    case'jobs':S.tiles.forEach(T=>{if(T.b&&T.b.until)T.b.until=now()-1;});if(S.explore)S.explore.until=now()-1;finishJobs();break;
    case'bld5':{let n=builders();const[hx,hy]=bCtr(S.hof),dd=k=>Math.hypot(k%N-hx,((k/N)|0)-hy),order=[...Array(N*N).keys()].sort((a,b)=>dd(a)-dd(b));
      for(const k of order){if(n>=5||countType('bauhuette')>=B.bauhuette.max)break;const e=placeErr('bauhuette',k);if(e&&e!=='Ab Hofstufe 2')continue;placeB(k,{type:'bauhuette',lvl:1,prog:0,run:0});groundDirty(cellsOf(k,2));reindex();n++;}break;}
    case'lvup':for(const i of BL){const b=S.tiles[i].b;if(b.type!=='hof'&&b.lvl<maxLvl(b)&&!b.until)b.lvl++;}break;
    case'lvmax':for(const i of BL){const b=S.tiles[i].b;if(b.type!=='hof'&&!b.until)b.lvl=maxLvl(b);}break;
    case'hofup':{const b=S.tiles[S.hof].b;if(b.lvl<MAXLVL&&!b.until){b.lvl++;LIVE=true;hofUp(b.lvl);LIVE=false;}closeModal();break;}
    case'open':S.open=REG.map((r,i)=>i);S.explore=null;RCENT=regionCenters();groundDirty();break;
    case'close':S.open=[0];S.explore=null;RCENT=regionCenters();groundDirty();break;
    case'w10':timeWarp(10*60e3);msg='10 Minuten vorgespult';break;case'w60':timeWarp(3600e3);msg='1 Stunde vorgespult';break;case'w480':timeWarp(8*3600e3);msg='8 Stunden vorgespult';break;
    case'season':seasonSkip();msg='Jahreszeit gewechselt';break;
    case'raid':S.raid.next=now();break;case'noraid':S.raid.pending=false;S.raid.next=now()+3600e3;break;
    case'dn':S.opt.dn={auto:'tag',tag:'nacht',nacht:'auto'}[S.opt.dn||'auto'];applyOpt();break;
    case'jload':break;
    case'japply':{try{S=deserialize(JSON.parse($('#dvJ').value));restoreClock();resetWorld();msg='Rohdaten übernommen';}catch(e){toast(IC('schloss','i24')+'Kein gültiger Spielstand');return;}break;}
  }
  derive();save();render();refresh();if(d!=='hofup')showMenu('dev');toast(IC('arbeit','i24')+msg);
}
function exportSave(how){
  save();const txt=JSON.stringify(serialize());
  if(how==='copy'){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast(IC('truhe','i24')+'Spielstand kopiert'),()=>{const t=$('#impTxt');t.value=txt;t.select();toast(IC('truhe','i24')+'Text markiert, bitte kopieren');});}
  else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download='nordhof-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
}
function importSave(txt){
  let o;try{o=JSON.parse(txt);}catch(e){toast(IC('schloss','i24')+'Das ist kein Nordhof-Spielstand');return;}
  if(o&&o.tiles&&o.v<4){toast(IC('schloss','i24')+'Spielstand aus 0.6 passt nicht auf die neue Karte');return;}
  try{S=deserialize(o);restoreClock();S.t=now();resetWorld();derive();save();applyOpt();closeModal();tab='insel';render(true);toast(IC('truhe','i24')+'Spielstand geladen');}
  catch(e){toast(IC('schloss','i24')+'Das ist kein Nordhof-Spielstand');}
}

