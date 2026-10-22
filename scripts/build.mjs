// Baut das Spiel aus src/shell.html und den Skripten in src/js (in Namensreihenfolge zusammengefügt).
// Ergebnis: dist/game.html (Fragment für die Vorschau im Browser) und www/index.html (App, Schriften lokal).
// Aufruf: node scripts/build.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';

const js = readdirSync('src/js').filter(f => f.endsWith('.js')).sort()
  .map(f => `/* ---- ${f} ---- */\n` + readFileSync('src/js/' + f, 'utf8')).join('\n');
const shell = readFileSync('src/shell.html', 'utf8');
if (!shell.includes('/*JS*/')) throw new Error('Platzhalter /*JS*/ fehlt in src/shell.html');
let game = shell.replace('/*JS*/', () => js);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/game.html', game);

const fonts = `<style>
@font-face{font-family:'Grenze';font-weight:100 900;font-display:swap;src:url(fonts/grenze.woff2) format('woff2')}
@font-face{font-family:'Work Sans';font-weight:100 900;font-display:swap;src:url(fonts/worksans.woff2) format('woff2')}
</style>`;
game = game.replace(/<link rel="preconnect"[^>]*>\n?/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, fonts);
if (game.includes('fonts.googleapis.com')) throw new Error('Google-Fonts-Link nicht ersetzt');

const page = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<style>:root{box-sizing:border-box;height:100%;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>
</head>
<body>
${game}
</body>
</html>
`;
writeFileSync('www/index.html', page);
console.log('dist/game.html und www/index.html gebaut');
