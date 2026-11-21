import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8'),hash=s=>createHash('sha256').update(s).digest('hex').slice(0,12);
test('visible interface and game strings use English only',async()=>{for(const file of ['index.html','scripts/game.js','scripts/physics.js'])assert.ok(!/\p{Script=Han}/u.test(await read(file)),file);const html=await read('index.html');assert.ok(html.includes('lang="en"'));assert.ok(html.includes('OUTMANEUVER,'));assert.ok(!html.includes('ARENA 1.0'));assert.ok(html.includes('href="LICENSE"'));assert.ok((await read('LICENSE')).startsWith('Copyright (c) 2026 NXLabTW\n'));});
test('HTML asset cache fingerprints match their actual contents',async()=>{const html=await read('index.html');for(const m of html.matchAll(/(?:src|href)="([^"?]+)\?asset=([a-f0-9]+)"/g))assert.equal(hash(await read(m[1])),m[2],m[1]);});
test('module cache fingerprints match all dependent files',async()=>{for(const file of ['world','game']){const source=await read(`scripts/${file}.js`);for(const m of source.matchAll(/from '\.\/(\w+)\.js\?asset=([a-f0-9]+)'/g))assert.equal(hash(await read(`scripts/${m[1]}.js`)),m[2],m[1]);}});
test('brand colors are purple and blue, with no old yellow accent',async()=>{const css=await read('styles/game.css');assert.ok(css.includes('#a98aff'));assert.ok(css.includes('#78d8ff'));assert.ok(!css.includes('#d8ef75'));});
