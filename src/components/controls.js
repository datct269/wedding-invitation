import {invitationData as d} from '../data.js';
import {icon} from '../lib.js';
export function FloatingControls(){return `<aside class="floating-controls" id="floating-controls" aria-label="Điều khiển thiệp" hidden><button class="icon-button" id="scroll-toggle" aria-label="Bật tự động cuộn" aria-pressed="false">${icon('down')}</button><button class="icon-button" id="music-toggle" aria-label="Phát nhạc" aria-pressed="false">${icon('muted')}</button><span id="music-status" class="control-status" role="status"></span></aside>`;}
export function updateScrollButton(value){const button=document.querySelector('#scroll-toggle');button.innerHTML=icon(value?'pause':'down');button.setAttribute('aria-pressed',String(value));button.setAttribute('aria-label',value?'Dừng tự động cuộn':'Bật tự động cuộn');}
export function mountControls(scroll){const audio=new Audio(d.music.src);audio.loop=true;audio.volume=d.music.volume;audio.preload='none';const button=document.querySelector('#music-toggle'),status=document.querySelector('#music-status');
 const update=()=>{const playing=!audio.paused;button.innerHTML=icon(playing?'music':'muted');button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',playing?'Tạm dừng nhạc':'Phát nhạc');};
 async function play(){try{await audio.play();status.textContent='';}catch{status.textContent='Chạm nút nhạc để thử phát lại.';}update();}
 button.onclick=()=>audio.paused?play():(audio.pause(),update());audio.addEventListener('pause',update);audio.addEventListener('play',update);audio.addEventListener('error',()=>{status.textContent='Nhạc tạm thời không tải được.';update();});document.querySelector('#scroll-toggle').onclick=()=>scroll.set(!scroll.enabled);
 return {play};
}
