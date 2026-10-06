import {initWasm,Resvg} from '@resvg/resvg-wasm';
import {invitationData} from '../../src/data.js';

let ready, fonts, floral;
export function configureRenderer(wasm,fontBuffers,flower){
  ready ||= initWasm(wasm);
  fonts=fontBuffers.map(buffer=>new Uint8Array(buffer));
  floral=flower;
  return ready;
}
export const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function previewDetails(selected){
  const girl=selected?.group==='Nhà gái', friday=selected?.event==='2026-10-30T17:00';
  return {name:selected?.name||invitationData.guestName,first:girl?invitationData.couple.bride:invitationData.couple.groom,second:girl?invitationData.couple.groom:invitationData.couple.bride,date:`${friday?30:31} tháng 10, 2026`,time:friday?'17:00':'10:00'};
}
export function previewSvg(selected,flower=floral){
  const p=previewDetails(selected);
  const size=Math.min(34,540/Math.max(10,p.name.length));
  const flowerData=flower?`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(flower)))}`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><radialGradient id="red"><stop stop-color="#722127"/><stop offset="1" stop-color="#300b10"/></radialGradient><linearGradient id="gold"><stop stop-color="#d8b65e"/><stop offset="1" stop-color="#b48d30"/></linearGradient><clipPath id="card"><rect x="30" y="30" width="1140" height="570" rx="14"/></clipPath></defs><rect width="1200" height="630" fill="url(#red)"/><rect x="30" y="30" width="1140" height="570" rx="14" fill="#f8f2e9"/><g clip-path="url(#card)"><image href="${flowerData}" x="-42" y="-20" width="250" height="400" transform="rotate(22 83 180)"/><image href="${flowerData}" x="992" y="250" width="250" height="400" transform="rotate(202 1117 450)"/></g><path d="M600 135v360" stroke="#bc9844" stroke-opacity=".5"/><circle cx="600" cy="90" r="30" fill="url(#gold)"/><path d="M600 100l-10-10c-9-10 5-20 10-10 5-10 19 0 10 10z" fill="#fbf5e3"/><g text-anchor="middle" fill="#511419" font-family="Noto Serif"><text x="322" y="225" font-size="54">${escape(p.first)}</text><text x="322" y="275" font-size="40" fill="#bc9844">&amp;</text><text x="322" y="335" font-size="54">${escape(p.second)}</text><g transform="translate(310 374)" fill="none" stroke="#bc9844" stroke-width="1.7"><path d="M12 18C2 6 2 0 8 2c8 3 2 10 4 16C22 6 22 0 16 2c-8 3-2 10-4 16M0 1q6-7 12 0t12 0"/></g></g><g text-anchor="middle" font-family="Noto Sans"><text x="322" y="440" font-size="22" fill="#765258">${escape(p.date)}</text><text x="322" y="477" font-size="22" fill="#765258">${p.time}</text><text x="879" y="238" font-size="26" letter-spacing="4" fill="#826065">THÂN MỜI</text><rect x="699" y="282" width="360" height="77" rx="18" fill="#511419" fill-opacity=".045"/><text x="879" y="333" font-size="${size}" font-weight="600" fill="#511419">${escape(p.name)}</text><text x="879" y="410" font-size="17" fill="#79595c">Đến dự buổi tiệc chung vui cùng gia đình</text></g></svg>`;
}
export async function renderPreview(selected){
  if(!ready)throw new Error('Renderer not configured');
  await ready;
  const renderer=new Resvg(previewSvg(selected),{font:{fontBuffers:fonts,defaultFontFamily:'Noto Sans'}});
  let image;
  try{image=renderer.render();return image.asPng();}finally{image?.free();renderer.free();}
}
