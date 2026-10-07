import { invitationData as data } from './data.js';
import { normalizeGuestName } from './invitation.js';
export const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const personalizedGuestName = search => normalizeGuestName(new URLSearchParams(search).get('to'));
export const guestNameFromSearch = (search, fallback=data.guestName) => personalizedGuestName(search) || fallback;
export const image = (src,alt='',cls='',loading='lazy',position='center') => `<img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" class="${cls}" draggable="false" loading="${loading}" decoding="async" style="object-position:${escapeHTML(position)}">`;
export const floral = (cls='') => image(data.decorations.floral,'',`floral ${cls}`);
export function installImageFallbacks(root=document) {
  root.querySelectorAll('img').forEach(img=>{
    const fallback=()=>{ if(img.dataset.fallback)return;img.dataset.fallback='true';img.src=data.decorations.fallback;img.classList.add('image-fallback'); };
    img.addEventListener('error',fallback);if(img.complete&&!img.naturalWidth)fallback();
  });
}
export const icons = {
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',down:'<path d="m6 7 6 6 6-6M6 13l6 6 6-6"/>',
  music:'<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="16" rx="3" ry="3"/>',
  muted:'<path d="M9 18V5l11-2v8M9 8l11-2M16 16l6 6m0-6-6 6"/><ellipse cx="6" cy="18" rx="3" ry="3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>',
  camera:'<path d="M3 7h5l2-3h4l2 3h5v13H3Z"/><circle cx="12" cy="13" r="4"/>',
  glass:'<path d="M7 3h10v5a5 5 0 0 1-10 0ZM12 13v8M7 21h10M7 7h10"/>',
  cake:'<path d="M4 12h16v9H4ZM7 8h10v4M12 4v4M4 16q2 3 4 0t4 0 4 0 4 0"/>',
  flower:'<path d="M12 9c-8-12-13 2-4 3-12 8 2 13 4 4 8 12 13-2 4-4 12-8-2-13-4-3Z"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
};
export const icon = name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.heart}</svg>`;
export function calendarCells(date) {
  const [year,month,day]=date.split('-').map(Number);
  const start=(new Date(year,month-1,1).getDay()+6)%7;
  return {year,month,day,cells:[...Array(start).fill(null),...Array.from({length:new Date(year,month,0).getDate()},(_,i)=>i+1)]};
}
