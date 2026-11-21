// Optional file:// preview. The deployable site itself needs no build step.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFile(resolve(root,p),'utf8');
const files=['physics','world','weapons','audio','game'];let code='';
for(const file of files){let source=await read(`scripts/${file}.js`);source=source.replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');if(file!=='physics')source=source.replace(/^const T=window.THREE;\r?\n/,'');if(file==='weapons')source=source.replace(/\bmaterials\b/g,'weaponMaterials').replace(/\bgeometries\b/g,'weaponGeometries');if(file==='game')source=source.replace('const T=window.THREE,$=','const $=');code+=source+'\n';}
let html=await read('index.html');html=html.replace('<link rel="stylesheet" href="styles/game.css">',`<style>${await read('styles/game.css')}</style>`).replace('<script src="vendor/three.min.js"></script><script type="module" src="scripts/game.js"></script>',()=>`<script>${''}</script><script>${'/* local preview */'}</script>`);
// Function replacement avoids interpreting $& in embedded source.
html=html.replace('<script></script><script>/* local preview */</script>',()=>`<script>${''}</script>`);
const lib=await read('vendor/three.min.js');html=html.replace('<script></script>',()=>`<script>${lib.replace(/<\/script/gi,'<\\/script')}</script><script>(()=>{const T=window.THREE;\n${code}\n})();</script>`);
await mkdir(resolve(root,'.qa'),{recursive:true});await writeFile(resolve(root,'.qa/preview.html'),html);console.log('Standalone QA preview generated');
