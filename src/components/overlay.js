import {motion} from '../data.js';
export class Overlay {
  constructor(element,scroll){this.el=element;this.scroll=scroll;this.closeTimer=0;
    element.addEventListener('click',e=>{if(e.target===element||e.target.closest('[data-close]'))this.close();});
    document.addEventListener('keydown',e=>{
      if(element.hidden)return;
      if(e.key==='Escape'){e.preventDefault();this.close();}
      if(e.key==='Tab'){
        const items=[...element.querySelectorAll('button:not(:disabled),a[href],input,textarea,[tabindex="0"]')].filter(x=>x.offsetParent!==null);
        const first=items[0],last=items.at(-1);
        if(!element.contains(document.activeElement)){e.preventDefault();first?.focus();}
        else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    });
  }
  open(){clearTimeout(this.closeTimer);this.previous=document.activeElement;this.el.hidden=false;document.body.classList.add('modal-open');document.querySelector('#invitation').inert=true;document.querySelector('#floating-controls').inert=true;this.scroll.hold('overlay',true);requestAnimationFrame(()=>this.el.classList.add('visible'));this.el.querySelector('button')?.focus();}
  close(){this.el.classList.remove('visible');this.closeTimer=setTimeout(()=>{
    this.el.hidden=true;document.body.classList.remove('modal-open');document.querySelector('#invitation').inert=false;document.querySelector('#floating-controls').inert=false;this.scroll.hold('overlay',false);this.scroll.pauseBriefly();this.previous?.focus({preventScroll:true});
  },motion.overlay);}
}
