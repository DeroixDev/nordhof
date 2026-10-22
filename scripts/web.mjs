// Baut die Webfassung für GitHub Pages (deroixdev.github.io/nordhof) aus www/index.html.
// Ergebnis: Ordner (Standard web/) mit index.html, Schriften, Symbolen, Manifest und Service Worker,
// damit das Spiel auf dem iPhone als Homescreen-App auch ohne Netz läuft.
// Aufruf: node scripts/build.mjs && node scripts/web.mjs [Zielordner]
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const out = (process.argv[2] || 'web').replace(/\/$/, '');
const ver = (readFileSync('src/js/10-menu.js', 'utf8').match(/VERSION\s*=\s*'([^']+)'/))[1];
mkdirSync(out + '/fonts', { recursive: true });
mkdirSync(out + '/icons', { recursive: true });
for (const f of ['grenze.woff2', 'worksans.woff2']) copyFileSync('www/fonts/' + f, `${out}/fonts/${f}`);

// Symbole aus dem App-Symbol der iOS-App
const src = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open(${JSON.stringify(src)}).convert('RGB')
for s in (180,192,512): im.resize((s,s),Image.LANCZOS).save(${JSON.stringify(out)}+'/icons/icon-%d.png'%s)
`]);

const head = `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Nordhof">
<meta name="theme-color" content="#172125">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<script>if('serviceWorker' in navigator&&location.protocol!=='file:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js'))</script>
</head>`;
const page = readFileSync('www/index.html', 'utf8').replace('</head>', () => head);
writeFileSync(out + '/index.html', page);

writeFileSync(out + '/manifest.webmanifest', JSON.stringify({
  name: 'Nordhof', short_name: 'Nordhof', lang: 'de', start_url: './', scope: './', display: 'fullscreen',
  orientation: 'any', background_color: '#172125', theme_color: '#172125',
  icons: [192, 512].map(s => ({ src: `icons/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png', purpose: 'any' }))
}, null, 2));

// Service Worker: alles vorab speichern, dann zuerst aus dem Speicher. Neue Version = neuer Cache-Name.
const files = ['./', 'index.html', 'manifest.webmanifest', 'fonts/grenze.woff2', 'fonts/worksans.woff2', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
const hash = createHash('sha1').update(page).digest('hex').slice(0, 8);
writeFileSync(out + '/sw.js', `const C='nordhof-${ver}-${hash}',F=${JSON.stringify(files)};
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('nordhof-')&&n!==C).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const nav=e.request.mode==='navigate';
  e.respondWith(nav?fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put('index.html',k));return r}).catch(()=>caches.match('index.html'))
    :caches.match(e.request).then(r=>r||fetch(e.request)))});
`);
console.log(`${out}/ gebaut (Version ${ver}, Cache ${hash})`);
