import {visible} from './physics.js?asset=92beea4cf702';
const T=window.THREE;
export function createHorrorWorld(renderer){
 const scene=new T.Scene(),boxes=[],resources=[],batch=new Map();scene.background=new T.Color('#090b19');scene.fog=new T.FogExp2('#222035',.032);
 const material=(color,roughness=.96)=>{const m=new T.MeshStandardMaterial({color,roughness});resources.push(m);return m;};
 const stone=material('#57606a'),oldStone=material('#414956'),soil=material('#242d30'),iron=material('#252535'),wood=material('#3d3139'),moss=material('#374c42');
 const boxGeo=new T.BoxGeometry(1,1,1);resources.push(boxGeo);
 function box(x,y,z,w,h,d,mat=stone,solid=true){if(!batch.has(mat))batch.set(mat,[]);batch.get(mat).push(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion(),new T.Vector3(w,h,d)));if(solid)boxes.push({min:{x:x-w/2,y:y-h/2,z:z-d/2},max:{x:x+w/2,y:y+h/2,z:z+d/2}});}
 function cylinder(x,y,z,r,h,mat=iron){const g=new T.CylinderGeometry(r,r,h,8),m=new T.Mesh(g,mat);resources.push(g);m.position.set(x,y,z);m.castShadow=true;scene.add(m);return m;}
 function light(x,y,z,color,power){const lampMat=new T.MeshBasicMaterial({color}),g=new T.SphereGeometry(.09,6,4);resources.push(lampMat,g);const bulb=new T.Mesh(g,lampMat);bulb.position.set(x,y,z);scene.add(bulb);const lamp=new T.PointLight(color,power,12,1.5);lamp.position.set(x,y,z);scene.add(lamp);return lamp;}
 box(0,-.25,0,58,.5,58,soil);
 for(const x of [-27,27])box(x,2,0,.8,4,55,oldStone);
 for(const z of [-27,27])box(0,2,z,55,4,.8,oldStone);
 // Open central avenue, grave plots and two ruined memorial halls.
 box(0,.012,0,7,.025,52,stone,false);box(0,.02,4,48,.02,4,oldStone,false);
 for(const side of [-1,1])for(const z of [-18,-10,12,20])for(const x of [9,16,22]){
  box(x*side,.12,z,1.8,.24,2.9,moss,false);box(x*side,.45,z-.9,1.1,.9,.28,oldStone);box(x*side,.91,z-.9,1.22,.12,.35,stone,false);
  if((x+z)%3===0){box(x*side,1.1,z-.9,.15,.55,.2,stone,false);box(x*side,1.19,z-.9,.5,.12,.2,stone,false);}
 }
 for(const x of [-16,16]){
  box(x,1.8,-1,8,3.6,.6,oldStone);box(x-3.7,1.8,-4,.6,3.6,6,stone);box(x+3.7,1.8,-4,.6,3.6,6,stone);
  box(x-2.6,1.6,-7,2.2,3.2,.6,stone);box(x+2.6,1.6,-7,2.2,3.2,.6,stone);box(x,3.3,-7,3.2,.6,.8,oldStone);
  for(const d of [-1,1])cylinder(x+d*1.6,1.4,-7.4,.18,2.8,stone);
  box(x,.4,-4,2.8,.8,1.2,oldStone);
  box(x,3.9,-1,8.4,.2,1.4,oldStone,false);
 }
 for(const [x,z] of [[-7,-21],[7,21],[-22,5],[22,5]]){box(x,.4,z,2.8,.8,1,wood);box(x,1,z,.2,.5,.2,iron,false);}
 // Perimeter fencing, dead trees, scattered masonry and violet security lamps.
 for(let x=-24;x<=24;x+=3){box(x,3.5,-27,.06,2,.06,iron,false);box(x,3.5,27,.06,2,.06,iron,false);}
 for(const z of [-27,27])box(0,4.2,z,53,.06,.06,iron,false);
 for(const [x,z] of [[-24,-24],[24,24],[-24,24],[24,-24],[-7,0],[7,0]]){
  cylinder(x,2,z,.12,4);const branch=cylinder(x+.55,3.1,z,.07,1.7);branch.rotation.z=-.7;cylinder(x-.3,3.5,z,.05,1.3).rotation.z=.5;
 }
 const lamps=[];for(const [x,z] of [[-4,-20],[4,20],[-22,3],[22,3]]){cylinder(x,1.9,z,.055,3.8);lamps.push(light(x,3.8,z,0xb38bff,10));}
 light(-16,2.2,-3,0xc29a87,4);light(16,2.2,-3,0xb08aff,5);
 const moon=new T.Mesh(new T.SphereGeometry(3,16,12),new T.MeshBasicMaterial({color:0xb1b9d8}));moon.position.set(-40,55,-80);resources.push(moon.geometry,moon.material);scene.add(moon);
 const sun=new T.DirectionalLight(0x9faee0,1.15);sun.position.set(-24,36,-18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:100});sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;scene.add(sun,sun.target);scene.add(new T.HemisphereLight(0x7f82b4,0x333c35,1.05));
 // Low drifting ground mist; capped count and no expensive postprocessing.
 const mistGeo=new T.PlaneGeometry(12,4);resources.push(mistGeo);const mist=[];
 const c=document.createElement('canvas');c.width=128;c.height=64;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(64,32,1,64,32,60);gradient.addColorStop(0,'rgba(160,168,185,.22)');gradient.addColorStop(1,'rgba(160,168,185,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,64);const texture=new T.CanvasTexture(c),mistMat=new T.MeshBasicMaterial({map:texture,transparent:true,opacity:.24,depthWrite:false,side:T.DoubleSide});resources.push(texture,mistMat);
 for(let i=0;i<8;i++){const p=new T.Mesh(mistGeo,mistMat);p.rotation.x=-Math.PI/2;p.position.set((i%4-1.5)*12,.1+i*.012,(Math.floor(i/4)-.5)*25);scene.add(p);mist.push(p);}
 for(const [mat,matrices] of batch){const inst=new T.InstancedMesh(boxGeo,mat,matrices.length);matrices.forEach((m,i)=>inst.setMatrixAt(i,m));inst.castShadow=inst.receiveShadow=true;inst.computeBoundingSphere();scene.add(inst);}
 const nav=[],grid=new Map();for(let iz=0;iz<25;iz++)for(let ix=0;ix<25;ix++){const x=-24+ix*2,z=-24+iz*2;if(boxes.some(b=>b.max.y>.2&&b.min.y<1.8&&x>b.min.x-.5&&x<b.max.x+.5&&z>b.min.z-.5&&z<b.max.z+.5))continue;grid.set(`${ix},${iz}`,nav.length);nav.push({x,y:.9,z,ix,iz,edges:[]});}
 nav.forEach(n=>{for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const i=grid.get(`${n.ix+dx},${n.iz+dz}`);if(i!==undefined&&visible(n,nav[i],boxes))n.edges.push(i);}});
 const spawns=[[-24,-22],[24,22],[-24,22],[24,-22],[0,-24],[0,24],[-24,4],[24,4],[-8,-24],[8,24]].map(([x,z])=>({x,y:0,z}));
 return{scene,boxes,nav,spawns,sun,night:true,theme:'horror',update(t){mist.forEach((p,i)=>p.position.x=(i%4-1.5)*12+Math.sin(t*.09+i)*2);lamps.forEach((l,i)=>l.intensity=9+Math.sin(t*1.9+i*4)*.6);},dispose(){for(const r of resources)r.dispose();scene.clear();}};
}
