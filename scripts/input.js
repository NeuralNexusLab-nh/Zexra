// A rejected lock must never permanently disable mouse look or future retries.
export class MouseLookTracker{
 constructor(){this.reset();}
 reset(){this.last=null;}
 delta(event,locked){
  const x=Number(event.clientX),y=Number(event.clientY),previous=this.last;
  if(Number.isFinite(x)&&Number.isFinite(y))this.last={x,y};
  let dx=Number(event.movementX)||0,dy=Number(event.movementY)||0;
  if(!locked){if(!previous||!this.last)return{x:0,y:0};dx=x-previous.x;dy=y-previous.y;}
  return{x:Math.max(-600,Math.min(600,dx)),y:Math.max(-600,Math.min(600,dy))};
 }
}
