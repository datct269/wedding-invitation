import {invitationData as d} from '../data.js';
import {floral,icon,escapeHTML as e,calendarCells} from '../lib.js';
export function InvitationCover(){
 const date=calendarCells(d.event.date);
 return `<section class="cover" aria-label="Thiệp mời đám cưới" id="cover"><div class="cover-ambient" aria-hidden="true">${Array.from({length:12},(_,i)=>`<span style="--left:${7+i*8}%;--duration:${9+i%5}s;--delay:-${i*1.7}s;--sway:${i%2?22:-22}px">✻</span>`).join('')}</div><div class="cover-card">
 <div class="seal-wrap"><div class="seal-ring"></div><div class="seal">${icon('heart')}</div></div>
 ${floral('cover-flower left')}${floral('cover-flower right')}
 <div class="cover-copy"><h1>${e(d.couple.groom)}<small>&</small>${e(d.couple.bride)}</h1><div class="ornament">❦</div>
 <p class="cover-date">${date.day} tháng ${date.month}, ${date.year}</p><p class="salutation">Thân Mời</p><p class="guest-name">${e(d.guestName)}</p><p class="invitation-message">Đến dự buổi tiệc chung vui cùng gia đình</p>
 <button class="primary open-button" id="open-invitation">Mở thiệp</button></div>
 </div><span class="cover-footnote">TRÂN TRỌNG KÍNH MỜI</span></section>`;
}
