// Optional file:// preview. The deployable site itself needs no build step.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFile(resolve(root,p),'utf8');
const files=['physics','rules','input','world','horror','weapons','audio','game'];let code='';
for(const file of files){let source=await read(`scripts/${file}.js`);source=source.replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');if(file!=='physics')source=source.replace(/^const T=window.THREE;\r?\n/,'');if(file==='weapons')source=source.replace(/\bmaterials\b/g,'weaponMaterials').replace(/\bgeometries\b/g,'weaponGeometries');if(file==='game')source=source.replace('const T=window.THREE,$=','const $=');code+=source+'\n';}
let html=await read('index.html');
for(const name of ['game','optics','operations']){const css=await read(`styles/${name}.css`);html=html.replace(new RegExp(`<link rel="stylesheet" href="styles/${name}\\.css[^\"]*">`),()=>`<style>${css}</style>`);}
const lib=await read('vendor/three.min.js');html=html.replace(/<script src="vendor\/three\.min\.js"><\/script><script type="module" src="scripts\/game\.js[^\"]*"><\/script>/,()=>`<script>${lib.replace(/<\/script/gi,'<\\/script')}</script><script>(()=>{const T=window.THREE;\n${code}\n})();</script>`);
await mkdir(resolve(root,'.qa'),{recursive:true});await writeFile(resolve(root,'.qa/preview.html'),html);console.log('Standalone QA preview generated');
