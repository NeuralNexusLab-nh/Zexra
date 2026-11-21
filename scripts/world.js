import {visible} from './physics.js?asset=92beea4cf702';
const T=window.THREE;
let seed=517;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function surface(kind,color){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,512,512);
 const im=g.getImageData(0,0,512,512);for(let i=0;i<im.data.length;i+=4){const n=(random()-.5)*(kind==='metal'?12:28);im.data[i]+=n;im.data[i+1]+=n;im.data[i+2]+=n;}g.putImageData(im,0,0);
 if(kind==='concrete'){g.strokeStyle='#121d2520';g.lineWidth=2;for(let x=0;x<512;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,512);g.stroke();}for(let y=0;y<512;y+=128){g.beginPath();g.moveTo(0,y);g.lineTo(512,y);g.stroke();}}
 if(kind==='metal'){for(let y=0;y<512;y+=64){g.fillStyle='#111c2622';g.fillRect(0,y,512,2);}g.fillStyle='#ced8cf15';for(let i=0;i<150;i++)g.fillRect(random()*512,random()*512,random()*60,1);}
 if(kind==='asphalt'){g.strokeStyle='#10141599';g.lineWidth=.7;for(let i=0;i<16;i++){g.beginPath();let x=random()*512,y=random()*512;g.moveTo(x,y);for(let j=0;j<5;j++){x+=random()*25-12;y+=random()*32;g.lineTo(x,y);}g.stroke();}}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(kind==='asphalt'?12:2,kind==='asphalt'?12:2);tex.anisotropy=4;return tex;
}
function textTexture(text,bg='#15242b',fg='#d4ded2',width=512,height=128){const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,width,height);g.fillStyle=fg;g.font=`bold ${height*.5}px monospace`;g.textBaseline='middle';g.textAlign='center';g.fillText(text,width/2,height/2);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export function createWorld(renderer,theme='dock'){
 seed=517;const night=theme==='night',scene=new T.Scene(),boxes=[],resources=[],batches=new Map(),decor=[];
 scene.fog=new T.FogExp2(night?0x1a2933:0x879d9e,night?.013:.006);
 const textures=[surface('concrete','#adb4ae'),surface('asphalt','#454e50'),surface('metal','#9aaba6')];resources.push(...textures);
 const bumps=textures.map(tex=>{const t=tex.clone();t.colorSpace=T.NoColorSpace;t.needsUpdate=true;resources.push(t);return t;});
 const mat=(color,roughness=.8,metalness=0,map=null)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness,map,bumpMap:map?bumps[textures.indexOf(map)]:null,bumpScale:metalness>.2?.025:.13});resources.push(m);return m;};
 const concrete=mat('#a9b2ab',.95,0,textures[0]),darkConcrete=mat('#667775',.96,0,textures[0]),asphalt=mat('#8b9395',.93,0,textures[1]),steel=mat('#33464e',.48,.75,textures[2]),silver=mat('#b2c0bb',.38,.8),yellow=mat('#7ab5d4',.72,.15),rust=mat('#8d5240',.75,.35,textures[2]),blue=mat('#456d7a',.65,.4,textures[2]),green=mat('#655b7c',.7,.3,textures[2]),black=mat('#19272c',.88),white=mat('#d8ddce',.8),orange=mat('#e48e46',.65);
 const unitBox=new T.BoxGeometry(1,1,1);resources.push(unitBox);
 function box(x,y,z,w,h,d,m=concrete,solid=true){
  const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion(),new T.Vector3(w,h,d));if(!batches.has(m))batches.set(m,[]);batches.get(m).push(matrix);
  if(solid)boxes.push({min:{x:x-w/2,y:y-h/2,z:z-d/2},max:{x:x+w/2,y:y+h/2,z:z+d/2}});
 }
 function cylinder(x,y,z,r,h,m=silver,rotate=false){const geom=new T.CylinderGeometry(r,r,h,16),mesh=new T.Mesh(geom,m);resources.push(geom);mesh.position.set(x,y,z);if(rotate)mesh.rotation.z=Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;}
 function label(text,x,y,z,w=4,h=1,angle=0,bg='#22363d',fg='#dae2d5'){
  const texture=textTexture(text,bg,fg);resources.push(texture);const material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}),geo=new T.PlaneGeometry(w,h);resources.push(material,geo);const p=new T.Mesh(geo,material);p.position.set(x,y,z);p.rotation.y=angle;scene.add(p);return p;
 }
 function lamp(x,z,color=0xc8e9ff){
  box(x,3.8,z,.11,7.6,.11,steel,false);box(x,7.6,z-.65,.15,.15,1.4,steel,false);box(x,7.5,z-1.25,.6,.1,.35,white,false);
  if(night){const light=new T.SpotLight(color,75,22,Math.PI*.34,.7,1.3);light.position.set(x,7.4,z-1.2);light.target.position.set(x,0,z-2);scene.add(light,light.target);}
 }
 function container(x,z,color=blue,y=0,rotate=false){
  const w=rotate?3:8,d=rotate?8:3;box(x,y+1.5,z,w,3,d,color);box(x,y+3.05,z,w+.1,.1,d+.1,steel,false);
  if(!rotate){for(let a=-3.7;a<4;a+=.34){box(x+a,y+1.5,z+d/2+.03,.075,2.8,.045,color,false);box(x+a,y+1.5,z-d/2-.03,.075,2.8,.045,color,false);}for(const side of [-1,1]){box(x+side*4.02,y+1.5,z,.05,2.9,2.95,color,false);for(const k of [-.6,.6])box(x+side*4.06,y+1.5,z+k,.08,2.5,.055,silver,false);}}
  else for(let a=-3.7;a<4;a+=.34){box(x+1.53,y+1.5,z+a,.045,2.8,.075,color,false);box(x-1.53,y+1.5,z+a,.045,2.8,.075,color,false);}
  label('ZX / LOGISTICS',x,y+2,z+d/2+.07,Math.min(w*.78,4),.55,0,'#30444b','#c7d4c4');
 }
 function crate(x,z,y=0){box(x,y+.65,z,1.4,1.3,1.4,green);for(const k of [-.5,.5]){box(x+k,y+.65,z+.715,.08,1.3,.04,steel,false);box(x+k,y+.65,z-.715,.08,1.3,.04,steel,false);}box(x,y+1.32,z,1.5,.08,1.5,steel,false);}
 function barrier(x,z,w=3){box(x,.55,z,w,1.1,.65,concrete);for(let i=-w/2+.12;i<w/2;i+=.5)box(x+i,.88,z+.33,.22,.22,.015,yellow,false);}
 function stairs(x,z,dx,dz,count=12){for(let i=0;i<count;i++){const h=(i+1)*.25;box(x+dx*i,.5*h,z+dz*i,Math.abs(dx)>.1?.5:2,h,Math.abs(dz)>.1?.5:2,steel);}}
 // A compact three-lane arena. Cover has identical visual and physical bounds.
 box(0,-.3,0,64,.6,64,asphalt);
 box(-28,3,0,1,6,57,darkConcrete);box(28,3,0,1,6,57,darkConcrete);box(0,3,-28,57,6,1,concrete);box(0,3,28,57,6,1,concrete);
 for(let x=-24;x<28;x+=8){box(x,5.5,-27.43,.2,1,.18,steel,false);box(x,5.5,27.43,.2,1,.18,steel,false);}
 container(-10,-8,blue);container(10,8,rust);container(-19,10,green,0,true);container(19,-10,blue,0,true);
 // Raised central service deck with stair access at both ends.
 box(0,2.85,0,8,.3,5,steel);for(const x of [-3.7,3.7])for(const z of [-2.2,2.2])box(x,1.4,z,.25,2.8,.25,steel);
 stairs(-7.75,0,.5,0);stairs(7.75,0,-.5,0);
 for(const z of [-2.48,2.48]){box(0,3.75,z,8,.1,.1,yellow,false);for(const x of [-3.8,-1.3,1.3,3.8])box(x,3.4,z,.06,.8,.06,yellow,false);}
 // An upper container roof can be reached via small steps / crates.
 crate(-14,-4);box(-16, .3,-4,1.6,.6,1.8,darkConcrete);box(-14.1,1.95,-5.5,1.4,1.3,1.4,green);
 crate(14,4);box(16,.3,4,1.6,.6,1.8,darkConcrete);box(14.1,1.95,5.5,1.4,1.3,1.4,green);
 barrier(-7,16,5);barrier(7,-16,5);barrier(0,21,4);barrier(0,-21,4);barrier(-22,-18,4);barrier(22,18,4);
 crate(-7,9);crate(7,-9);crate(-23,-3);crate(23,3);crate(-11,19);crate(11,-19);
 if(night){container(-8,-19,rust);container(8,19,blue);barrier(-17,20,3);barrier(17,-20,3);}else{barrier(-10,-19,5);barrier(10,19,5);}
 for(const [x,z] of [[-22,20],[22,-20],[-4,-13],[4,13]]){
  cylinder(x,.6,z,.42,1.2,rust);cylinder(x+.95,.6,z,.42,1.2,steel);box(x,.6,z,.84,1.2,.84,rust,true);
  cylinder(x,.9,z,.43,.08,yellow);cylinder(x,.3,z,.43,.08,black);
 }
 // Warehouse facades, service doors, ductwork and concrete joints.
 for(const side of [-1,1]){
  box(side*34,7,0,11,14,50,darkConcrete,false);box(side*28.4,6.2,0,.3,.35,53,steel,false);
  for(let z=-22;z<=22;z+=8){box(side*28.42,2.5,z,.12,4.8,5,black,false);box(side*28.34,2.5,z,.08,4.6,4.7,steel,false);for(let y=.4;y<4.8;y+=.3)box(side*28.28,y,z,.05,.035,4.6,silver,false);box(side*28.38,6.8,z,.1,.9,3.8,white,false);}
  for(let z=-22;z<24;z+=4)box(side*28.45,9,z,.12,2.5,2.2,blue,false);
 }
 for(let x=-24;x<28;x+=8){box(x,8,-33,7.8,16,8,darkConcrete,false);box(x,8,33,7.8,16,8,concrete,false);for(const z of [-28.95,28.95])box(x,8,z,5,1.8,.08,steel,false);}
 label('DRYDOCK',0,4.4,-27.42,8,1.1,0,'#263b42','#d6e7be');label('NX INDUSTRIAL / SECTOR 07',0,3.9,27.42,9,.8,Math.PI,'#263b42','#d6e7be');
 label('A',-26.9,2,-7,1.2,1.6,Math.PI/2,'#bba546','#1b292b');label('B',26.9,2,7,1.2,1.6,-Math.PI/2,'#ae6752','#f2e0c0');
 for(const [x,z] of [[-25,-23],[25,23],[-25,23],[25,-23],[0,-25],[0,25]])lamp(x,z);
 // Embedded road markings and drains.
 for(const x of [-25,25])for(let z=-25;z<25;z+=4)box(x,.008,z,.13,.015,2,yellow,false);
 for(let z=-25;z<27;z+=5){box(-4,.01,z,.12,.02,1.7,white,false);box(4,.01,z,.12,.02,1.7,white,false);}
 for(const z of [-24,24]){box(0,.015,z,54,.03,.35,steel,false);for(let x=-26;x<27;x+=.35)box(x,.035,z,.04,.015,.35,black,false);}
 for(const [x,z] of [[-16,-20],[15,14],[-20,4],[10,-4]]){const geo=new T.CircleGeometry(2.8,24),m=new T.MeshStandardMaterial({color:night?0x38494b:0x5a7474,roughness:.18,metalness:.5,transparent:true,opacity:.38,depthWrite:false});resources.push(geo,m);const p=new T.Mesh(geo,m);p.rotation.x=-Math.PI/2;p.position.set(x,.018,z);p.scale.y=.4;scene.add(p);}
 // Distant silhouettes and crane.
 for(let i=0;i<18;i++){const x=-80+random()*160,z=(i%2?-1:1)*(40+random()*60);box(x,5+random()*7,z,5+random()*14,15+random()*20,8+random()*12,darkConcrete,false);}
 cylinder(-38,18,-42,1,36,steel);box(-38,35,-42,1.4,2,1.4,yellow,false);box(-18,35,-42,45,1.2,1.2,yellow,false);box(0,29,-42,.08,11,.08,black,false);box(0,23,-42,1,.8,1,steel,false);
 for(const x of [-40,38])for(const z of [-38,38]){cylinder(x,11,z,2.4,22,silver);cylinder(x,23,z,1.4,2,steel);}
 const skyGeo=new T.SphereGeometry(190,32,16),skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(night?'#101c34':'#447687')},bottom:{value:new T.Color(night?'#647078':'#c9dce8')},sun:{value:new T.Vector3(-.45,.45,-.65).normalize()},night:{value:night?1:0}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top,bottom,sun;uniform float night;void main(){vec3 d=normalize(v);float a=clamp(d.y*.8+.12,0.,1.);vec3 c=mix(bottom,top,pow(a,.55));float s=max(dot(d,sun),0.);c+=vec3(1.,.81,.5)*pow(s,200.)*(1.-night)*1.6;c+=vec3(.4,.5,.6)*pow(s,900.)*night;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});resources.push(skyGeo,skyMat);const sky=new T.Mesh(skyGeo,skyMat);scene.add(sky);
 const hemi=new T.HemisphereLight(night?0xa1b8e0:0xc6e6f1,night?0x27342d:0x5b6350,night?1.15:2.2);scene.add(hemi);
 const sun=new T.DirectionalLight(night?0x9ab6e8:0xe8f2ff,night?.75:3.2);sun.position.set(-25,38,-22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-36;sun.shadow.camera.right=36;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-36;sun.shadow.camera.near=1;sun.shadow.camera.far=110;sun.shadow.bias=-.00025;sun.shadow.normalBias=.025;sun.shadow.radius=2;scene.add(sun);scene.add(sun.target);
 const envScene=new T.Scene();envScene.background=new T.Color(night?0x4e626f:0xa6b9bf);const envLight=new T.Mesh(new T.PlaneGeometry(40,40),new T.MeshBasicMaterial({color:night?0x8ca0af:0xffecd1}));envLight.position.set(-20,25,-20);envLight.lookAt(0,0,0);envScene.add(envLight);const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(envScene,0);scene.environment=env.texture;pmrem.dispose();envLight.geometry.dispose();envLight.material.dispose();resources.push(env);
 for(const [m,matrices] of batches){const inst=new T.InstancedMesh(unitBox,m,matrices.length);matrices.forEach((matrix,i)=>inst.setMatrixAt(i,matrix));inst.castShadow=true;inst.receiveShadow=true;inst.instanceMatrix.needsUpdate=true;inst.computeBoundingSphere();scene.add(inst);}
 // Grid navigation is built from the same collision boxes as player movement.
 const nav=[],grid=new Map(),spacing=2;
 for(let iz=0;iz<25;iz++)for(let ix=0;ix<25;ix++){
  const x=-24+ix*spacing,z=-24+iz*spacing;
  if(boxes.some(b=>b.max.y>.2&&b.min.y<1.8&&x>b.min.x-.48&&x<b.max.x+.48&&z>b.min.z-.48&&z<b.max.z+.48))continue;
  const node={x,y:.9,z,ix,iz,edges:[]};grid.set(`${ix},${iz}`,nav.length);nav.push(node);
 }
 nav.forEach(n=>{for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const idx=grid.get(`${n.ix+dx},${n.iz+dz}`);if(idx!==undefined&&visible(n,nav[idx],boxes))n.edges.push(idx);}});
 const spawns=[[-22,-22],[22,22],[-22,22],[22,-22],[0,-24],[0,24],[-24,0],[24,0],[-12,-24],[12,-24],[-12,24],[12,24]].map(([x,z])=>({x,y:0,z}));
 return{scene,boxes,nav,spawns,sun,night,label,decor,dispose(){scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.geometry&&!resources.includes(o.geometry))o.geometry.dispose();});for(const r of resources)r.dispose();scene.clear();}};
}
export function findPath(nav,start,goal){
 const nearest=p=>{let best=0,dist=Infinity;nav.forEach((n,i)=>{const d=(n.x-p.x)**2+(n.z-p.z)**2;if(d<dist){dist=d;best=i;}});return best;};
 const a=nearest(start),b=nearest(goal);if(a===b)return[{x:goal.x,y:0,z:goal.z}];
 const queue=[a],prev=new Map([[a,-1]]);let head=0;
 while(head<queue.length){const i=queue[head++];if(i===b)break;for(const j of nav[i].edges)if(!prev.has(j)){prev.set(j,i);queue.push(j);}}
 if(!prev.has(b))return[];const out=[];for(let i=b;i!==a;i=prev.get(i))out.unshift(nav[i]);return out;
}
