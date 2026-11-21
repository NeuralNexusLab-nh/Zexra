// Normalized, deterministic reload choreography shared by every weapon.
const smooth=(a,b,t)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};
export function reloadPose(id,progress){
 const t=Math.max(0,Math.min(1,progress)),clip=id==='garand',top=id==='p90'||clip;
 const remove=smooth(.08,.30,t),insert=smooth(.54,.76,t);
 const oldVisible=!clip&&t>=.08&&t<.34,newVisible=t>=.44&&t<.76;
 const travel=top?.43:-.55,fore=id==='vcr2'?.19:id==='pistol'?.08:id==='p90'?-.24:-.24;
 return{work:smooth(0,.12,t)*(1-smooth(.90,1,t)),oldVisible,newVisible,
  oldY:remove*travel,oldZ:remove*.20,newY:(1-insert)*travel,newZ:(1-insert)*.20,
  seated:clip?t>=.76:t<.08||t>=.76,
  bolt:t>=.94?0:Math.sin(smooth(.79,.94,t)*Math.PI)*.14,
  handY:t<.36?remove*travel:t<.44?travel:(1-insert)*travel,
  handZ:fore,phase:t<.08?'RELEASE':t<.34?'REMOVE':t<.44?'REACH':t<.76?'INSERT':t<.94?'CHARGE':'READY'};
}
