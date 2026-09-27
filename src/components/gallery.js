import {invitationData as d,motion} from '../data.js';
import {image,icon,escapeHTML as e} from '../lib.js';
import {Overlay} from './overlay.js';
export const wrapIndex=(index,length)=>(index%length+length)%length;
export function PhotoGallery(){return `<section class="gallery-section" id="gallery" aria-label="Album ảnh cưới"><h2>ALBUM ẢNH</h2><div class="gallery-stage"><div class="gallery-perspective">${d.gallery.map((p,i)=>`<button class="gallery-photo" data-photo="${i}" aria-label="Xem ảnh cưới ${i+1}">${image(p.src,p.alt,'','lazy',p.position)}</button>`).join('')}</div><button class="gallery-arrow prev icon-button" aria-label="Ảnh trước">${icon('left')}</button><button class="gallery-arrow next icon-button" aria-label="Ảnh sau">${icon('right')}</button></div><div class="gallery-dots" aria-label="Chọn ảnh">${d.gallery.map((p,i)=>`<button data-dot="${i}" aria-label="Tới ảnh ${i+1}"><span></span></button>`).join('')}</div></section>`;}
export function PhotoLightbox(){return `<div class="overlay lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="Album ảnh cưới"><button class="overlay-close icon-button" data-close aria-label="Đóng album">${icon('close')}</button><p class="lightbox-counter" aria-live="polite"></p><div class="lightbox-image-area"><div class="zoom-pan"><img class="lightbox-image" alt="" decoding="async"></div></div><button class="lightbox-prev icon-button" aria-label="Ảnh trước">${icon('left')}</button><button class="lightbox-next icon-button" aria-label="Ảnh sau">${icon('right')}</button><div class="lightbox-bottom"><div class="zoom-controls"><button class="icon-button" data-zoom="-1" aria-label="Thu nhỏ">${icon('minus')}</button><button class="zoom-reset" aria-label="Đặt lại thu phóng">100%</button><button class="icon-button" data-zoom="1" aria-label="Phóng to">${icon('plus')}</button></div><div class="thumbnails">${d.gallery.map((p,i)=>`<button data-thumb="${i}" aria-label="Ảnh thu nhỏ ${i+1}">${image(p.thumbnailSrc||p.src,p.alt)}</button>`).join('')}</div></div></div>`;}
export function mountGallery(scroll,reduced){
  const root=document.querySelector('#gallery'), cards=[...root.querySelectorAll('[data-photo]')],dots=[...root.querySelectorAll('[data-dot]')];
  const box=document.querySelector('#lightbox'),overlay=new Overlay(box,scroll), photo=box.querySelector('.lightbox-image'),pan=box.querySelector('.zoom-pan');
  const canHover=matchMedia('(hover: hover) and (pointer: fine)').matches;
  let active=0,lightIndex=0,zoom=1,panX=0,panY=0,interactionUntil=0,visible=false,pointer=null,lightPointer=null;
  function pause(){interactionUntil=performance.now()+motion.interactionPause;scroll.pauseBriefly();}
  function update(index){active=wrapIndex(index,cards.length);cards.forEach((card,i)=>{
    let offset=wrapIndex(i-active+Math.floor(cards.length/2),cards.length)-Math.floor(cards.length/2);offset=Math.max(-4,Math.min(4,offset));
    const a=Math.abs(offset);card.style.transform=`translateX(${offset*60}%) translateZ(${-a*150}px) rotateY(${offset*45}deg) scale(${a===0?1:a===1?.85:.7})`;
    card.style.opacity=a===0?1:a===1?.75:a===2?.5:.3;card.style.zIndex=100-a;card.classList.toggle('active',i===active);card.tabIndex=i===active?0:-1;
  });dots.forEach((dot,i)=>{dot.classList.toggle('active',i===active);dot.setAttribute('aria-pressed',String(i===active));});}
  const navigate=step=>{pause();update(active+step);};
  root.querySelector('.prev').onclick=()=>navigate(-1);root.querySelector('.next').onclick=()=>navigate(1);
  dots.forEach((dot,i)=>dot.onclick=()=>{pause();update(i);});
  cards.forEach((card,i)=>card.onclick=()=>{if(pointer?.swiped)return;pause();if(i===active){showLight(i);overlay.open();}else update(i);});
  root.addEventListener('pointerdown',ev=>{pointer={x:ev.clientX,y:ev.clientY,swiped:false};scroll.hold('gallery-focus',false);pause();});
  root.addEventListener('dragstart',ev=>ev.preventDefault());
  root.addEventListener('pointerup',ev=>{if(!pointer)return;const dx=ev.clientX-pointer.x,dy=ev.clientY-pointer.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){pointer.swiped=true;navigate(dx<0?1:-1);}});
  root.addEventListener('pointercancel',()=>pointer=null);
  root.addEventListener('mouseenter',()=>{if(canHover)scroll.hold('gallery-hover',true);});root.addEventListener('mouseleave',()=>{scroll.hold('gallery-hover',false);pause();});
  root.addEventListener('focusin',ev=>scroll.hold('gallery-focus',ev.target.matches(':focus-visible')));root.addEventListener('focusout',ev=>{if(!root.contains(ev.relatedTarget)){scroll.hold('gallery-focus',false);pause();}});
  new IntersectionObserver(([entry])=>visible=entry.isIntersecting,{threshold:.25}).observe(root);
  setInterval(()=>{if(!reduced&&visible&&!document.hidden&&box.hidden&&performance.now()>interactionUntil&&!(canHover&&root.matches(':hover'))&&!root.querySelector(':focus-visible'))update(active+1);},motion.galleryAutoplay);
  function applyZoom(){photo.style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;pan.classList.toggle('zoomed',zoom>1);box.querySelector('.zoom-reset').textContent=`${Math.round(zoom*100)}%`;box.querySelector('[data-zoom="-1"]').disabled=zoom===1;box.querySelector('[data-zoom="1"]').disabled=zoom>=3;}
  function showLight(i){lightIndex=wrapIndex(i,d.gallery.length);const p=d.gallery[lightIndex];photo.src=p.lightboxSrc||p.src;delete photo.dataset.fallback;photo.alt=p.alt;zoom=1;panX=panY=0;applyZoom();box.querySelector('.lightbox-counter').textContent=`${lightIndex+1} / ${d.gallery.length}`;box.querySelectorAll('[data-thumb]').forEach((el,i)=>{el.classList.toggle('active',i===lightIndex);el.setAttribute('aria-pressed',String(i===lightIndex));if(i===lightIndex)el.scrollIntoView({block:'nearest',inline:'center',behavior:reduced?'instant':'smooth'});});}
  box.querySelector('.lightbox-prev').onclick=()=>showLight(lightIndex-1);box.querySelector('.lightbox-next').onclick=()=>showLight(lightIndex+1);
  box.querySelectorAll('[data-thumb]').forEach((el,i)=>el.onclick=()=>showLight(i));
  box.querySelectorAll('[data-zoom]').forEach(el=>el.onclick=()=>{zoom=Math.max(1,Math.min(3,zoom+Number(el.dataset.zoom)*.25));if(zoom===1)panX=panY=0;applyZoom();});
  box.querySelector('.zoom-reset').onclick=()=>{zoom=1;panX=panY=0;applyZoom();};
  document.addEventListener('keydown',ev=>{if(box.hidden)return;if(ev.key==='ArrowLeft'){ev.preventDefault();showLight(lightIndex-1);}if(ev.key==='ArrowRight'){ev.preventDefault();showLight(lightIndex+1);}});
  pan.addEventListener('pointerdown',ev=>{lightPointer={x:ev.clientX,y:ev.clientY,px:panX,py:panY};pan.setPointerCapture(ev.pointerId);});
  pan.addEventListener('pointermove',ev=>{if(!lightPointer||zoom===1)return;const maxX=photo.clientWidth*(zoom-1)/2,maxY=photo.clientHeight*(zoom-1)/2;panX=Math.max(-maxX,Math.min(maxX,lightPointer.px+ev.clientX-lightPointer.x));panY=Math.max(-maxY,Math.min(maxY,lightPointer.py+ev.clientY-lightPointer.y));applyZoom();});
  pan.addEventListener('pointerup',ev=>{if(lightPointer&&zoom===1&&Math.abs(ev.clientX-lightPointer.x)>45)showLight(lightIndex+(ev.clientX<lightPointer.x?1:-1));lightPointer=null;});pan.addEventListener('pointercancel',()=>lightPointer=null);
  update(0);
}
