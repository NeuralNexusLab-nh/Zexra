export const BOT_TUNING=Object.freeze({
 easy:{speed:3.3,reaction:1.2,spread:.10,interval:.30,damage:12},
 normal:{speed:4.2,reaction:.76,spread:.050,interval:.23,damage:15},
 hard:{speed:5.2,reaction:.42,spread:.029,interval:.18,damage:18}
});
export const MODE_NAMES={tdm:'TEAM DEATHMATCH',ffa:'FREE FOR ALL',zombies:'DEAD SIGNAL',range:'FREE RANGE'};
export function buildRoster(mode,size=1){
 size=Math.max(1,Math.min(5,Math.floor(Number(size)||1)));
 if(mode==='range')return Array.from({length:6},(_,i)=>({id:i+1,team:i+1,friendly:false}));
 if(mode==='zombies')return[];
 return Array.from({length:size*2-1},(_,i)=>({id:i+1,team:mode==='tdm'?(i<size-1?0:1):i+1,friendly:mode==='tdm'&&i<size-1}));
}
export function hostile(a,b,mode){
 if(a===b)return false;
 if(mode==='range')return a.id===0;
 return mode==='tdm'||mode==='zombies'?a.team!==b.team:true;
}
export function matchScores(player,bots,mode){
 if(mode==='tdm')return[player.kills+bots.filter(b=>b.team===0).reduce((n,b)=>n+b.kills,0),bots.filter(b=>b.team===1).reduce((n,b)=>n+b.kills,0)];
 return[player.kills,Math.max(0,...bots.map(b=>b.kills))];
}
export function waveSpec(wave){
 const n=Math.max(1,Math.floor(wave));return{count:4+n*3,health:Math.min(75+n*9,210),speed:Math.min(1.65+n*.13,3.6),damage:18,concurrent:Math.min(8+n*2,18)};
}
export class HordeDirector{
 constructor(){this.number=0;this.pending=0;this.wait=4;this.spawnIn=0;this.active=false;}
 get spec(){return waveSpec(this.number);}
 tick(dt,alive){
  if(!this.active){this.wait=Math.max(0,this.wait-dt);if(this.wait>0)return null;this.number++;this.pending=this.spec.count;this.spawnIn=0;this.active=true;return'begin';}
  if(this.pending>0){this.spawnIn-=dt;if(alive<this.spec.concurrent&&this.spawnIn<=0){this.pending--;this.spawnIn=.8;return'spawn';}return null;}
  if(alive===0){this.active=false;this.wait=8;return'clear';}return null;
 }
}
export function safeSpawn(spawns,enemies,allActors=[]){
 let best=spawns[0],score=-Infinity;
 for(const s of spawns){const threat=Math.min(60,...enemies.filter(a=>a.alive).map(a=>Math.hypot(s.x-a.x,s.z-a.z))),occupied=allActors.some(a=>a.alive&&Math.hypot(s.x-a.x,s.z-a.z)<1.2);const value=threat-(occupied?100:0);if(value>score){score=value;best=s;}}
 return best;
}
