const T=window.THREE;
const materials={metal:new T.MeshStandardMaterial({color:0x344049,roughness:.38,metalness:.88}),dark:new T.MeshStandardMaterial({color:0x141e24,roughness:.58,metalness:.42}),polymer:new T.MeshStandardMaterial({color:0x303a36,roughness:.86,metalness:.05}),tan:new T.MeshStandardMaterial({color:0x827957,roughness:.87,metalness:.05}),steel:new T.MeshStandardMaterial({color:0x727f81,roughness:.3,metalness:.92}),rubber:new T.MeshStandardMaterial({color:0x1b2425,roughness:.94}),glove:new T.MeshStandardMaterial({color:0x3d4b45,roughness:1}),sleeve:new T.MeshStandardMaterial({color:0x657365,roughness:1}),glass:new T.MeshStandardMaterial({color:0x275963,roughness:.1,metalness:.7,transparent:true,opacity:.62}),red:new T.MeshBasicMaterial({color:0xf96d4d}),brass:new T.MeshStandardMaterial({color:0xbca256,roughness:.35,metalness:.8})};
const bevelShape=new T.Shape();bevelShape.moveTo(-.465,-.465);bevelShape.lineTo(.465,-.465);bevelShape.lineTo(.465,.465);bevelShape.lineTo(-.465,.465);bevelShape.closePath();
const bevelBox=new T.ExtrudeGeometry(bevelShape,{depth:.93,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.035,bevelThickness:.035});bevelBox.translate(0,0,-.465);
const geometries={box:bevelBox,cyl:new T.CylinderGeometry(1,1,1,16),sphere:new T.SphereGeometry(1,12,8)};
const limbGeometry=new T.CapsuleGeometry(.5,1,3,8);
const clearOptic=new T.MeshBasicMaterial({color:0xa4e7ff,transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide});
const woodMaterial=new T.MeshStandardMaterial({color:0x6d3c20,roughness:.66,metalness:0});
const soldierMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.86,metalness:.08});
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const shadowContext=shadowCanvas.getContext('2d'),shadowGradient=shadowContext.createRadialGradient(32,32,3,32,32,31);shadowGradient.addColorStop(0,'rgba(0,0,0,.65)');shadowGradient.addColorStop(1,'rgba(0,0,0,0)');shadowContext.fillStyle=shadowGradient;shadowContext.fillRect(0,0,64,64);const contactShadowMaterial=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,opacity:.6});const contactShadowGeometry=new T.PlaneGeometry(1,.7);
function mergeSoldierParts(group,exclude){
 const positions=[],normals=[],colors=[];
 for(const mesh of [...group.children]){if(!mesh.isMesh||mesh===exclude)continue;mesh.updateMatrix();let geo=mesh.geometry.clone().applyMatrix4(mesh.matrix);if(geo.index){const indexed=geo;geo=geo.toNonIndexed();indexed.dispose();}const p=geo.attributes.position,n=geo.attributes.normal,c=mesh.material.color;for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));colors.push(c.r,c.g,c.b);}geo.dispose();group.remove(mesh);}
 const merged=new T.BufferGeometry();merged.setAttribute('position',new T.Float32BufferAttribute(positions,3));merged.setAttribute('normal',new T.Float32BufferAttribute(normals,3));merged.setAttribute('color',new T.Float32BufferAttribute(colors,3));const mesh=new T.Mesh(merged,soldierMaterial);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return merged;
}
export function createWeapon(id='carbine',hands=true){
 const root=new T.Group();root.userData.id=id;
 const part=(geo,m,x,y,z,w,h,d,parent=root)=>{const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;};
 const box=(m,x,y,z,w,h,d,parent)=>part(geometries.box,m,x,y,z,w,h,d,parent);
 const cyl=(m,x,y,z,r,length,parent=root)=>{const p=part(geometries.cyl,m,x,y,z,r,length,r,parent);p.rotation.x=Math.PI/2;return p;};
 const M=materials;
 const mag=new T.Group(),bolt=new T.Group();root.add(mag,bolt);
 let muzzle=-1.12,sightY=.15;
 if(id==='knife'){
  box(M.rubber,0,-.02,.05,.075,.085,.34);box(M.metal,0,-.01,-.15,.15,.045,.045);
  const shape=new T.Shape();shape.moveTo(-.04,0);shape.lineTo(.045,0);shape.lineTo(.045,.38);shape.lineTo(0,.52);shape.lineTo(-.04,.36);shape.closePath();const geometry=new T.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.004,bevelThickness:.003});const blade=new T.Mesh(geometry,M.steel);blade.rotation.x=-Math.PI/2;blade.position.set(0,0,-.17);root.add(blade);root.userData.extraGeometry=geometry;
  muzzle=-.7;
 }else if(id==='p90'){
  // Compact bullpup body, thumbhole stock and horizontal top-mounted magazine.
  box(M.polymer,0,-.015,-.22,.17,.16,.69);box(M.polymer,0,-.12,.03,.16,.12,.20);box(M.rubber,0,-.005,.14,.18,.27,.05);
  box(M.polymer,0,-.14,-.43,.15,.15,.12);box(M.polymer,0,-.24,-.17,.13,.05,.38);
  const grip=box(M.polymer,0,-.17,-.12,.10,.21,.10);grip.rotation.x=-.17;
  box(M.steel,0,.107,-.22,.145,.065,.52,mag);box(M.glass,0,.145,-.22,.13,.025,.50,mag);
  for(let z=-.44;z<.01;z+=.025)cyl(M.brass,0,.15,z,.012,.09,mag).rotation.z=Math.PI/2;
  box(M.dark,0,.20,-.31,.11,.05,.25);const optic=new T.Mesh(new T.TorusGeometry(.048,.009,6,16),M.dark);optic.position.set(0,.265,-.35);root.add(optic);root.userData.ringGeometry=optic.geometry;
  part(geometries.sphere,M.red,0,.265,-.344,.002,.002,.002);cyl(clearOptic,0,.265,-.35,.039,.002);
  cyl(M.metal,0,.01,-.64,.025,.17);cyl(M.dark,0,.01,-.735,.032,.05);box(M.steel,.09,.025,-.35,.012,.035,.07,bolt);
  muzzle=-.76;sightY=.265;
 }else if(id==='pistol'){
  box(M.polymer,0,-.035,-.04,.105,.13,.31);box(M.metal,0,.055,-.1,.12,.095,.37,bolt);box(M.dark,0,.109,-.18,.075,.009,.18,bolt);
  const grip=box(M.polymer,0,-.17,.055,.1,.23,.13);grip.rotation.x=-.24;box(M.rubber,0,-.285,.085,.115,.025,.14,mag);
  box(M.metal,0,-.14,-.095,.08,.02,.16);box(M.metal,0,-.09,-.17,.025,.11,.02);box(M.steel,.063,.06,-.03,.008,.038,.065,bolt);
  cyl(M.steel,0,.04,-.28,.028,.055);cyl(M.dark,0,.04,-.31,.019,.008);box(M.dark,0,.12,-.255,.015,.025,.02,bolt);box(M.red,0,.135,-.255,.004,.008,.004,bolt);box(M.dark,0,.12,.05,.1,.022,.025,bolt);
  for(const x of [-.061,.061])for(let z=-.025;z<.07;z+=.015)box(M.dark,x,.06,z,.003,.065,.005,bolt);
  muzzle=-.32;sightY=.13;
 }else{
  const smg=id==='mp5',sniper=id==='awp',shotgun=id==='shotgun',ak=id==='ak47',garand=id==='garand',furniture=ak||garand?woodMaterial:sniper?M.polymer:M.tan;muzzle=sniper?-1.48:garand?-1.4:shotgun?-1.32:smg?-.87:-1.18;
  box(M.metal,0,.012,-.18,.125,.17,.47);box(M.polymer,0,-.07,-.1,.12,.07,.4);box(M.dark,0,.108,-.27,.115,.025,.6);
  // Buffer tube, cheek rest, buttpad, angled pistol grip.
  cyl(M.metal,0,.005,.24,.035,.34);box(smg?M.polymer:furniture,0,.028,.34,.12,.105,.28);box(smg?M.polymer:furniture,0,-.085,.40,.10,.045,.15);box(M.rubber,0,-.02,.49,.135,.23,.04);
  if(ak||garand)box(furniture,0,-.065,.26,.13,.12,.36);
  const grip=box(ak?woodMaterial:M.polymer,0,-.19,.008,.095,.22,.11);grip.rotation.x=-.28;if(garand){grip.visible=false;box(woodMaterial,0,-.09,-.08,.14,.10,.65);}
  box(M.metal,0,-.16,-.13,.08,.018,.15);box(M.metal,0,-.11,-.205,.025,.12,.02);
  // Magazine, chamber and bolt cover are independently animated.
  const magZ=smg?-.26:-.22;const magazine=box(M.dark,0,-.22,magZ,smg?.065:.095,smg?.32:.27,.14,mag);magazine.rotation.x=smg?-.08:.16;
  if(ak){magazine.scale.y=.17;magazine.position.y=-.17;for(let i=0;i<4;i++){const seg=box(M.dark,0,-.23-i*.045,magZ+.02+i*.024,.095,.06,.15,mag);seg.rotation.x=.18+i*.1;}}
  for(let i=0;i<3;i++)box(M.polymer,0,-.15-i*.065,magZ+.068,.1,.015,.008,mag);
  box(M.steel,.065,.025,-.12,.006,.065,.14,bolt);box(M.dark,.075,.017,-.07,.018,.04,.035,bolt);box(M.metal,-.075,.025,-.06,.02,.027,.045);
  // Free-float handguard, Picatinny rails, barrel and slotted muzzle brake.
  const fore=smg?.25:sniper?.53:garand?.63:.42,foreCenter=-.41-fore*.5;
  box(smg?M.polymer:furniture,0,.005,foreCenter,.12,.14,fore);cyl(M.metal,0,.013,(muzzle-.4)*.5,.026,Math.abs(muzzle+.4));
  for(let z=-.42;z>foreCenter-fore/2;z-=.047){box(M.dark,.062,.02,z,.006,.045,.022);box(M.dark,-.062,.02,z,.006,.045,.022);}
  if(!ak&&!garand)for(let z=.01;z>foreCenter-fore/2;z-=.04)box(M.metal,0,.125,z,.13,.015,.014);
  if(smg){cyl(M.dark,0,.02,-.27,.064,.45);box(M.metal,-.09,.08,-.40,.05,.025,.03);}
  if(garand){mag.visible=false;box(M.dark,0,.10,-.21,.06,.025,.16,bolt);}
  cyl(M.metal,0,.013,muzzle+.045,.039,.10);cyl(M.dark,0,.013,muzzle-.007,.023,.008);for(const x of [-.04,.04])box(M.dark,x,.014,muzzle+.035,.004,.035,.05);
  if(shotgun){cyl(M.dark,0,-.065,-.78,.031,.78);for(let z=-.6;z>-.92;z-=.03)box(M.rubber,0,-.055,z,.15,.12,.015);for(let z=.05;z>-.18;z-=.055)cyl(M.brass,.083,.01,z,.018,.045);}
  // Optics: an open red-dot sight for carbines, tubular scope for marksman.
  if(sniper){
   for(const z of [-.25,-.55]){box(M.dark,0,.18,z,.1,.1,.08);cyl(M.dark,0,.24,z,.066,.04);}
   cyl(M.metal,0,.25,-.41,.055,.46);cyl(M.dark,0,.25,-.68,.086,.12);cyl(M.glass,0,.25,-.745,.071,.006);cyl(M.dark,0,.25,-.145,.071,.10);cyl(M.glass,0,.25,-.09,.058,.006);box(M.dark,.075,.25,-.38,.06,.08,.07);box(M.dark,0,.32,-.38,.07,.045,.07);sightY=.25;
  }else if(ak||garand){
   box(M.dark,-.029,.156,-.10,.018,.025,.027);box(M.dark,.029,.156,-.10,.018,.025,.027);box(M.dark,0,.13,-.10,.07,.015,.027);
   box(M.dark,0,.145,muzzle+.18,.012,.055,.025);box(M.steel,0,.173,muzzle+.18,.009,.008,.012);sightY=.173;
   const frontRing=new T.Mesh(new T.TorusGeometry(.036,.006,6,14),M.dark);frontRing.position.set(0,.159,muzzle+.19);root.add(frontRing);root.userData.ringGeometry=frontRing.geometry;
  }else{
   box(M.dark,0,.15,-.24,.1,.05,.16);const ring=new T.Mesh(new T.TorusGeometry(.058,.011,6,18),M.dark);ring.position.set(0,.218,-.25);root.add(ring);root.userData.ringGeometry=ring.geometry;
   const glass=part(geometries.cyl,clearOptic,0,.218,-.25,.049,.003,.049);glass.rotation.x=Math.PI/2;
   const reticle=part(geometries.sphere,M.red,0,.218,-.245,.002,.002,.002);reticle.renderOrder=10;sightY=.218;
   box(M.dark,.074,.18,-.24,.04,.05,.05);
  }
  // Receiver pins and embossed side accents.
  for(const z of [-.31,-.03]){const pin=part(geometries.cyl,M.steel,.068,-.026,z,.008,.007,.008);pin.rotation.z=Math.PI/2;}
  box(M.steel,-.064,.035,-.18,.003,.022,.07);box(M.dark,-.07,-.02,-.03,.01,.01,.06);
 }
 let supportArm=null;
 if(hands){
  const right=box(M.glove,.035,-.22,id==='pistol'?.07:.02,.12,.13,.13);right.rotation.x=-.2;
  const forearm=box(M.sleeve,.11,-.39,.22,.15,.35,.17);forearm.rotation.x=-.45;forearm.rotation.z=.28;
  const left=box(M.glove,-.02,-.105,id==='pistol'?-.13:id==='knife'?.15:id==='p90'?-.43:-.62,.135,.12,.17);left.rotation.z=.18;
  const forearm2=box(M.sleeve,-.12,-.3,id==='pistol'?-.04:id==='knife'?.28:id==='p90'?-.25:-.43,.15,.37,.17);forearm2.rotation.z=-.35;forearm2.rotation.x=-.7;
  supportArm=new T.Group();root.add(supportArm);supportArm.add(left,forearm2);
  for(let i=0;i<4;i++)box(M.rubber,.095,-.23+i*.018,.015,.012,.012,.07);
 }
 const flashMat=new T.MeshBasicMaterial({color:0xffd58a,transparent:true,opacity:.95,depthWrite:false,side:T.DoubleSide});const flashGeo=new T.ConeGeometry(.075,.23,6),flash=new T.Mesh(flashGeo,flashMat);flash.rotation.x=-Math.PI/2;flash.position.set(0,id==='pistol'?.04:.013,muzzle-.13);flash.visible=false;root.add(flash);
 const light=new T.PointLight(0xffb85c,0,3,2);light.position.copy(flash.position);root.add(light);
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 root.userData={...root.userData,muzzle,sightY,mag,bolt,flash,light,supportArm,dispose(){flashGeo.dispose();flashMat.dispose();root.userData.extraGeometry?.dispose();root.userData.ringGeometry?.dispose();}};
 return root;
}
export function createSoldier(index=0,friendly=false){
 const group=new T.Group(),limbs=[];
 const cloth=new T.MeshStandardMaterial({color:friendly?0x7b82ad:[0x6b7361,0x7f6f58,0x4d6670,0x746e63,0x566658][index%5],roughness:1}),armor=materials.polymer;
 function limb(x,y,z,w,h,d,m=cloth){const rounded=m===cloth;const mesh=new T.Mesh(rounded?limbGeometry:geometries.box,m);mesh.position.set(x,y,z);mesh.scale.set(w,rounded?h*.5:h,d);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 limb(0,1.15,0,.5,.62,.28);limb(0,1.22,-.17,.42,.42,.1,armor);limb(0,.87,0,.4,.18,.3,materials.dark);
 for(const x of [-.105,.105]){const leg=new T.Group();leg.position.set(x,.82,0);const thigh=new T.Mesh(limbGeometry,cloth);thigh.scale.set(.17,.31,.2);thigh.position.y=-.31;thigh.castShadow=true;leg.add(thigh);const boot=new T.Mesh(geometries.box,materials.rubber);boot.scale.set(.18,.16,.3);boot.position.set(0,-.72,-.05);leg.add(boot);group.add(leg);limbs.push(leg);}
 const head=new T.Mesh(new T.SphereGeometry(.18,12,10),armor);head.position.y=1.64;head.scale.y=1.12;head.castShadow=true;group.add(head);limb(0,1.64,-.155,.29,.09,.05,materials.glass);limb(0,1.52,-.14,.26,.12,.09,materials.dark);
 limb(-.31,1.17,-.16,.16,.39,.19).rotation.x=-.7;limb(.31,1.17,-.13,.16,.39,.19).rotation.x=-.8;
 limb(0,1.23,-.48,.10,.13,.6,materials.dark);limb(0,1.26,-.88,.035,.035,.28,materials.metal);limb(0,1.37,-.45,.08,.08,.12,materials.dark);
 for(const x of [-.14,0,.14])limb(x,1.14,-.24,.10,.14,.06,materials.tan);
 const patch=limb(-.255,1.33,-.01,.015,.11,.13,materials.tan);
 const flash=new T.Mesh(new T.SphereGeometry(.12,6,4),new T.MeshBasicMaterial({color:0xffd477}));flash.position.set(0,1.26,-1.03);flash.scale.z=2;flash.visible=false;group.add(flash);
 const mergedGeometry=mergeSoldierParts(group,flash);
 group.traverse(o=>{if(o.isMesh)o.castShadow=false;});
 const shadow=new T.Mesh(contactShadowGeometry,contactShadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;group.add(shadow);
 return{group,limbs,head,flash,dispose(){cloth.dispose();head.geometry.dispose();flash.geometry.dispose();flash.material.dispose();mergedGeometry.dispose();}};
}
export function createZombie(index=0){
 const group=new T.Group(),limbs=[],arms=[];
 const skin=new T.MeshStandardMaterial({color:index%2?0x7d8476:0x879187,roughness:1}),rags=new T.MeshStandardMaterial({color:index%3?0x45424e:0x4f5a4e,roughness:1});
 const part=(x,y,z,w,h,d,material=skin,parent=group)=>{const p=new T.Mesh(limbGeometry,material);p.position.set(x,y,z);p.scale.set(w,h*.5,d);parent.add(p);return p;};
 part(0,1.13,0,.48,.65,.26,rags);part(0,1.58,0,.29,.40,.29);part(0,1.48,-.13,.22,.13,.07,materials.dark);
 for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.12,.82,0);part(0,-.34,0,.16,.68,.18,rags,leg);part(0,-.74,-.05,.18,.16,.27,materials.rubber,leg);group.add(leg);limbs.push(leg);
  const arm=new T.Group();arm.position.set(side*.28,1.36,-.01);part(0,-.28,0,.13,.56,.15,skin,arm);part(0,-.56,-.02,.13,.12,.19,skin,arm);arm.rotation.x=-1.15;group.add(arm);arms.push(arm);
 }
 const merged=mergeSoldierParts(group,null);const eyeMaterial=new T.MeshBasicMaterial({color:0xc3a1ff});
 for(const x of [-.065,.065]){const e=new T.Mesh(geometries.sphere,eyeMaterial);e.scale.set(.022,.014,.018);e.position.set(x,1.66,-.143);group.add(e);}
 const shadow=new T.Mesh(contactShadowGeometry,contactShadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;group.add(shadow);
 const flash=new T.Group();group.add(flash);flash.visible=false;
 return{group,limbs,arms,flash,zombie:true,dispose(){merged.dispose();skin.dispose();rags.dispose();eyeMaterial.dispose();}};
}
