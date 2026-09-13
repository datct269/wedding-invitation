import {motion} from './data.js';
export class AutoScroll {
  constructor(onChange, reduced=false){
    this.enabled=false;this.reduced=reduced;this.reasons=new Set();this.until=0;this.onChange=onChange;this.frame=0;this.last=0;
    const interact=()=>this.pauseBriefly();
    window.addEventListener('wheel',interact,{passive:true});
    window.addEventListener('touchstart',interact,{passive:true});
    window.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))interact();});
    document.addEventListener('visibilitychange',()=>this.hold('hidden',document.hidden));
  }
  set(value){this.enabled=value;this.last=0;this.onChange?.(value);cancelAnimationFrame(this.frame);if(value)this.frame=requestAnimationFrame(t=>this.tick(t));}
  hold(reason,value){value?this.reasons.add(reason):this.reasons.delete(reason);this.last=0;}
  pauseBriefly(ms=motion.interactionPause){this.until=performance.now()+ms;this.last=0;}
  tick(now){
    if(!this.enabled)return;
    if(this.last&&!this.reasons.size&&now>=this.until){
      if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-3){this.set(false);return;}
      this.position=(this.position??window.scrollY)+motion.autoScrollSpeed*Math.min((now-this.last)/1000,0.05);
      window.scrollTo(0,this.position);
    }else this.position=window.scrollY;
    this.last=now;this.frame=requestAnimationFrame(t=>this.tick(t));
  }
}
