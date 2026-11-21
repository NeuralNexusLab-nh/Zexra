// Cache fingerprints keep HTML, CSS and all ES-module dependencies in sync.
// Run after source changes and before publishing. No runtime build is required.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),hash=s=>createHash('sha256').update(s).digest('hex').slice(0,12),hashes={};
for(const name of ['physics','rules','handling','input','audio','weapons','horror','world','game']){
 const path=resolve(root,`scripts/${name}.js`);let text=await readFile(path,'utf8');
 text=text.replace(/from '\.\/(\w+)\.js(?:\?[^']*)?';/g,(match,dep)=>`from './${dep}.js?asset=${hashes[dep]}';`);
 hashes[name]=hash(text);await writeFile(path,text);
}
let html=await readFile(resolve(root,'index.html'),'utf8');
for(const name of ['game','optics','operations']){const path=`styles/${name}.css`,stamp=hash(await readFile(resolve(root,path)));if(html.includes(`href="${path}`))html=html.replace(new RegExp(`href="styles/${name}\\.css(?:\\?[^\"]*)?"`),`href="${path}?asset=${stamp}"`);else html=html.replace('</head>',`<link rel="stylesheet" href="${path}?asset=${stamp}"></head>`);}
html=html.replace(/src="scripts\/game\.js(?:\?[^\"]*)?"/,`src="scripts/game.js?asset=${hashes.game}"`);await writeFile(resolve(root,'index.html'),html);console.log('Asset fingerprints updated');
