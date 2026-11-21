export class SoundEngine{
 constructor(){this.ctx=null;this.volume=.65;this.enabled=true;this.buffers=new Map();}
 async start(){
  if(this.ctx){await this.ctx.resume();return;}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=this.ctx=new AC();
  const compressor=c.createDynamicsCompressor();compressor.threshold.value=-14;compressor.knee.value=16;compressor.ratio.value=5;compressor.attack.value=.002;compressor.release.value=.15;
  this.master=c.createGain();this.master.gain.value=this.volume*.65;this.master.connect(compressor);compressor.connect(c.destination);
  this.reverb=c.createConvolver();const impulse=c.createBuffer(2,c.sampleRate*1.2,c.sampleRate);for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3)*.32;}this.reverb.buffer=impulse;const wet=c.createGain();wet.gain.value=.24;this.reverb.connect(wet);wet.connect(this.master);
  const wind=this.noiseBuffer(3),s=c.createBufferSource();s.buffer=wind;s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=240;this.ambient=c.createGain();this.ambient.gain.value=.022;s.connect(f);f.connect(this.ambient);this.ambient.connect(this.master);s.start();
 }
 setVolume(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value*.65,this.ctx.currentTime,.04);}
 pause(value){this.paused=value;if(this.ambient)this.ambient.gain.setTargetAtTime(value?.008:.022,this.ctx.currentTime,.1);if(this.droneGain)this.droneGain.gain.setTargetAtTime(!value&&this.horror?.008:0,this.ctx.currentTime,.2);}
 setHorror(enabled){this.horror=enabled;if(!this.ctx)return;const c=this.ctx;if(!this.droneGain){this.droneGain=c.createGain();this.droneGain.gain.value=0;this.droneGain.connect(this.master);const tone=c.createOscillator();tone.type='sine';tone.frequency.value=43;tone.connect(this.droneGain);tone.start();}this.droneGain.gain.setTargetAtTime(enabled&&!this.paused?.008:0,c.currentTime,.8);}
 growl(position){if(!this.ctx||!this.enabled)return;const out=this.route(position);this.tone(90,43,.65,.065,out,0,'sawtooth');this.noise(.55,.09,330,out,.02,true);setTimeout(()=>out.disconnect(),1000);}
 noiseBuffer(seconds){const key='noise'+seconds;if(this.buffers.has(key))return this.buffers.get(key);const b=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*seconds),this.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.buffers.set(key,b);return b;}
 route(position,occluded=false){
  const c=this.ctx,filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=occluded?800:18000;
  if(position){const p=c.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=3;p.maxDistance=75;p.rolloffFactor=1.25;p.positionX.value=position.x;p.positionY.value=position.y;p.positionZ.value=position.z;filter.connect(p);p.connect(this.master);p.connect(this.reverb);}else{filter.connect(this.master);filter.connect(this.reverb);}return filter;
 }
 noise(duration,volume,hz,out,delay=0,band=false){if(!this.ctx)return;const c=this.ctx,t=c.currentTime+delay,s=c.createBufferSource(),gain=c.createGain(),f=c.createBiquadFilter();s.buffer=this.noiseBuffer(Math.max(duration,.1));f.type=band?'bandpass':'lowpass';f.frequency.value=hz;f.Q.value=band?.7:.7;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.002);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(gain);gain.connect(out||this.master);s.start(t);s.stop(t+duration+.01);s.onended=()=>{s.disconnect();f.disconnect();gain.disconnect();};}
 tone(hz,end,duration,volume,out,delay=0,type='sine'){if(!this.ctx)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,end),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(out||this.master);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};}
 shot(id='carbine',pos=null,occluded=false){if(!this.ctx||!this.enabled)return;const out=this.route(pos,occluded),heavy=id==='barrett'||id==='shotgun'||id==='awp'||id==='garand',small=id==='mp5'||id==='p90'||id==='pistol';this.noise(heavy?.38:.22,heavy?1:.65,small?5700:3900,out);this.noise(.035,.55,12000,out);this.tone(heavy?135:190,heavy?33:55,.15,heavy?.7:.42,out);this.noise(.27,.15,1500,out,.025);this.tone(2600,1700,.035,.026,out,.045,'triangle');if(!pos){this.noise(.055,.09,4300,out,.09,true);this.noise(.08,.035,7200,out,.19,true);}setTimeout(()=>out.disconnect(),1200);}
 step(metal=false,pos=null,sprint=false){if(!this.ctx||!this.enabled)return;const out=this.route(pos);this.noise(metal?.11:.09,sprint?.21:.14,metal?2800:1300,out);this.tone(metal?310:120,metal?190:65,.075,metal?.025:.06,out);if(metal)this.tone(720,660,.12,.012,out,.01,'triangle');setTimeout(()=>out.disconnect(),400);}
 reload(stage=0){if(!this.ctx)return;this.noise(stage===1?.12:.055,.17,stage===1?2200:4800);this.tone(stage===1?190:1300,stage===1?80:500,.04,.04,null,0,'triangle');}
 hit(head=false){this.tone(head?1400:850,head?1900:1100,.045,.08,null,0,'triangle');}
 ping(){this.tone(2400,1600,.5,.12,null,0,'sine');this.tone(3550,3100,.35,.05,null,.012,'sine');}
 knife(){this.noise(.18,.16,2400);}
 jump(){this.noise(.11,.09,850);}
 grenade(pos=null,blocked=false){if(!this.ctx)return;const out=this.route(pos,blocked);this.noise(1.1,1.25,1700,out);this.noise(.07,.8,6500,out);this.tone(100,24,.7,1,out);setTimeout(()=>out.disconnect(),1800);}
 update(pos,yaw,pitch){if(!this.ctx)return;const l=this.ctx.listener;if(l.positionX){l.positionX.value=pos.x;l.positionY.value=pos.y;l.positionZ.value=pos.z;l.forwardX.value=-Math.sin(yaw)*Math.cos(pitch);l.forwardY.value=Math.sin(pitch);l.forwardZ.value=-Math.cos(yaw)*Math.cos(pitch);l.upX.value=0;l.upY.value=1;l.upZ.value=0;}else{l.setPosition(pos.x,pos.y,pos.z);l.setOrientation(-Math.sin(yaw),Math.sin(pitch),-Math.cos(yaw),0,1,0);}}
}
