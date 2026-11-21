import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
import {reloadPose} from '../scripts/handling.js';import {WEAPONS,makeBody,moveBody} from '../scripts/physics.js';
const THREE={};vm.runInNewContext(await readFile(new URL('../vendor/three.min.js',import.meta.url),'utf8'),{exports:THREE,module:{exports:THREE},console:{warn(){}}});
globalThis.window={THREE};globalThis.document={createElement(){return{width:0,height:0,getContext(){return{createRadialGradient(){return{addColorStop(){}};},fillRect(){},getImageData(){return{data:new Uint8ClampedArray(512*512*4)};},putImageData(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(){}};}};}};
const {createWeapon}=await import('../scripts/weapons.js');const {createWorld,findPath}=await import('../scripts/world.js');
test('all guns build finite geometry, separate replacement magazines and correct optics',()=>{
 for(const weapon of WEAPONS){const gun=createWeapon(weapon.id);assert.notEqual(gun.userData.mag,gun.userData.oldMag);assert.notEqual(gun.userData.mag,gun.userData.newMag);assert.ok(gun.userData.mag.children.length);assert.equal(gun.userData.optic,['awp','barrett'].includes(weapon.id)?'magnified':'rectangular-red-dot');gun.updateMatrixWorld(true);gun.traverse(mesh=>{if(mesh.isMesh){assert.ok(mesh.geometry.attributes.position.count);const bounds=new THREE.Box3().setFromObject(mesh);for(const axis of ['x','y','z'])assert.ok(Number.isFinite(bounds.min[axis])&&Number.isFinite(bounds.max[axis]),weapon.id);}});gun.userData.dispose();}
});
test('reloads remove old magazine, reveal a fresh one, seat it, then charge',()=>{
 for(const {id} of WEAPONS){const removed=reloadPose(id,.29),gap=reloadPose(id,.39),fresh=reloadPose(id,.47),seated=reloadPose(id,.78),charge=reloadPose(id,.865),ready=reloadPose(id,1);assert.equal(removed.oldVisible,id!=='garand');assert.equal(gap.oldVisible,false);assert.equal(gap.newVisible,false);assert.equal(fresh.newVisible,true);assert.ok(Math.abs(fresh.newY)>.1);assert.equal(seated.seated,true);assert.ok(charge.bolt>.1);assert.equal(ready.bolt,0);assert.equal(ready.work,0);}
});
test('all five selectable arenas have distinct collision layouts and connected spawns',()=>{
 const layouts=new Set();for(const theme of ['dock','night','overpass','substation','quarry']){const w=createWorld(null,theme);layouts.add(JSON.stringify(w.boxes));assert.ok(w.nav.length>150,theme);for(const spawn of w.spawns){assert.ok(!w.boxes.some(b=>b.max.y>.2&&b.min.y<1.8&&spawn.x>b.min.x-.33&&spawn.x<b.max.x+.33&&spawn.z>b.min.z-.33&&spawn.z<b.max.z+.33),theme+' blocked spawn '+JSON.stringify(spawn));assert.ok(findPath(w.nav,spawn,{x:0,z:24}).length>0,theme+' disconnected spawn');}w.dispose();}assert.equal(layouts.size,5);
});
test('stairs lead onto raised platforms without colliding with their edges',()=>{
 for(const theme of ['dock','overpass','quarry']){const w=createWorld(null,theme),p=theme==='overpass'?makeBody(-7,-12.7):makeBody(-10.5,0);for(let i=0;i<620;i++){p.vx=theme==='overpass'?0:2;p.vz=theme==='overpass'?2:0;moveBody(p,1/120,w.boxes);}assert.ok(p.y>=2.95,theme+' stopped at '+JSON.stringify(p));w.dispose();}
});
