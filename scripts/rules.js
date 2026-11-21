export const BOT_TUNING=Object.freeze({
 easy:{speed:3.2,reaction:1.35,spread:.13,interval:.36,damage:9},
 normal:{speed:3.9,reaction:1.15,spread:.11,interval:.34,damage:10},
 hard:{speed:4.7,reaction:.62,spread:.05,interval:.23,damage:15}
});
export const MODE_NAMES={elimination:'ELIMINATION',tdm:'TEAM DEATHMATCH',ffa:'FREE FOR ALL',zombies:'DEAD SIGNAL',range:'SHOOTING RANGE'};
export const teamMode=mode=>mode==='tdm'||mode==='elimination';
export function buildRoster(mode,size=1){
 size=Math.max(1,Math.min(5,Math.floor(Number(size)||1)));
 if(mode==='range')return Array.from({length:6},(_,i)=>({id:i+1,team:i+1,friendly:false}));
 if(mode==='zombies')return[];
 if(mode!=='elimination')size=5;
 return Array.from({length:size*2-1},(_,i)=>({id:i+1,team:teamMode(mode)?(i<size-1?0:1):i+1,friendly:teamMode(mode)&&i<size-1}));
}
export function hostile(a,b,mode){
 if(a===b)return false;
 if(mode==='range')return a.id===0;
 return teamMode(mode)||mode==='zombies'?a.team!==b.team:true;
}
// null means the round continues; -1 means a draw. Timeouts compare survivors, then health.
export function eliminationWinner(actors,timeout=false){
 const alive=[actors.filter(a=>a.alive&&a.team===0),actors.filter(a=>a.alive&&a.team===1)];
 if(!alive[0].length||!alive[1].length)return !alive[0].length&&!alive[1].length?-1:alive[0].length?0:1;
 if(!timeout)return null;
 const count=alive[0].length-alive[1].length;if(count)return count>0?0:1;
 const health=alive[0].reduce((n,a)=>n+a.hp,0)-alive[1].reduce((n,a)=>n+a.hp,0);return health===0?-1:health>0?0:1;
}
export function matchScores(player,bots,mode){
 if(mode==='tdm')return[player.kills+bots.filter(b=>b.team===0).reduce((n,b)=>n+b.kills,0),bots.filter(b=>b.team===1).reduce((n,b)=>n+b.kills,0)];
 return[player.kills,Math.max(0,...bots.map(b=>b.kills))];
}
export function waveSpec(wave,difficulty='normal'){
 const n=Math.max(1,Math.floor(wave)),tuning=difficulty==='easy'?{count:.8,health:.8,speed:.85,damage:14,windup:.6,attackCD:1.85}:difficulty==='hard'?{count:1.15,health:1.2,speed:1.12,damage:22,windup:.36,attackCD:1.3}:{count:1,health:1,speed:1,damage:18,windup:.45,attackCD:1.55};
 return{count:Math.ceil((4+n*3)*tuning.count),health:Math.round(Math.min(75+n*9,210)*tuning.health),speed:Math.min(Math.min(1.65+n*.13,3.6)*tuning.speed,3.9),damage:tuning.damage,windup:tuning.windup,attackCD:tuning.attackCD,concurrent:Math.min(8+n*2,18)};
}
export class HordeDirector{
 constructor(difficulty='normal'){this.difficulty=difficulty;this.number=0;this.pending=0;this.wait=4;this.spawnIn=0;this.active=false;}
 get spec(){return waveSpec(this.number,this.difficulty);}
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
