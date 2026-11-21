import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {lookVector,movementVector,damageAt} from '../scripts/physics.js';
const exported={};vm.runInNewContext(await readFile(new URL('../vendor/three.min.js',import.meta.url),'utf8'),{exports:exported,module:{exports:exported},console:{warn(){}}});
test('camera and bullet direction agree at every tested yaw and pitch',()=>{const camera=new exported.PerspectiveCamera(90,1,.1,100);for(const yaw of [-3,-1,0,1,3])for(const pitch of [-1.4,-.7,0,.7,1.4]){camera.rotation.set(pitch,yaw,0,'YXZ');const visual=camera.getWorldDirection(new exported.Vector3()),shot=lookVector(yaw,pitch);assert.ok(visual.dot(new exported.Vector3(shot.x,shot.y,shot.z))>.999999);}});
test('up, down, right and left follow normal FPS conventions',()=>{assert.ok(lookVector(0,.5).y>0);assert.ok(lookVector(0,-.5).y<0);assert.ok(lookVector(-.5,0).x>0);assert.ok(lookVector(.5,0).x<0);assert.ok(movementVector(0,1,0).z<0);assert.ok(movementVector(0,-1,0).z>0);assert.ok(movementVector(0,0,1).x>0);assert.ok(movementVector(0,0,-1).x<0);});
test('carbine and marksman headshots use intended damage',()=>{assert.equal(damageAt(27,10,30),27);assert.equal(damageAt(27,10,30,true),54);assert.equal(damageAt(68,10,65,true),136);});
