const T=window.THREE;
const materials={metal:new T.MeshStandardMaterial({color:0x344049,roughness:.38,metalness:.88}),dark:new T.MeshStandardMaterial({color:0x141e24,roughness:.58,metalness:.42}),polymer:new T.MeshStandardMaterial({color:0x303a36,roughness:.86,metalness:.05}),tan:new T.MeshStandardMaterial({color:0x827957,roughness:.87,metalness:.05}),steel:new T.MeshStandardMaterial({color:0x727f81,roughness:.3,metalness:.92}),rubber:new T.MeshStandardMaterial({color:0x1b2425,roughness:.94}),glove:new T.MeshStandardMaterial({color:0x3d4b45,roughness:1}),sleeve:new T.MeshStandardMaterial({color:0x657365,roughness:1}),glass:new T.MeshStandardMaterial({color:0x275963,roughness:.1,metalness:.7,transparent:true,opacity:.62}),red:new T.MeshBasicMaterial({color:0xff2020,toneMapped:false}),brass:new T.MeshStandardMaterial({color:0xbca256,roughness:.35,metalness:.8})};
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
export function createWeapon(id='ak47',hands=true){
 const root=new T.Group(),owned=[];root.userData.id=id;
 const M=materials,mag=new T.Group(),bolt=new T.Group();root.add(mag,bolt);
 const part=(geo,m,x,y,z,w,h,d,parent=root)=>{const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;};
 const box=(m,x,y,z,w,h,d,parent=root)=>part(geometries.box,m,x,y,z,w,h,d,parent);
 const cyl=(m,x,y,z,r,length,parent=root)=>{const p=part(geometries.cyl,m,x,y,z,r,length,r,parent);p.rotation.x=Math.PI/2;return p;};
 // Side profiles are extruded across the receiver width, preserving each silhouette.
 function profile(points,width,material,parent=root,holes=[]){
  const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(-z,y):shape.moveTo(-z,y));shape.closePath();
  for(const points of holes){const hole=new T.Path();points.forEach(([z,y],i)=>i?hole.lineTo(-z,y):hole.moveTo(-z,y));hole.closePath();shape.holes.push(hole);}
  const geo=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelSize:.006,bevelThickness:.005,bevelSegments:2,steps:1});owned.push(geo);
  const mesh=new T.Mesh(geo,material);mesh.rotation.y=Math.PI/2;mesh.position.x=-width/2;parent.add(mesh);return mesh;
 }
 let muzzle=-1.12,sightY=.25;
 const barrel=(end,start=-.48,r=.023)=>{cyl(M.steel,0,.018,(start+end)/2,r,Math.abs(start-end));cyl(M.dark,0,.018,end+.035,r*1.35,.08);cyl(M.rubber,0,.018,end-.009,r*.75,.006);muzzle=end-.015;};
 const grip=(z=.02,m=M.polymer)=>{const p=box(m,0,-.19,z,.09,.23,.11);p.rotation.x=-.25;box(M.dark,0,-.145,z-.10,.075,.016,.14);box(M.dark,0,-.10,z-.17,.018,.10,.02);};
 const charging=(x=.08,z=-.15)=>{box(M.steel,x,.03,z,.012,.05,.13,bolt);box(M.dark,x*1.35,.025,z+.04,.065,.025,.025,bolt);};
 const rail=(start,end,height=.14)=>{box(M.dark,0,height-.015,(start+end)/2,.10,.025,Math.abs(start-end));for(let z=start;z>end;z-=.035)box(M.metal,0,height+.005,z,.115,.015,.014);};
 const rectOptic=(z=-.26,y=.255)=>{
  const optic=new T.Group();optic.position.set(0,y-.075,z);optic.scale.set(.375,.375,1);root.add(optic);
  box(M.dark,0,-.08,0,.12,.045,.17,optic);box(M.dark,-.093,0,0,.018,.12,.07,optic);box(M.dark,.093,0,0,.018,.12,.07,optic);
  box(M.dark,0,.059,0,.20,.016,.07,optic);box(M.dark,0,-.059,0,.20,.016,.07,optic);
  box(clearOptic,0,0,-.025,.169,.098,.002,optic);const dot=part(geometries.sphere,M.red,0,0,.012,.004267,.004267,.0022,optic);dot.renderOrder=12;
  box(M.dark,.116,-.025,0,.035,.05,.055,optic);sightY=y-.075;root.userData.optic='rectangular-red-dot';root.userData.opticGroup=optic;
 };
 const scope=(z=-.4,y=.28)=>{
  for(const at of [z-.14,z+.13]){box(M.dark,0,y-.09,at,.09,.12,.065);cyl(M.dark,0,y,at,.065,.04);}
  cyl(M.metal,0,y,z,.049,.48);cyl(M.dark,0,y,z-.27,.084,.13);cyl(M.glass,0,y,z-.34,.072,.004);cyl(M.dark,0,y,z+.26,.069,.105);cyl(M.glass,0,y,z+.315,.057,.004);
  box(M.dark,0,y+.07,z,.07,.06,.075);box(M.dark,.07,y,z,.07,.07,.075);sightY=y;root.userData.optic='magnified';
 };
 if(id==='knife'){
  box(M.rubber,0,-.02,.05,.075,.085,.34);box(M.metal,0,-.01,-.15,.15,.045,.045);
  profile([[-.17,-.025],[-.68,-.025],[-.80,0],[-.64,.035],[-.17,.035]],.015,M.steel);muzzle=-.8;
 }else if(id==='ak47'){
  profile([[.50,.06],[.21,.075],[.08,-.04],[.17,-.17],[.49,-.18]],.12,woodMaterial);box(M.rubber,0,-.06,.51,.13,.25,.025);
  box(M.metal,0,-.025,-.18,.125,.15,.47);cyl(M.dark,0,.055,-.18,.063,.44);grip(.01,woodMaterial);
  profile([[-.40,.05],[-.83,.035],[-.85,-.07],[-.41,-.10]],.115,woodMaterial);cyl(M.dark,0,.085,-.70,.025,.42);
  profile([[-.30,-.08],[-.15,-.08],[-.13,-.23],[-.04,-.43],[-.13,-.48],[-.25,-.30]],.09,M.dark,mag);
  for(let i=0;i<4;i++)box(M.metal,.047,-.20-i*.05,-.20+i*.02,.006,.035,.105,mag);
  barrel(-1.16,-.8);charging();rail(-.08,-.42,.13);rectOptic(-.25,.25);
 }else if(id==='vcr2'){
  // VCR-2: rear magazine and chamber, high continuous rail, short bullpup fore-end.
  profile([[.44,.10],[-.72,.10],[-.80,-.03],[-.60,-.12],[.04,-.11],[.17,-.24],[.43,-.20]],.16,M.polymer);
  box(M.rubber,0,-.045,.455,.17,.32,.035);box(M.dark,0,.045,.19,.17,.08,.27);grip(-.27);
  profile([[.25,-.09],[.10,-.09],[.08,-.39],[.22,-.40]],.095,M.dark,mag);
  for(let i=0;i<5;i++)box(M.polymer,.05,-.18-i*.035,.17,.008,.017,.12,mag);
  for(let z=-.43;z>-.74;z-=.055){box(M.dark,.084,-.015,z,.006,.055,.027);box(M.dark,-.084,-.015,z,.006,.055,.027);}
  rail(.36,-.76,.16);barrel(-.98,-.73);charging(-.09,-.49);rectOptic(-.32,.285);
 }else if(id==='mp5'){
  cyl(M.metal,0,.015,-.25,.062,.50);box(M.dark,0,-.055,-.20,.11,.10,.35);grip(.005);
  for(const x of [-.069,.069])cyl(M.steel,x,.01,.22,.012,.51);box(M.rubber,0,-.055,.48,.13,.23,.035);
  profile([[-.41,.055],[-.70,.025],[-.75,-.045],[-.67,-.10],[-.43,-.09]],.13,M.polymer);
  profile([[-.32,-.08],[-.23,-.08],[-.22,-.24],[-.14,-.40],[-.22,-.43],[-.31,-.26]],.065,M.dark,mag);
  cyl(M.steel,0,.098,-.48,.018,.38);box(M.dark,-.09,.10,-.54,.06,.024,.03,bolt);charging();barrel(-.86,-.69);rail(-.05,-.41,.12);rectOptic(-.23,.24);
 }else if(id==='awp'){
  const green=new T.MeshStandardMaterial({color:0x54704b,roughness:.85});owned.push(green);
  profile([[.53,.025],[.15,.055],[-.82,-.05],[-.82,-.14],[-.05,-.16],[.04,-.31],[.14,-.30],[.21,-.15],[.50,-.21]],.135,green,root,[[[.15,-.075],[.30,-.075],[.34,-.16],[.23,-.19]]]);
  box(M.rubber,0,-.09,.55,.145,.29,.035);box(green,0,.05,.37,.14,.065,.23);cyl(M.metal,0,.062,-.24,.052,.62);
  box(M.dark,0,-.23,-.29,.095,.16,.15,mag);cyl(M.steel,.085,.04,-.03,.012,.14,bolt).rotation.z=Math.PI/2;part(geometries.sphere,M.dark,.15,.02,-.03,.035,.035,.035,bolt);
  for(const x of [-.07,.07])cyl(M.dark,x,-.16,-.72,.012,.40);barrel(-1.43,-.57,.033);scope(-.38,.265);
 }else if(id==='garand'){
  profile([[.58,.035],[.28,.03],[.09,-.04],[-.88,-.045],[-1.03,-.01],[-1.03,-.075],[-.45,-.145],[.06,-.145],[.25,-.23],[.57,-.23]],.125,woodMaterial);
  box(M.steel,0,.025,-.24,.115,.09,.43);box(M.dark,0,.076,-.21,.065,.012,.16);box(M.rubber,0,-.095,.59,.13,.29,.022);
  box(M.steel,.076,.055,-.23,.025,.025,.17,bolt);box(M.dark,.10,.052,-.15,.055,.026,.025,bolt);
  for(let i=0;i<4;i++)for(const x of [-.018,.018]){cyl(M.brass,x,.105,-.16-i*.021,.010,.07,mag).rotation.x=0;}box(M.dark,0,.08,-.19,.058,.025,.11,mag);mag.visible=false;
  for(const z of [-.72,-.97])box(M.steel,0,-.02,z,.14,.105,.025);barrel(-1.40,-.94);rail(-.05,-.37,.125);rectOptic(-.21,.25);
 }else if(id==='p90'){
  profile([[.19,.07],[-.62,.07],[-.64,-.15],[-.48,-.29],[.13,-.29]],.17,M.polymer,root,[[[-.03,-.11],[.09,-.11],[.09,-.22],[-.04,-.22]],[[-.47,-.10],[-.32,-.10],[-.28,-.22],[-.43,-.22]]]);
  box(M.rubber,0,-.09,.20,.18,.34,.035);box(M.dark,0,.113,-.23,.15,.06,.55,mag);box(M.glass,0,.15,-.23,.14,.025,.53,mag);
  for(let z=-.46;z<.02;z+=.024){const round=cyl(M.brass,0,.147,z,.010,.10,mag);round.rotation.set(0,0,Math.PI/2);}
  charging(.10,-.39);barrel(-.76,-.58);rectOptic(-.32,.28);
 }else if(id==='barrett'){
  // Long rectangular M82 receiver, vented barrel shroud, box magazine and bipod.
  box(M.metal,0,.025,-.22,.15,.18,.76);box(M.dark,0,-.015,.34,.13,.16,.36);box(M.rubber,0,-.06,.54,.16,.28,.04);grip(.07);
  box(M.dark,0,-.245,-.20,.12,.29,.24,mag);for(const x of [-.063,.063])for(let z=-.28;z<-.10;z+=.045)box(M.metal,x,-.24,z,.006,.21,.013,mag);
  box(M.metal,0,.025,-.89,.16,.15,.57);for(let z=-.65;z>-1.14;z-=.07)for(const x of [-.083,.083])box(M.dark,x,.025,z,.004,.085,.038);
  barrel(-1.66,-1.14,.036);box(M.steel,0,.018,-1.64,.16,.11,.16);for(const x of [-.083,.083])for(const z of [-1.60,-1.66])box(M.dark,x,.018,z,.008,.06,.03);
  for(const side of [-1,1]){const leg=cyl(M.dark,side*.095,-.15,-.96,.016,.52);leg.rotation.x=1.24;leg.rotation.z=side*.18;}
  charging(.09,-.12);rail(.10,-.91,.15);scope(-.41,.30);muzzle=-1.74;
 }else if(id==='pistol'){
  box(M.polymer,0,-.035,-.04,.105,.13,.31);box(M.metal,0,.055,-.10,.12,.095,.37,bolt);grip(.06);box(M.dark,0,-.20,.06,.07,.23,.10,mag);box(M.rubber,0,-.32,.08,.11,.022,.13,mag);
  cyl(M.steel,0,.04,-.29,.027,.055);muzzle=-.32;rectOptic(.005,.205);
  for(const x of [-.061,.061])for(let z=-.025;z<.07;z+=.015)box(M.dark,x,.06,z,.003,.065,.005,bolt);
 }
 let supportArm=null;
 if(hands){
  const gripZ=id==='vcr2'?-.27:id==='pistol'?.07:.02;
  box(M.glove,.035,-.22,gripZ,.12,.13,.13).rotation.x=-.2;const right=box(M.sleeve,.11,-.39,gripZ+.20,.15,.35,.17);right.rotation.x=-.45;right.rotation.z=.28;
  supportArm=new T.Group();root.add(supportArm);const z=id==='pistol'?-.10:id==='knife'?.15:id==='p90'?-.43:-.62;
  const left=box(M.glove,-.02,-.105,z,.135,.12,.17,supportArm);left.rotation.z=.18;const fore=box(M.sleeve,-.12,-.30,z+.18,.15,.37,.17,supportArm);fore.rotation.z=-.35;fore.rotation.x=-.7;
  root.userData.supportZ=z;
 }
 // Three distinct magazine instances: seated, removed and fresh replacement.
 const oldMag=mag.clone(true),newMag=mag.clone(true);root.add(oldMag,newMag);oldMag.visible=newMag.visible=false;
 const flashMat=new T.MeshBasicMaterial({color:0xffd58a,transparent:true,opacity:.95,depthWrite:false,side:T.DoubleSide}),flashGeo=new T.ConeGeometry(.075,.23,6),flash=new T.Mesh(flashGeo,flashMat);flash.rotation.x=-Math.PI/2;flash.position.set(0,id==='pistol'?.04:.018,muzzle-.13);flash.visible=false;root.add(flash);
 const light=new T.PointLight(0xffb85c,0,3,2);light.position.copy(flash.position);root.add(light);root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
 root.userData={...root.userData,muzzle,sightY,mag,oldMag,newMag,bolt,flash,light,supportArm,dispose(){flashGeo.dispose();flashMat.dispose();for(const r of owned)r.dispose();}};return root;
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
