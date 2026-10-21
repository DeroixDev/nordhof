// Baut www/index.html aus src/game.html: ganzes HTML-Dokument drumherum, Schriften lokal statt von Google.
// Aufruf: node scripts/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

let game = readFileSync('src/game.html', 'utf8');
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
console.log('www/index.html gebaut');
