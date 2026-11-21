import {clamp,damp,makeBody,moveBody,accelerate,canStand,wallDistance,visible,rayBox,raySphere,damageAt,lookVector,movementVector,WEAPONS} from './physics.js?asset=619daff5b62f';
import {createWorld,findPath} from './world.js?asset=3405ee404ba2';
import {createWeapon,createSoldier} from './weapons.js?asset=38d0ac08eaa9';
import {SoundEngine} from './audio.js?asset=4ac14198dc7a';
const T=window.THREE,$=id=>document.getElementById(id),canvas=$('game');
const defaults={sens:1,adsSens:.65,touchSens:.9,invertY:false,fov:90,volume:65,quality:'medium',motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,numbers:true,showFps:true,primary:0};
let settings={...defaults};try{const s=JSON.parse(localStorage.getItem('zexra.settings.v1'));for(const k of Object.keys(defaults))if(typeof s?.[k]===typeof defaults[k])settings[k]=s[k];}catch{}
settings.sens=clamp(settings.sens,.3,3);settings.fov=clamp(settings.fov,70,110);settings.volume=clamp(settings.volume,0,100);settings.primary=clamp(Math.floor(settings.primary),0,3);if(!['low','medium','high'].includes(settings.quality))settings.quality='high';
const touch=matchMedia('(pointer:coarse)').matches;document.body.classList.toggle('touch',touch);
let renderer,world,camera,viewCamera,viewScene,gun,initialized=false;
const sound=new SoundEngine();
let state='menu',mode='skirmish',map='dock',difficulty='normal',primary=settings.primary,selectedSlot=0;
const player=makeBody(-22,-22);Object.assign(player,{hp:100,kills:0,deaths:0,heads:0,shots:0,hits:0,alive:true,invulnerable:0,grenades:2});
let yaw=0,pitch=0,lookX=0,lookY=0,ads=0,recoil=0,recoilYaw=0,gunKick=0,reload=0,reloadStage=0,nextFire=0,inspect=0,firePressed=false,aimPressed=false,lastFire=false,weaponSwap=0,sprintPose=0,pendingSlot=null,holster=0,throwAnim=0;
let inventory=[],bots=[],effects=[],grenades=[],time=300,clock=0,round=1,roundPause=0,respawn=0,announcementTime=0,killNoticeTime=0,hitTime=0,damageTime=0,footDistance=0,bob=0,eyeHeight=1.63;
let lastFrame=performance.now(),accumulator=0,fpsFrames=0,fpsTime=0,fps=60,hudTimer=0,menuTime=0,renderFrames=0,pointerError='',hadPointerLock=false,dragLook=false;
const keys=new Set(),touchMove={x:0,z:0};let touchAim=false,throwRequested=false,jumpQueued=false,slideQueued=false,aimMode=false;
const names=['VIPER','ROOK','NOMAD','ECHO','GHOST'];
const diffConfig={easy:{speed:3.5,reaction:1.05,spread:.09,interval:.27,count:3},normal:{speed:4.5,reaction:.62,spread:.042,interval:.20,count:5},hard:{speed:5.5,reaction:.32,spread:.023,interval:.15,count:5}};
const flashLight=new T.PointLight(0xffbd66,0,7);
const tmp=new T.Vector3(),tmp2=new T.Vector3(),direction=new T.Vector3(),viewTarget=new T.Vector3();
const effectGeometries={spark:new T.SphereGeometry(.035,5,4),shell:new T.CylinderGeometry(.014,.014,.055,6),grenade:new T.SphereGeometry(.095,10,8),smoke:new T.SphereGeometry(1,8,6)};
const effectMaterials={spark:new T.MeshBasicMaterial({color:0xffd389}),shell:new T.MeshStandardMaterial({color:0xb49b5c,metalness:.8,roughness:.4}),grenade:new T.MeshStandardMaterial({color:0x4c5949,roughness:.8}),impact:new T.MeshBasicMaterial({color:0x1a2122,transparent:true,opacity:.8}),tracer:new T.LineBasicMaterial({color:0xf8cd83,transparent:true,opacity:.4})};
function saveSettings(){try{localStorage.setItem('zexra.settings.v1',JSON.stringify(settings));}catch{}}
function fail(e){console.error(e);$('boot').hidden=true;$('fatal').hidden=false;$('fatalText').textContent='Renderer startup failed: '+e.message+'. Please enable WebGL and hardware acceleration.';}
function setup(){
 try{
  renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.autoClear=false;renderer.info.autoReset=false;
  camera=new T.PerspectiveCamera(settings.fov,innerWidth/innerHeight,.06,220);camera.rotation.order='YXZ';
  viewScene=new T.Scene();viewCamera=new T.PerspectiveCamera(65,innerWidth/innerHeight,.01,12);viewScene.add(new T.HemisphereLight(0xc6e2ed,0x5b6350,2.4));const keyLight=new T.DirectionalLight(0xffe5b9,3.5);keyLight.position.set(-2,3,1);viewScene.add(keyLight);viewScene.add(flashLight);
  loadWorld(map);equip(0);applyQuality();resize();initUI();initialized=true;$('boot').hidden=true;$('menu').hidden=false;requestAnimationFrame(frame);
 }catch(e){fail(e);}
}
function loadWorld(theme){
 clearEffects();for(const b of bots){world?.scene.remove(b.model.group);b.model.dispose();}bots=[];
 world?.dispose();world=createWorld(renderer,theme);viewScene.environment=world.scene.environment;renderer.toneMappingExposure=world.night?1.1:1.02;
}
function applyQuality(){if(!renderer)return;const q=settings.quality;renderer.setPixelRatio(Math.min(devicePixelRatio,q==='high'?1.3:q==='medium'?1:.75));renderer.shadowMap.enabled=q!=='low';world.sun.shadow.mapSize.set(q==='high'?2048:1024,q==='high'?2048:1024);world.sun.shadow.map?.dispose();world.sun.shadow.map=null;world.sun.shadow.needsUpdate=true;resize();}
function resize(){if(!renderer)return;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=viewCamera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();viewCamera.updateProjectionMatrix();}
function gunConfig(){return selectedSlot===2?{id:'knife',name:'TACTICAL KNIFE',damage:65,interval:.55,reload:0,mag:0,spread:0,recoil:0,range:2.4,pellets:1,zoom:settings.fov}:WEAPONS[selectedSlot===0?primary:4];}
function equip(slot,force=false){
 if(selectedSlot===slot&&gun&&!force)return;
 selectedSlot=slot;pendingSlot=null;holster=0;reload=0;inspect=0;ads=0;aimPressed=false;touchAim=false;weaponSwap=.22;lastFire=false;
 if(gun){viewScene.remove(gun);gun.userData.dispose();}gun=createWeapon(gunConfig().id);viewScene.add(gun);updateHUD();
}
function requestEquip(slot){if(slot===selectedSlot||pendingSlot!==null||throwAnim>0)return;reload=0;inspect=0;pendingSlot=slot;holster=.15;weaponSwap=.38;}
function freshInventory(){inventory=[WEAPONS[primary],WEAPONS[4]].map(w=>({ammo:w.mag,reserve:w.reserve}));}
function initUI(){
 $('modeGrid').querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.mode;$('modeGrid').querySelectorAll('button').forEach(b=>{const on=b===button;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});$('difficulty').disabled=mode==='range';});
 $('mapSelect').onchange=()=>{map=$('mapSelect').value;loadWorld(map);applyQuality();};$('difficulty').onchange=()=>difficulty=$('difficulty').value;
 $('launch').onclick=startMatch;$('playNav').onclick=()=>{$('launch').focus();};
 $('armoryBtn').onclick=$('changeWeapon').onclick=()=>openDialog('armoryDialog');$('settingsBtn').onclick=()=>openSettings();$('controlsBtn').onclick=()=>openDialog('controlsDialog');
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 $('pauseBtn').onclick=pause;$('resume').onclick=resume;$('restart').onclick=startMatch;$('pauseSettings').onclick=()=>openSettings();$('quit').onclick=showMenu;
 $('playAgain').onclick=startMatch;$('resultMenu').onclick=showMenu;
 document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{if(d.id==='pauseDialog'){e.preventDefault();resume();}}));
 for(const id of ['sens','adsSens','touchSens','invertY','fov','volume','quality','motion','numbers','showFps']){
  const el=$(id);if(el.type==='checkbox')el.checked=settings[id];else el.value=settings[id];
  el.addEventListener('input',()=>{settings[id]=el.type==='checkbox'?el.checked:el.tagName==='SELECT'?el.value:Number(el.value);saveSettings();updateSettingsUI();if(id==='volume')sound.setVolume(settings.volume/100);if(id==='quality')applyQuality();});
 }
 $('resetSettings').onclick=()=>{const oldPrimary=settings.primary;settings={...defaults,primary:oldPrimary};for(const id of ['sens','adsSens','touchSens','invertY','fov','volume','quality','motion','numbers','showFps']){const el=$(id);if(el.type==='checkbox')el.checked=settings[id];else el.value=settings[id];}saveSettings();updateSettingsUI();applyQuality();sound.setVolume(settings.volume/100);};
 updateSettingsUI();renderArmory();initTouch();
}
function updateSettingsUI(){$('sensValue').textContent=settings.sens.toFixed(2);$('adsSensValue').textContent=settings.adsSens.toFixed(2)+'×';$('touchSensValue').textContent=settings.touchSens.toFixed(2);$('fovValue').textContent=settings.fov+'°';$('volumeValue').textContent=settings.volume+'%';$('fps').hidden=!settings.showFps;}
function renderArmory(){
 $('weaponGrid').replaceChildren();WEAPONS.slice(0,4).forEach((w,i)=>{const b=document.createElement('button');b.className='weapon-card'+(i===primary?' selected':'');b.setAttribute('aria-pressed',String(i===primary));b.innerHTML=`<strong>${w.name}</strong><small>${w.caliber} · ${w.type}</small><p>${['Balanced firepower and control for sustained mid-range fights.','Lightweight and fast. Built for close-range pressure.','Heavy semi-automatic fire. Steady your aim and pick your moment.','Devastating up close. Use cover to close the distance.'][i]}</p><div class="stat">POWER<i><b style="width:${w.damage/70*100}%"></b></i></div><div class="stat">FIRE RATE<i><b style="width:${.06/w.interval*100}%"></b></i></div><div class="stat">RANGE<i><b style="width:${w.range/65*100}%"></b></i></div>`;b.onclick=()=>{primary=i;settings.primary=i;saveSettings();equip(0,true);renderArmory();};$('weaponGrid').append(b);});
 $('previewName').textContent=WEAPONS[primary].name;$('previewType').textContent=WEAPONS[primary].caliber+' / '+WEAPONS[primary].type;
}
function openDialog(id){$(id).showModal();}function openSettings(){openDialog('settingsDialog');}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function clearInput(){keys.clear();touchMove.x=touchMove.z=0;firePressed=aimPressed=touchAim=dragLook=false;jumpQueued=slideQueued=throwRequested=false;lookX=lookY=0;lastFire=false;}
async function lockPointer(){if(touch)return;try{await canvas.requestPointerLock();pointerError='';$('pointerHint').hidden=true;}catch(e){pointerError=e.message;$('pointerHint').hidden=false;}}
async function startMatch(){
 closeDialogs();clearInput();state='running';document.body.classList.add('playing');map=$('mapSelect').value;difficulty=$('difficulty').value;
 if(world.night!==(map==='night')){loadWorld(map);applyQuality();}else{clearEffects();for(const b of bots){world.scene.remove(b.model.group);b.model.dispose();}bots=[];}
 Object.assign(player,{hp:100,kills:0,deaths:0,heads:0,shots:0,hits:0,alive:true,grenades:2});clock=0;time=mode==='duel'?90:300;round=1;roundPause=respawn=throwAnim=0;nextFire=0;reload=0;recoil=recoilYaw=gunKick=0;freshInventory();equip(0,true);spawnPlayer(true);
 const count=mode==='range'?6:mode==='duel'?1:diffConfig[difficulty].count;
 for(let i=0;i<count;i++){
  const model=createSoldier(i),p=world.spawns[(i+1)%world.spawns.length],b={...makeBody(p.x,p.z),hp:100,alive:true,kills:0,deaths:0,name:names[i%names.length],model,phase:i,think:Math.random()*.3,shotCD:.5+Math.random(),path:[],pathTime:0,goal:null,target:null,seen:0,fireTime:0,respawn:0,invulnerable:1,hitFlash:0,stationary:mode==='range',yaw:0};
  if(mode==='range'){b.x=-16+i*6;b.z=-13;b.y=0;b.invulnerable=0;}bots.push(b);world.scene.add(model.group);
 }
 $('menu').hidden=true;$('hud').hidden=false;$('touch').hidden=!touch;$('feed').replaceChildren();$('modeLabel').textContent={skirmish:'SKIRMISH',duel:'DUEL',range:'FREE RANGE'}[mode];$('objective').textContent=mode==='duel'?'FIRST TO FIVE ROUNDS':mode==='range'?'MOVING TARGETS · UNLIMITED RESERVES':'FIRST TO 25 ELIMINATIONS';$('locationLabel').textContent=map==='night'?'NIGHTSHIFT':'DRYDOCK';
 announce(mode==='range'?'FREE RANGE':mode==='duel'?'ROUND 1':'SKIRMISH',touch?'Left stick to move. Drag right to look. Aim, then fire.':'WASD MOVE · SHIFT SPRINT · CTRL SLIDE · RIGHT MOUSE AIM',3);
 sound.start().then(()=>sound.setVolume(settings.volume/100)).catch(()=>{});sound.pause(false);updateHUD();await lockPointer();
}
function spawnPlayer(initial=false){
 let chosen=world.spawns[0];if(!initial){let best=-Infinity;for(const s of world.spawns){let dist=Math.min(...bots.filter(b=>b.alive).map(b=>Math.hypot(s.x-b.x,s.z-b.z)),100);if(dist>best){best=dist;chosen=s;}}}
 Object.assign(player,makeBody(chosen.x,chosen.z),{hp:100,alive:true,invulnerable:mode==='range'?0:1.8,grenades:2});yaw=Math.atan2(chosen.x,chosen.z);pitch=0;freshInventory();reload=0;recoil=0;eyeHeight=1.63;equip(selectedSlot,true);respawn=0;footDistance=0;
}
function showMenu(){state='menu';$('scope').hidden=true;document.body.classList.remove('playing');closeDialogs();clearInput();document.exitPointerLock?.();$('menu').hidden=false;$('hud').hidden=true;$('touch').hidden=true;gun.visible=true;clearEffects();for(const b of bots){world.scene.remove(b.model.group);b.model.dispose();}bots=[];equip(0,true);sound.pause(true);}
function pause(){if(state!=='running')return;state='paused';document.body.classList.remove('playing');clearInput();document.exitPointerLock?.();$('touch').hidden=true;closeDialogs();$('pauseDialog').showModal();sound.pause(true);}
async function resume(){if(state!=='paused')return;closeDialogs();clearInput();state='running';document.body.classList.add('playing');$('touch').hidden=!touch;sound.start().catch(()=>{});sound.pause(false);await lockPointer();}
function endMatch(reason){state='results';document.body.classList.remove('playing');clearInput();document.exitPointerLock?.();$('touch').hidden=true;closeDialogs();$('resultTitle').textContent=reason;$('resultSubtitle').textContent=(map==='night'?'NIGHTSHIFT':'DRYDOCK')+' · '+({skirmish:'SKIRMISH',duel:'DUEL',range:'FREE RANGE'}[mode]);$('resultKills').textContent=player.kills;$('resultDeaths').textContent=player.deaths;$('resultAccuracy').textContent=(player.shots?Math.round(player.hits/player.shots*100):0)+'%';$('resultHeads').textContent=player.heads;$('resultDialog').showModal();sound.pause(true);}
function announce(title,sub='',duration=2){$('announcement').firstElementChild.textContent=title;$('announcement').lastElementChild.textContent=sub;announcementTime=duration;}
function feed(killer,victim,weapon,head=false){const el=document.createElement('div');el.className=killer==='YOU'?'player':'';const a=document.createElement('b');a.textContent=killer;const em=document.createElement('em');em.textContent=weapon+(head?' / HS':'');el.append(a,em,document.createTextNode(victim));$('feed').prepend(el);while($('feed').children.length>5)$('feed').lastChild.remove();setTimeout(()=>el.remove(),6500);}
function requestReload(){if(!player.alive||selectedSlot===2||reload>0||weaponSwap>0)return;const w=gunConfig(),inv=inventory[selectedSlot];if(!inv||inv.ammo>=w.mag||inv.reserve<=0)return;reload=w.reload;reloadStage=0;inspect=0;aimPressed=touchAim=false;sound.reload(0);}
function requestGrenade(){if(!player.alive||player.grenades<=0||reload>0||roundPause>0||throwAnim>0||pendingSlot!==null)return;throwAnim=.65;inspect=0;aimPressed=touchAim=false;}
function throwGrenade(){
 if(!player.alive||player.grenades<=0||reload>0||roundPause>0)return;player.grenades--;const dir=aimDirection(0),o=eye();const mesh=new T.Mesh(effectGeometries.grenade,effectMaterials.grenade);mesh.position.set(o.x+dir.x*.5,o.y-.15,o.z+dir.z*.5);world.scene.add(mesh);grenades.push({mesh,v:new T.Vector3(dir.x*15+player.vx*.5,dir.y*15+4,dir.z*15+player.vz*.5),life:1.7,bounces:0,owner:player});sound.reload(0);weaponSwap=.23;
}
function eye(){return{x:player.x,y:player.y+eyeHeight,z:player.z};}
function aimDirection(spread=0,fromYaw=yaw,fromPitch=pitch){const y=fromYaw+recoilYaw+(Math.random()-.5)*spread,p=fromPitch+recoil+(Math.random()-.5)*spread,v=lookVector(y,p);return new T.Vector3(v.x,v.y,v.z);}
function wallHit(o,d,max=180){return wallDistance(o,d,world.boxes,max);}
function bodyHit(o,d,actor){const height=actor.height||1.8;let t=raySphere(o,d,{x:actor.x,y:actor.y+height-.15,z:actor.z},.22),head=true;const torso=rayBox(o,d,{min:{x:actor.x-.32,y:actor.y+.12,z:actor.z-.27},max:{x:actor.x+.32,y:actor.y+height-.32,z:actor.z+.27}});if(torso<t){t=torso;head=false;}return{t,head};}
function shoot(){
 if(!player.alive||reload>0||weaponSwap>0||throwAnim>0||clock<nextFire||roundPause>0)return;const w=gunConfig(),inv=inventory[selectedSlot];
 if(selectedSlot!==2&&inv.ammo<=0){requestReload();return;}
 nextFire=clock+w.interval;inspect=0;player.invulnerable=0;
 if(selectedSlot===2){sound.knife();gunKick=.15;let best=null,dist=2.4;for(const b of bots){if(!b.alive)continue;const dx=b.x-player.x,dz=b.z-player.z,l=Math.hypot(dx,dz),dot=(-Math.sin(yaw)*dx-Math.cos(yaw)*dz)/Math.max(l,.01);if(l<dist&&dot>.55&&visible(eye(),{x:b.x,y:b.y+1.2,z:b.z},world.boxes)){best=b;dist=l;}}if(best){applyDamage(best,w.damage,player,false,'TACTICAL KNIFE');sound.hit();hitTime=.15;}return;}
 inv.ammo--;player.shots++;gunKick=1;gun.userData.flash.visible=true;gun.userData.light.intensity=2;sound.shot(w.id);
 for(const b of bots)if(b.alive&&Math.hypot(b.x-player.x,b.z-player.z)<32){b.lastKnown={x:player.x,z:player.z};b.memory=4;b.pathTime=0;}
 const o=eye(),speed=Math.hypot(player.vx,player.vz),spread=w.spread*(ads>.8?.12:1)*(player.grounded?1:2.5)*(speed>4?1.7:1)*(player.height<1.5?.7:1);let hitAny=false;
 const damages=new Map();
 for(let i=0;i<w.pellets;i++){
  const dir=aimDirection(spread),wall=wallHit(o,dir),maxRange=selectedSlot===2?2.4:wall;let best=null,t=maxRange,head=false;
  for(const b of bots){if(!b.alive||b.invulnerable>0)continue;const h=bodyHit(o,dir,b);if(h.t<t){best=b;t=h.t;head=h.head;}}
  const end=new T.Vector3(o.x+dir.x*t,o.y+dir.y*t,o.z+dir.z*t);if(best){const damage=damageAt(w.damage,t,w.range,head),prev=damages.get(best)||{value:0,head:false};prev.value+=damage;prev.head=prev.head||head;damages.set(best,prev);hitAny=true;}else if(wall<180)impact(end,dir);
  if(i===0)tracer(new T.Vector3(o.x+dir.x*.5,o.y-.14,o.z+dir.z*.5),end);
 }
 for(const [target,h] of damages){applyDamage(target,h.value,player,h.head,w.name);if(settings.numbers)damageNumber(h.value,h.head);sound.hit(h.head);hitTime=.13;$('hitmarker').style.color=h.head?'#80d5ff':'#ffffff';}
 if(hitAny)player.hits++;
 recoil+=w.recoil*(ads>.8?.68:1);recoilYaw+=(Math.random()-.5)*w.recoil*.65;pitch=clamp(pitch+w.recoil*.2,-1.45,1.45);
 if(settings.quality!=='low')ejectShell();updateHUD();
}
function damageNumber(value,head){const div=document.createElement('div');div.textContent=String(value);div.style.marginLeft=(18+Math.random()*20)+'px';if(head)div.style.color='#80d5ff';$('damageNumbers').append(div);setTimeout(()=>div.remove(),700);}
function applyDamage(target,damage,attacker,head=false,weapon='XR-416'){
 if(!target.alive||target.invulnerable>0)return;target.hp=Math.max(0,target.hp-damage);
 if(target===player){damageTime=.75;const a=Math.atan2(attacker.x-player.x,attacker.z-player.z);$('damageDirection').style.transform=`rotate(${(-a-yaw)*180/Math.PI+180}deg)`;}else{target.hitFlash=.12;target.threat=attacker;target.lastKnown={x:attacker.x,z:attacker.z};target.memory=5;target.think=0;target.pathTime=0;}
 if(target.hp>0)return;target.alive=false;target.deaths++;
 const suicide=attacker===target;
 if(!suicide)attacker.kills++;
 else if(mode==='duel')bots[0].kills++;
 if(attacker===player&&!suicide){if(head)player.heads++;$('killNotice').textContent=(head?'HEADSHOT / ':'ELIMINATIONS / ')+target.name;killNoticeTime=2.2;}
 feed(attacker===player?'YOU':attacker.name,target===player?'YOU':target.name,weapon,head);
 if(target===player){player.alive=false;respawn=2.5;reload=0;clearInput();announce('ELIMINATED',mode==='duel'?'Preparing the next round':'Redeploying shortly',2.5);}else{target.respawn=mode==='range'?1.4:3;target.model.group.visible=false;}
 if(mode==='duel'){
  roundPause=3;if(player.kills>=5||bots[0].kills>=5){endMatch(player.kills>=5?'DUEL VICTORY':'DUEL COMPLETE');return;}
  announce(attacker===player&&!suicide?'ROUND WON':'ROUND LOST',`${player.kills} : ${bots[0].kills} · NEXT ROUND STARTING`,3);
 }else if(mode==='skirmish'&&(player.kills>=25||bots.some(b=>b.kills>=25)))endMatch(player.kills>=25?'VICTORY':'MATCH COMPLETE');
 updateHUD();
}
function botSpawn(b){
 const alive=[player,...bots].filter(a=>a!==b&&a.alive);let s=world.spawns[1],score=-1;
 for(const candidate of world.spawns){const dist=Math.min(...alive.map(a=>Math.hypot(a.x-candidate.x,a.z-candidate.z)),100);if(dist>score){score=dist;s=candidate;}}
 if(mode==='range'){s={x:-16+b.phase*6,z:-13};}
 Object.assign(b,makeBody(s.x,s.z),{hp:100,alive:true,invulnerable:mode==='range'?0:1.5,shotCD:.7,path:[],target:null,seen:0,pathTime:0,fireTime:0});b.model.group.visible=true;
}
function updateBots(dt){
 const cfg=diffConfig[difficulty];
 for(const b of bots){
  if(!b.alive){b.respawn-=dt;if(b.respawn<=0)botSpawn(b);continue;}
  b.invulnerable=Math.max(0,b.invulnerable-dt);b.hitFlash=Math.max(0,b.hitFlash-dt);b.shotCD-=dt;b.fireTime=Math.max(0,b.fireTime-dt);
  if(mode==='range'){b.x=-16+b.phase*6+Math.sin(clock*(.55+b.phase*.06)+b.phase)*1.8;b.yaw=Math.PI;animateBot(b,dt,true);continue;}
  b.think-=dt;b.pathTime-=dt;
  const o={x:b.x,y:b.y+1.6,z:b.z};
  if(b.think<=0){
   b.think=.10+Math.random()*.07;let closest=null,distance=48;
   for(const a of [player,...bots]){if(a===b||!a.alive||a.invulnerable>0)continue;const l=Math.hypot(a.x-b.x,a.z-b.z)*(a===b.threat?.6:a===b.target?.8:1);if(l<distance&&visible(o,{x:a.x,y:a.y+(a.height||1.8)*.7,z:a.z},world.boxes)){closest=a;distance=l;}}
   if(closest){if(b.target!==closest)b.seen=0;b.target=closest;b.lastKnown={x:closest.x,z:closest.z};b.memory=3;}else{b.memory=Math.max(0,(b.memory||0)-b.think);b.target=null;b.seen=0;}
  }
  let dx=0,dz=0;
  if(b.target?.alive){
   b.seen+=dt;const target=b.target,tx=target.x-b.x,tz=target.z-b.z,dist=Math.hypot(tx,tz);b.yaw=Math.atan2(-tx,-tz);b.lastKnown={x:target.x,z:target.z};b.memory=4;
   if(dist>15){dx=tx/dist;dz=tz/dist;}else if(dist<7){dx=-tx/dist;dz=-tz/dist;}
   const strafe=Math.sin(clock*1.7+b.phase)>.1?1:-1;dx+=tz/Math.max(dist,.1)*strafe*.65;dz-=tx/Math.max(dist,.1)*strafe*.65;
   if(b.seen>cfg.reaction&&b.shotCD<=0&&visible(o,{x:target.x,y:target.y+(target.height||1.8)*.7,z:target.z},world.boxes)){
    b.shotCD=cfg.interval+Math.random()*.1;b.fireTime=.05;
    const height=target.height||1.8,aimY=target.y+(Math.random()<.12?height-.15:height*.65),dir=new T.Vector3(target.x-b.x,aimY-o.y,target.z-b.z).normalize();dir.x+=(Math.random()-.5)*cfg.spread;dir.y+=(Math.random()-.5)*cfg.spread;dir.z+=(Math.random()-.5)*cfg.spread;dir.normalize();let t=wallHit(o,dir),hit=null,head=false;
    for(const a of [player,...bots]){if(a===b||!a.alive||a.invulnerable>0)continue;const h=bodyHit(o,dir,a);if(h.t<t){t=h.t;hit=a;head=h.head;}}
    const end=new T.Vector3(o.x+dir.x*t,o.y+dir.y*t,o.z+dir.z*t);tracer(new T.Vector3(o.x,o.y-.25,o.z),end);
    const distanceToPlayer=Math.hypot(b.x-player.x,b.z-player.z);if(distanceToPlayer<55)sound.shot('carbine',o,!visible(eye(),o,world.boxes));
    if(hit)applyDamage(hit,damageAt(difficulty==='easy'?13:difficulty==='hard'?19:16,t,25,head),b,head);else if(t<180)impact(end,dir);
   }
  }else{
   if(b.pathTime<=0||!b.path.length){b.pathTime=2+Math.random();const goal=b.memory>0?b.lastKnown:world.nav[Math.floor(Math.random()*world.nav.length)];b.path=findPath(world.nav,b,goal);}
   if(b.path.length){const n=b.path[0],x=n.x-b.x,z=n.z-b.z,l=Math.hypot(x,z);if(l<.5)b.path.shift();else{dx=x/l;dz=z/l;b.yaw=Math.atan2(-dx,-dz);}}
  }
  // Steer around waist-high cover even when the target's upper body is visible.
  const moveLength=Math.hypot(dx,dz);
  if(moveLength>.01){const forward={x:dx/moveLength,y:0,z:dz/moveLength};if(wallDistance({x:b.x,y:b.y+.45,z:b.z},forward,world.boxes,1.1)<1.1){
    if(b.pathTime<=0||!b.path.length){b.path=findPath(world.nav,b,b.lastKnown||world.nav[Math.floor(Math.random()*world.nav.length)]);b.pathTime=1;}
    if(b.path.length){const n=b.path[0],x=n.x-b.x,z=n.z-b.z,l=Math.hypot(x,z);if(l<.45)b.path.shift();else{dx=x/l;dz=z/l;}}
    else{dx=forward.z*(b.phase%2?1:-1);dz=-forward.x*(b.phase%2?1:-1);}
  }}
  const oldX=b.x,oldZ=b.z;accelerate(b,dx,dz,cfg.speed,dt);moveBody(b,dt,world.boxes);
  if(Math.hypot(b.x-oldX,b.z-oldZ)<.003&&moveLength>.1)b.stuck=(b.stuck||0)+dt;else b.stuck=0;
  if(b.stuck>.55){b.path=[];b.pathTime=0;b.goal=null;b.target=null;b.think=.25;b.stuck=0;b.vx=(b.phase%2?1:-1)*3;b.vz=(b.phase%3?1:-1)*3;}
  animateBot(b,dt);
 }
}
function animateBot(b,dt,practice=false){
 const g=b.model.group;g.position.set(b.x,b.y,b.z);g.rotation.y=b.yaw;g.visible=b.alive;
 const speed=practice?2:Math.hypot(b.vx,b.vz),swing=Math.sin(clock*speed*2.8+b.phase)*Math.min(speed*.10,.5);b.model.limbs[0].rotation.x=swing;b.model.limbs[1].rotation.x=-swing;b.model.flash.visible=b.fireTime>0;
 if(b.hitFlash>0)g.scale.set(1.025,.99,1.025);else g.scale.set(1,1,1);
}
function updatePlayer(dt){
 player.invulnerable=Math.max(0,player.invulnerable-dt);player.slideCD=Math.max(0,player.slideCD-dt);
 if(!player.alive){respawn-=dt;if(respawn<=0&&mode!=='duel'){spawnPlayer();announce('REDEPLOYED','SPAWN PROTECTION · Firing removes protection',1.8);}return;}
 const crouch=keys.has('ControlLeft')||keys.has('ControlRight')||keys.has('KeyC')||keys.has('TouchCrouch');
 const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight')||(touch&&Math.hypot(touchMove.x,touchMove.z)>.8);
 let f=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)+touchMove.z,r=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+touchMove.x;
 const length=Math.hypot(f,r);if(length>1){f/=length;r/=length;}
 const move=movementVector(yaw,f,r),dx=move.x,dz=move.z;
 if(slideQueued){slideQueued=false;if(player.grounded&&sprint&&Math.hypot(player.vx,player.vz)>5&&player.slideCD<=0){player.slide=.8;player.slideCD=1.2;const l=Math.hypot(player.vx,player.vz);player.vx=player.vx/l*12;player.vz=player.vz/l*12;sound.noise(.5,.13,1200);}}
 player.slide=Math.max(0,player.slide-dt);
 const low=crouch||player.slide>0;player.height=low?1.12:canStand(player,world.boxes)?1.8:1.12;
 if(jumpQueued){player.jumpBuffer=.14;jumpQueued=false;}else player.jumpBuffer=Math.max(0,player.jumpBuffer-dt);
 if(player.jumpBuffer>0&&player.coyote>0&&canStand(player,world.boxes)){player.vy=8.3;player.grounded=false;player.coyote=0;player.jumpBuffer=0;player.slide=0;sound.jump();}
 if(player.slide>0){player.vx*=Math.exp(-1.0*dt);player.vz*=Math.exp(-1.0*dt);player.vx+=dx*5*dt;player.vz+=dz*5*dt;}
 else accelerate(player,dx,dz,ads>.5?3:low?2.7:sprint?8.2:5.5,dt,!player.grounded);
 const wasGround=player.grounded,vFall=player.vy,oldX=player.x,oldZ=player.z;moveBody(player,dt,world.boxes);
 if(!wasGround&&player.grounded&&vFall< -3){sound.step(player.y>.5,null,true);if(settings.motion)gunKick=Math.max(gunKick,.25);}
 const distance=Math.hypot(player.x-oldX,player.z-oldZ);bob+=distance;footDistance+=distance;
 if(player.grounded&&player.slide<=0&&footDistance>(sprint?1.95:1.65)){footDistance=0;sound.step(player.y>.5,null,sprint);}
 eyeHeight=damp(eyeHeight,player.height===1.8?1.63:.99,14,dt);
 if(throwAnim>0){const previous=throwAnim;throwAnim=Math.max(0,throwAnim-dt);if(previous>.38&&throwAnim<=.38)throwGrenade();}
 if(throwRequested){throwRequested=false;requestGrenade();}
 if(firePressed&&(gunConfig().auto||!lastFire))shoot();lastFire=firePressed;
 if(selectedSlot!==2&&inventory[selectedSlot]?.ammo===0&&reload<=0&&clock>nextFire+.25)requestReload();
 if(reload>0){
  reload-=dt;const w=gunConfig(),progress=1-reload/w.reload;
  if(reloadStage===0&&progress>.42){sound.reload(1);reloadStage=1;}if(reloadStage===1&&progress>.82){sound.reload(2);reloadStage=2;}
  if(reload<=0){const inv=inventory[selectedSlot],amount=Math.min(w.mag-inv.ammo,inv.reserve);inv.ammo+=amount;inv.reserve-=amount;if(mode==='range')inv.reserve=w.reserve;reload=0;}
 }
 if(mode==='range')player.grenades=2;
}
function updateGrenades(dt){
 for(let i=grenades.length-1;i>=0;i--){const g=grenades[i];g.life-=dt;g.v.y-=17*dt;const old=g.mesh.position.clone(),delta=g.v.clone().multiplyScalar(dt),l=delta.length(),dir=delta.clone().normalize(),t=wallHit(old,dir,l+.1);
  if(t<l+.1){g.v.x*=-.55;g.v.z*=-.55;g.v.y=Math.abs(g.v.y)*.5;g.bounces++;if(g.bounces<5)sound.reload(0);}else g.mesh.position.add(delta);
  if(g.mesh.position.y<.12){g.mesh.position.y=.12;g.v.y=Math.abs(g.v.y)*.42;g.v.x*=.8;g.v.z*=.8;}
  g.mesh.rotation.x+=dt*7;g.mesh.rotation.z+=dt*4;
  if(g.life<=0){explode(g.mesh.position,g.owner);world.scene.remove(g.mesh);grenades.splice(i,1);}
 }
}
function explode(position,owner){
 const p=position.clone();sound.grenade(p,!visible(eye(),p,world.boxes));
 const light=new T.PointLight(0xffaa50,35,13,2);light.position.copy(p);world.scene.add(light);effects.push({mesh:light,life:.25,total:.25,type:'light'});
 for(let i=0;i<16;i++){const mesh=new T.Mesh(effectGeometries.spark,effectMaterials.spark);mesh.position.copy(p);world.scene.add(mesh);effects.push({mesh,life:.4+Math.random()*.4,total:1,type:'spark',v:new T.Vector3((Math.random()-.5)*12,Math.random()*9,(Math.random()-.5)*12)});}
 if(settings.quality!=='low')for(let i=0;i<5;i++){const material=new T.MeshBasicMaterial({color:0x6e726c,transparent:true,opacity:.24,depthWrite:false});const mesh=new T.Mesh(effectGeometries.smoke,material);mesh.position.copy(p);mesh.position.y+=.5;world.scene.add(mesh);effects.push({mesh,life:1.5,total:1.5,type:'smoke',v:new T.Vector3((Math.random()-.5)*1.5,.8,(Math.random()-.5)*1.5),ownMaterial:true});}
 if(mode==='range')owner=player;
 for(const a of [player,...bots]){if(!a.alive)continue;const d=Math.hypot(a.x-p.x,a.y+.9-p.y,a.z-p.z);if(d>7)continue;const target={x:a.x,y:a.y+.9,z:a.z};if(!visible({x:p.x,y:p.y+.2,z:p.z},target,world.boxes))continue;const damage=Math.round(125*(1-d/8));applyDamage(a,damage,owner,false,'GRENADE');}
 if(Math.hypot(player.x-p.x,player.z-p.z)<10&&settings.motion)gunKick=1;
}
function tracer(from,to){if(effects.length>110)return;const dir=to.clone().sub(from),length=dir.length();if(length>65)to.copy(from).add(dir.normalize().multiplyScalar(65));const geo=new T.BufferGeometry().setFromPoints([from,to]),line=new T.Line(geo,effectMaterials.tracer);world.scene.add(line);effects.push({mesh:line,life:.045,total:.045,type:'tracer',ownGeometry:true});}
function impact(point,dir){if(effects.length>110)return;for(let i=0;i<(settings.quality==='low'?1:3);i++){const mesh=new T.Mesh(effectGeometries.spark,effectMaterials.spark);mesh.position.copy(point).addScaledVector(dir,-.03);world.scene.add(mesh);effects.push({mesh,life:.13+Math.random()*.1,total:.25,type:'spark',v:new T.Vector3((Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*3)});}}
function ejectShell(){if(effects.length>110)return;const mesh=new T.Mesh(effectGeometries.shell,effectMaterials.shell);mesh.position.set(player.x+Math.cos(yaw)*.28,player.y+eyeHeight-.2,player.z-Math.sin(yaw)*.28);world.scene.add(mesh);effects.push({mesh,life:1.2,total:1.2,type:'shell',v:new T.Vector3(Math.cos(yaw)*2+player.vx*.2,2.2,-Math.sin(yaw)*2+player.vz*.2)});}
function removeEffect(e){world.scene.remove(e.mesh);if(e.ownGeometry)e.mesh.geometry.dispose();if(e.ownMaterial)e.mesh.material.dispose();}
function clearEffects(){if(world){effects.forEach(removeEffect);grenades.forEach(g=>world.scene.remove(g.mesh));}effects=[];grenades=[];}
function updateEffects(dt){
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){removeEffect(e);effects.splice(i,1);continue;}
  if(e.type==='light')e.mesh.intensity=35*e.life/e.total;
  if(e.v){e.mesh.position.addScaledVector(e.v,dt);if(e.type!=='smoke')e.v.y-=14*dt;if(e.mesh.position.y<.03){e.mesh.position.y=.03;e.v.y=Math.abs(e.v.y)*.25;e.v.x*=.7;e.v.z*=.7;}if(e.type==='shell'){e.mesh.rotation.x+=dt*13;e.mesh.rotation.z+=dt*8;}if(e.type==='smoke'){e.mesh.scale.setScalar(1+(1-e.life/e.total)*2.5);e.mesh.material.opacity=.24*e.life/e.total;}}
 }
}
function tick(dt){
 clock+=dt;nextFire=Math.max(nextFire,clock-1);hitTime=Math.max(0,hitTime-dt);damageTime=Math.max(0,damageTime-dt);announcementTime=Math.max(0,announcementTime-dt);killNoticeTime=Math.max(0,killNoticeTime-dt);weaponSwap=Math.max(0,weaponSwap-dt);inspect=Math.max(0,inspect-dt);
 if(pendingSlot!==null){holster-=dt;if(holster<=0)equip(pendingSlot,true);}
 if(roundPause>0){roundPause-=dt;if(roundPause<=0){round++;time=90;spawnPlayer(true);botSpawn(bots[0]);announce('ROUND '+round+'','FIRST TO FIVE ROUNDS',1.6);}return;}
 if(mode!=='range'){time-=dt;if(time<=0){if(mode==='duel'){roundPause=3;round--;announce('ROUND DRAW','TIME LIMIT · REDEPLOYING',3);}else{const best=Math.max(0,...bots.map(b=>b.kills));endMatch(player.kills>best?'VICTORY':player.kills===best?'DRAW':'MATCH COMPLETE');}return;}}
 updatePlayer(dt);if(state!=='running')return;updateBots(dt);if(state!=='running')return;updateGrenades(dt);updateEffects(dt);
}
function updateHUD(){
 if(!initialized)return;
 $('health').textContent=Math.ceil(player.hp);$('healthBar').style.width=player.hp+'%';$('healthBar').style.background=player.hp<30?'#ef9378':'#80d5ff';
 const w=gunConfig(),inv=inventory[selectedSlot];$('ammo').textContent=selectedSlot===2?'—':inv?.ammo??w.mag;$('reserve').textContent=selectedSlot===2?'—':mode==='range'?'∞':inv?.reserve??w.reserve;
 $('ammo').style.color=inv?.ammo<=5?'#f3a187':'';$('weaponName').textContent=w.name+' / '+(selectedSlot===2?'MELEE':w.caliber);$('grenades').textContent=player.grenades;
 for(let i=0;i<3;i++)$('slot'+i).classList.toggle('active',i===selectedSlot);
 $('yourScore').textContent=String(player.kills).padStart(2,'0');$('enemyScore').textContent=String(Math.max(0,...bots.map(b=>b.kills))).padStart(2,'0');$('timer').textContent=mode==='range'?'∞':`${Math.floor(Math.max(0,time)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,time)%60).toString().padStart(2,'0')}`;
 $('reloadLabel').textContent=reload>0?'RELOADING…':selectedSlot!==2&&inv?.ammo===0?'PRESS R TO RELOAD':'';$('reloadTrack').style.display=reload>0?'block':'none';if(reload>0)$('reloadTrack').firstElementChild.style.width=(1-reload/w.reload)*100+'%';
 $('movementState').textContent=player.slide>0?'SLIDE':!player.grounded?'AIR':player.height<1.5?'CROUCH':Math.hypot(player.vx,player.vz)>6?'SPRINT':'READY';
 $('spawnProtection').style.opacity=player.invulnerable>0?'1':'0';$('fps').textContent=fps+' FPS';
}
function updateView(dt){
 recoil=damp(recoil,0,10,dt);recoilYaw=damp(recoilYaw,0,10,dt);gunKick=damp(gunKick,0,18,dt);ads=damp(ads,((aimPressed||touchAim)&&reload<=0&&player.alive&&selectedSlot!==2)?1:0,15,dt);
 const w=gunConfig();camera.fov=damp(camera.fov,settings.fov+(w.zoom-settings.fov)*ads,13,dt);camera.updateProjectionMatrix();
 if(state==='menu'){
  menuTime+=dt;camera.position.set(-16+Math.sin(menuTime*.07)*1.5,5.3,20);camera.lookAt(3,2,-6);
  viewCamera.fov=52;viewCamera.updateProjectionMatrix();gun.position.set(.38,-.02,-1.6);gun.rotation.set(.08+Math.sin(menuTime*.5)*.015,-1.05,-.08);gun.scale.setScalar(.85);gun.visible=innerWidth>600;gun.userData.flash.visible=false;gun.userData.light.intensity=0;return;
 }
 const scoped=w.id==='marksman'&&ads>.84;gun.visible=player.alive&&!scoped;$('scope').hidden=!scoped;gun.scale.setScalar(1);viewCamera.fov=65;viewCamera.updateProjectionMatrix();
 camera.position.set(player.x,player.y+eyeHeight,player.z);camera.rotation.set(pitch+recoil,yaw+recoilYaw,0,'YXZ');
 const moving=Math.min(Math.hypot(player.vx,player.vz)/6,1),motion=settings.motion?1:0,wave=Math.sin(bob*7),sway=clamp(lookX*.0005,-.035,.035)*motion;
 const aimX=0,aimY=-gun.userData.sightY,aimZ=w.id==='pistol'?-.48:-.68;
 gun.position.set(damp(.24,aimX,ads*8,1),damp(-.27,aimY,ads*8,1),damp(-.76,aimZ,ads*8,1));
 gun.position.x+=Math.cos(bob*3.5)*.009*moving*(1-ads)*motion-sway;gun.position.y+=Math.abs(wave)*.012*moving*(1-ads)*motion;gun.position.z+=gunKick*.055;
 gun.rotation.set(gunKick*.07,0,Math.sin(bob*3.5)*.012*moving*(1-ads)*motion);
 if(player.slide>0){gun.rotation.z-=.12*(1-ads)*motion;gun.position.y-=.04;}
 const support=gun.userData.supportArm;if(support){support.position.set(0,0,0);support.rotation.set(0,0,0);}
 if(reload>0){const progress=1-reload/w.reload,curve=Math.sin(progress*Math.PI),work=T.MathUtils.smoothstep(progress,.06,.25)*(1-T.MathUtils.smoothstep(progress,.76,.97)),drop=T.MathUtils.smoothstep(progress,.16,.34)*(1-T.MathUtils.smoothstep(progress,.53,.76));gun.rotation.z=-.4*work;gun.rotation.x=.2*work;gun.position.y-=work*.07;gun.userData.mag.position.y=-drop*.33;gun.userData.mag.position.z=drop*.07;gun.userData.mag.rotation.x=-.16*drop;if(support){support.position.set(-.02*work,-.06*work-drop*.1,.34*work);support.rotation.x=.28*work;}}else{gun.userData.mag.position.set(0,0,0);gun.userData.mag.rotation.x=0;}
 sprintPose=damp(sprintPose,moving>.9&&Math.hypot(player.vx,player.vz)>6&&!firePressed&&ads<.1&&reload<=0?1:0,10,dt);gun.rotation.x+=sprintPose*.18;gun.rotation.z-=sprintPose*.18;gun.position.y-=sprintPose*.07;
 if(throwAnim>0){const curve=Math.sin((.65-throwAnim)/.65*Math.PI);gun.rotation.x+=curve*.45;gun.rotation.z-=curve*.25;gun.position.y-=curve*.28;if(support){support.rotation.x-=curve*1.3;support.position.z-=curve*.12;}}
 if(inspect>0){const curve=Math.sin(inspect/1.8*Math.PI);gun.rotation.y=.9*curve;gun.rotation.z=.25*curve;gun.position.x-=.13*curve;}
 if(selectedSlot===2&&gunKick>.01){gun.rotation.z=-gunKick*1.4;gun.rotation.y=gunKick*.8;gun.position.x-=gunKick*.3;}
 if(weaponSwap>0){const amount=pendingSlot!==null?(.15-holster)*3:weaponSwap*2;gun.position.y-=amount;gun.rotation.x+=amount*.5;}
 gun.userData.bolt.position.z=gunKick*.04;gun.userData.flash.visible=gunKick>.6&&selectedSlot!==2;gun.userData.flash.rotation.z=Math.random()*Math.PI;gun.userData.light.intensity=gunKick>.6?1.5:0;
 if(settings.motion&&ads<.5&&player.grounded)camera.position.y+=Math.sin(bob*7)*.012*moving;
 sound.update(camera.position,yaw,pitch);
 $('crosshair').classList.toggle('aim',ads>.7);$('crosshair').style.opacity=player.alive&&!scoped&&(selectedSlot===2||ads<.9)?'1':'0';$('crosshair').style.setProperty('--gap',(5+moving*7+gunKick*12)*(1-ads*.65)+'px');
 $('hitmarker').style.opacity=hitTime>0?'1':'0';$('damageVignette').style.opacity=damageTime/1.2;$('damageDirection').style.opacity=damageTime>0?'1':'0';$('announcement').style.opacity=announcementTime>0?'1':'0';$('killNotice').style.opacity=killNoticeTime>0?'1':'0';
}
function frame(now){
 const dt=Math.min((now-lastFrame)/1000,.08);lastFrame=now;fpsFrames++;fpsTime+=dt;if(fpsTime>=.5){fps=Math.round(fpsFrames/fpsTime);fpsFrames=0;fpsTime=0;}
 if(state==='running'){
  const sensitivity=(touch?settings.touchSens:settings.sens)*(ads>.5?settings.adsSens:1);
  yaw-=lookX*.0021*sensitivity;pitch=clamp(pitch-lookY*.0021*sensitivity*(settings.invertY?-1:1),-1.45,1.45);
  accumulator+=dt;let steps=0;while(accumulator>=1/120&&steps<10&&state==='running'){tick(1/120);accumulator-=1/120;steps++;}
 }else accumulator=0;
 if(state==='running'||state==='menu')updateView(dt);lookX=lookY=0;
 renderer.info.reset();renderer.clear();renderer.render(world.scene,camera);renderer.clearDepth();renderer.render(viewScene,viewCamera);renderFrames++;
 hudTimer+=dt;if(hudTimer>.06){updateHUD();hudTimer=0;}
 requestAnimationFrame(frame);
}
document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;if(locked){hadPointerLock=true;$('pointerHint').hidden=true;}else if(hadPointerLock){hadPointerLock=false;if(state==='running'&&!touch)pause();}});
document.addEventListener('pointerlockerror',()=>{pointerError=pointerError||'Pointer lock denied';if(!touch)$('pointerHint').hidden=false;});
document.addEventListener('mousemove',e=>{if(state==='running'&&(document.pointerLockElement===canvas||dragLook)){lookX+=e.movementX;lookY+=e.movementY;}});
canvas.addEventListener('mousedown',e=>{if(state!=='running'||touch)return;if(document.pointerLockElement!==canvas){dragLook=true;if(!pointerError)lockPointer();}if(e.button===0)firePressed=true;if(e.button===2)aimPressed=true;});
document.addEventListener('mouseup',e=>{dragLook=false;if(e.button===0)firePressed=false;if(e.button===2)aimPressed=false;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{
 if(e.code==='Escape'){if(state==='running')pause();return;}
 if(state!=='running'||document.querySelector('dialog[open]'))return;
 if(['Space','Tab','AltLeft','AltRight','ControlLeft','ControlRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code))e.preventDefault();
 const first=!keys.has(e.code);keys.add(e.code);
 if(e.code==='Space'&&first)jumpQueued=true;if(['ControlLeft','ControlRight','KeyC'].includes(e.code)&&first)slideQueued=true;
 if(e.repeat)return;if(e.code==='KeyR')requestReload();if(e.code==='Digit1')requestEquip(0);if(e.code==='Digit2')requestEquip(1);if(e.code==='Digit3')requestEquip(2);if(e.code==='KeyG')throwRequested=true;if(e.code==='KeyF'&&reload<=0)inspect=1.8;
 if(e.code==='Enter'&&e.altKey){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.().catch(()=>{});}
});
document.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('wheel',e=>{if(state==='running'){e.preventDefault();requestEquip((selectedSlot+(e.deltaY>0?1:2))%3);}},{passive:false});
window.addEventListener('blur',()=>{if(state==='running')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause();});window.addEventListener('resize',resize);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('fatalText').textContent='The graphics context was lost. Please reload the game.';$('fatal').hidden=false;});
function initTouch(){
 if(!touch)return;const joy=$('joystick'),stick=joy.firstElementChild;let joyId=null,lookId=null,lastX=0,lastY=0;
 function moveJoy(e){const rect=joy.getBoundingClientRect(),dx=(e.clientX-rect.left-rect.width/2)/48,dz=(e.clientY-rect.top-rect.height/2)/48,l=Math.max(1,Math.hypot(dx,dz));touchMove.x=dx/l;touchMove.z=-dz/l;stick.style.transform=`translate(${touchMove.x*36}px,${-touchMove.z*36}px)`;}
 joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e);e.preventDefault();});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)moveJoy(e);});const endJoy=()=>{joyId=null;touchMove.x=touchMove.z=0;stick.style.transform='';};joy.addEventListener('pointerup',endJoy);joy.addEventListener('pointercancel',endJoy);
 const look=$('lookZone');look.addEventListener('pointerdown',e=>{if(lookId!==null)return;lookId=e.pointerId;lastX=e.clientX;lastY=e.clientY;look.setPointerCapture(e.pointerId);});look.addEventListener('pointermove',e=>{if(e.pointerId!==lookId)return;lookX+=(e.clientX-lastX)*1.8;lookY+=(e.clientY-lastY)*1.8;lastX=e.clientX;lastY=e.clientY;});const endLook=e=>{if(e.pointerId===lookId)lookId=null;};look.addEventListener('pointerup',endLook);look.addEventListener('pointercancel',endLook);
 $('touch').querySelectorAll('button').forEach(button=>{const action=button.dataset.action;button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(action==='fire')firePressed=true;if(action==='aim'){touchAim=!touchAim;button.style.borderColor=touchAim?'#80d5ff':'';}if(action==='jump')jumpQueued=true;if(action==='crouch'){keys.add('TouchCrouch');slideQueued=true;}if(action==='reload')requestReload();if(action==='switch')requestEquip((selectedSlot+1)%3);if(action==='grenade')throwRequested=true;});const release=()=>{if(action==='fire')firePressed=false;if(action==='crouch')keys.delete('TouchCrouch');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);});
}
// Read-only diagnostics for reproducible browser QA; no network calls or telemetry.
Object.defineProperty(window,'ZEXRA',{value:Object.freeze({get snapshot(){return{state,mode,map,difficulty,time,clock,round,fps,renderFrames,look:{yaw,pitch},aimAlignment:camera?camera.getWorldDirection(new T.Vector3()).dot(aimDirection(0)):1,settings:{...settings},shots:player.shots,hits:player.hits,scopeVisible:!$('scope').hidden,pointerLocked:document.pointerLockElement===canvas,pointerError,player:{x:player.x,y:player.y,z:player.z,hp:player.hp,kills:player.kills,deaths:player.deaths,alive:player.alive,grounded:player.grounded,slide:player.slide,invulnerable:player.invulnerable},weapon:gunConfig().id,ammo:inventory[selectedSlot]?.ammo,reserve:inventory[selectedSlot]?.reserve,reload,bots:bots.map(b=>({name:b.name,x:b.x,z:b.z,hp:b.hp,alive:b.alive,kills:b.kills,path:b.path.length})),effects:effects.length,grenades:grenades.length,drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles};}}),writable:false});
setup();
