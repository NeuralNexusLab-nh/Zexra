export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
export function lookVector(yaw,pitch){return{x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)};}
export function movementVector(yaw,forward,right){return{x:-Math.sin(yaw)*forward+Math.cos(yaw)*right,z:-Math.cos(yaw)*forward-Math.sin(yaw)*right};}
export function rayBox(o,d,b,max=Infinity){
  let lo=0,hi=max;
  for(const k of ['x','y','z']){
    if(Math.abs(d[k])<1e-8){if(o[k]<b.min[k]||o[k]>b.max[k])return Infinity;continue;}
    let a=(b.min[k]-o[k])/d[k],c=(b.max[k]-o[k])/d[k];
    if(a>c)[a,c]=[c,a];lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return Infinity;
  }return lo;
}
export function raySphere(o,d,c,r){const x=o.x-c.x,y=o.y-c.y,z=o.z-c.z,b=x*d.x+y*d.y+z*d.z,q=b*b-(x*x+y*y+z*z-r*r);if(q<0)return Infinity;const a=-b-Math.sqrt(q);return a>=0?a:Infinity;}
export function wallDistance(o,d,boxes,max=Infinity){let t=max;for(const b of boxes)t=Math.min(t,rayBox(o,d,b,t));return t;}
export function visible(a,b,boxes){const d={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},l=Math.hypot(d.x,d.y,d.z);if(l<.001)return true;d.x/=l;d.y/=l;d.z/=l;return wallDistance(a,d,boxes,l)>l-.05;}
export function makeBody(x=0,z=0){return{x,y:0,z,vx:0,vy:0,vz:0,grounded:true,height:1.8,radius:.32,slide:0,slideCD:0,coyote:.1,jumpBuffer:0};}
function intersectsXZ(p,b,pad=p.radius){const x=clamp(p.x,b.min.x,b.max.x),z=clamp(p.z,b.min.z,b.max.z);return (p.x-x)**2+(p.z-z)**2<pad*pad;}
export function canStand(p,boxes){return !boxes.some(b=>b.min.y<p.y+1.8-.02&&b.max.y>p.y+1.15&&intersectsXZ(p,b));}
export function moveBody(p,dt,boxes,step=.3){
  const prevY=p.y,wasGrounded=p.grounded;
  for(const axis of ['x','z']){
    p[axis]+=p[axis==='x'?'vx':'vz']*dt;
    for(const b of boxes){
      if(b.max.y<=p.y+.02||b.min.y>=p.y+p.height-.02||!intersectsXZ(p,b))continue;
      if(wasGrounded&&b.max.y-p.y<=step&&b.max.y-p.y>0){
        const old=p.y;p.y=b.max.y;
        if(!boxes.some(c=>c!==b&&c.min.y<p.y+p.height-.02&&c.max.y>p.y+.02&&intersectsXZ(p,c)))continue;
        p.y=old;
      }
      const other=axis==='x'?'z':'x',nearest=clamp(p[other],b.min[other],b.max[other]),r=Math.sqrt(Math.max(0,p.radius*p.radius-(p[other]-nearest)**2));
      const center=(b.min[axis]+b.max[axis])*.5;
      p[axis]=p[axis]<center?b.min[axis]-r-.0001:b.max[axis]+r+.0001;
      p[axis==='x'?'vx':'vz']=0;
    }
  }
  p.vy-=22*dt;p.y+=p.vy*dt;p.grounded=false;
  let floor=0;
  for(const b of boxes){if(!intersectsXZ(p,b))continue;
    if(p.vy<=0&&b.max.y<=Math.max(prevY,p.y)+.035&&b.max.y>=p.y)floor=Math.max(floor,b.max.y);
    if(p.vy>0&&prevY+p.height<=b.min.y+.02&&p.y+p.height>b.min.y){p.y=b.min.y-p.height;p.vy=0;}
  }
  if(p.y<=floor){p.y=floor;p.vy=0;p.grounded=true;}
  p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);
}
export function accelerate(p,dx,dz,speed,dt,air=false){const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len;}const k=air?3.3:17;p.vx=damp(p.vx,dx*speed,k,dt);p.vz=damp(p.vz,dz*speed,k,dt);}
export function damageAt(base,distance,range,head=false){return Math.round(base*(head?2:1)*Math.max(.45,1-Math.max(0,distance-range)/(range*3)));}
export const WEAPONS=[
 {id:'ak47',name:'AK-47',type:'ASSAULT RIFLE',caliber:'7.62 × 39',mag:30,reserve:180,damage:33,interval:.10,reload:2.35,spread:.014,recoil:.021,range:30,auto:true,pellets:1,zoom:60},
 {id:'vcr2',name:'VCR2',type:'ASSAULT RIFLE',caliber:'5.56 × 45',mag:30,reserve:180,damage:27,interval:.08,reload:2.1,spread:.011,recoil:.013,range:35,auto:true,pellets:1,zoom:58},
 {id:'mp5',name:'MP5',type:'SUBMACHINE GUN',caliber:'9 × 19',mag:30,reserve:180,damage:22,interval:.075,reload:1.85,spread:.015,recoil:.009,range:16,auto:true,pellets:1,zoom:64},
 {id:'awp',name:'AWP',type:'BOLT-ACTION RIFLE',caliber:'7.62 × 51',mag:10,reserve:50,damage:100,interval:1.35,reload:2.9,spread:.023,recoil:.045,range:70,auto:false,pellets:1,zoom:25},
 {id:'garand',name:'M1 Garand',type:'SEMI-AUTOMATIC RIFLE',caliber:'.30-06 SPRINGFIELD',mag:8,reserve:64,damage:52,interval:.28,reload:2.4,spread:.015,recoil:.028,range:50,auto:false,pellets:1,zoom:50},
 {id:'pistol',name:'P-19',type:'SIDEARM',caliber:'9 × 19',mag:17,reserve:85,damage:30,interval:.20,reload:1.45,spread:.016,recoil:.023,range:18,auto:false,pellets:1,zoom:64}
];
export const PRIMARY_COUNT=5,SIDEARM_INDEX=5;
