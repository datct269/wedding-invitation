import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {calendarCells,escapeHTML} from '../src/lib.js';
import {invitationData as d} from '../src/data.js';
import {guestbookStore} from '../src/guestbook-store.js';
import {resolveInvitation,defaultInvitation} from '../src/invitation.js';
import {wrapIndex} from '../src/components/gallery.js';
import {OpeningHero,ReceptionInfo,WeddingCeremony,Footer} from '../src/components/sections.js';
import {InvitationCover} from '../src/components/cover.js';
test('calendar starts Monday and handles leap years',()=>{assert.deepEqual(calendarCells('2026-04-07').cells.slice(0,4),[null,null,1,2]);assert.equal(calendarCells('2024-02-29').cells.filter(Boolean).length,29);});
test('ceremony and reception dates match their lunar dates and confirmed times',()=>{assert.deepEqual({date:d.event.receptionDate,lunar:d.event.receptionLunarDate,weekday:d.event.receptionWeekday},{date:'2026-10-30',lunar:'21/09 năm Bính Ngọ',weekday:'Thứ Sáu'});assert.deepEqual({date:d.event.ceremonyDate,lunar:d.event.ceremonyLunarDate,weekday:d.event.ceremonyWeekday,time:d.event.ceremonyTime},{date:'2026-10-31',lunar:'22/09 năm Bính Ngọ',weekday:'Thứ Bảy',time:'13:30'});});
test('ceremony and reception render their own dates',()=>{assert.match(WeddingCeremony(),/date-block"><b>31<\/b>/);assert.match(WeddingCeremony(),/22\/09 NĂM BÍNH NGỌ/);assert.match(ReceptionInfo(),/date-block"><b>30<\/b>/);assert.match(ReceptionInfo(),/21\/09 NĂM BÍNH NGỌ/);});
test('wedding ceremony displays the updated 13:30 time',()=>{assert.match(WeddingCeremony(),/VÀO LÚC 13:30/);});
test('wedding ceremony remains fixed while group controls the couple order and reception choice',()=>{
 const ceremony=WeddingCeremony();
 for(const [group,groom,bride] of [['Nhà trai','Tiến Đạt','Huyền Dịu'],['Nhà gái','Huyền Dịu','Tiến Đạt']]){
  const invite={...d,guestName:'<script>Khách</script>',couple:{...d.couple,groom,bride}};
  assert.equal(WeddingCeremony(),ceremony);
  assert.match(InvitationCover(invite),new RegExp(`${groom}.*${bride}`));assert.match(InvitationCover(invite),/&lt;script&gt;Khách/);
  assert.match(OpeningHero(invite),new RegExp(`${groom}.*${bride}`));assert.match(Footer(invite),new RegExp(`${groom}.*${bride}`));
 }
 const friday={...d,event:{...d.event,receptionDate:'2026-10-30',receptionWeekday:'Thứ Sáu',receptionLunarDate:'21/09 năm Bính Ngọ',receptionTime:'17:00'}};
 const saturday={...d,event:{...d.event,receptionDate:'2026-10-31',receptionWeekday:'Thứ Bảy',receptionLunarDate:'22/09 năm Bính Ngọ',receptionTime:'10:00'}};
 for(const [invite,date,time] of [[friday,'30 tháng 10, 2026','17:00'],[saturday,'31 tháng 10, 2026','10:00']]){
  const cover=InvitationCover(invite);assert.match(cover,new RegExp(`cover-date">${date}`));assert.match(cover,new RegExp(`cover-time">${time}`));
 }
 for(const [invite,day,weekday,lunar,time] of [[friday,'30','THỨ SÁU','21/09 NĂM BÍNH NGỌ','17:00'],[saturday,'31','THỨ BẢY','22/09 NĂM BÍNH NGỌ','10:00']]){
  const html=ReceptionInfo(invite);assert.match(html,new RegExp(`date-block"><b>${day}<\/b>`));assert.match(html,new RegExp(weekday));assert.match(html,new RegExp(lunar));assert.match(html,new RegExp(time));assert.doesNotMatch(html,/Thêm vào lịch/);
 }
});
test('gallery wraps in both directions',()=>{assert.equal(wrapIndex(-1,12),11);assert.equal(wrapIndex(12,12),0);});
test('invitation lookup ignores legacy to and fails safely for missing, changed tokens and network errors',async()=>{
 const fallback=defaultInvitation(d);assert.equal(fallback.guestName,'Quý khách');assert.equal(fallback.event.receptionDate,'2026-10-31');assert.equal(fallback.event.receptionTime,'10:00');
 const fallbackCover=InvitationCover(fallback);assert.match(fallbackCover,/cover-date">31 tháng 10, 2026/);assert.match(fallbackCover,/cover-time">10:00/);
 assert.equal(await resolveInvitation('?to=Injected','https://worker.example',async()=>{throw Error('should not fetch')}),null);
 assert.equal(await resolveInvitation('?i=bad','https://worker.example'),null);
 assert.equal(await resolveInvitation(`?i=${'a'.repeat(64)}`,'https://worker.example',async()=>{throw Error('offline')}),null);
 assert.equal(await resolveInvitation(`?i=${'a'.repeat(64)}`,'https://worker.example',async()=>Response.json({name:'Injected',group:'root',event:'2026-10-30T17:00'})),null);
});
test('verified guest values are fetched only by opaque token and validated',async()=>{
 const token='a'.repeat(64);let requested='';
 const found=await resolveInvitation(`?i=${token}&to=Ignored`,'https://worker.example/lookup',async(url)=>{requested=url;return Response.json({name:'<b>Khách</b>',group:'Nhà gái',event:'2026-10-30T17:00'});});
 assert.match(requested,new RegExp(`i=${token}`));assert.doesNotMatch(requested,/Ignored/);assert.deepEqual(found,{name:'<b>Khách</b>',group:'Nhà gái',event:'2026-10-30T17:00'});
});
test('guestbook receives only the verified invitation name and locks that field',async()=>{
 const main=await readFile('src/main.js','utf8'),guestbook=await readFile('src/components/guestbook.js','utf8');
 assert.match(main,/mountGuestbook\(scroll,selected\?\.name\|\|''\)/);assert.match(guestbook,/name\.value=personalizedName;name\.defaultValue=personalizedName;name\.readOnly=true/);
});
test('social preview metadata is static and uses the GitHub Pages URL',async()=>{
  const html=await readFile('index.html','utf8');
  for(const tag of ['og:title','og:description','og:image','og:type','twitter:card','twitter:title','twitter:description','twitter:image'])assert.match(html,new RegExp(`["']${tag}["']`));
  assert.doesNotMatch(html,/og:url/);
  assert.match(html,/https:\/\/datct269\.github\.io\/wedding-invitation\/public\/images\/og-preview\.png\?v=2/);
  await access('public/images/og-preview.png');
});
test('bride family address uses TP Bắc Ninh',()=>{assert.match(d.families[1].address,/TP Bắc Ninh$/);assert.doesNotMatch(d.families[1].address,/Tỉnh Bắc Ninh/);});
test('all configured local media exists',async()=>{const paths=[d.hero.src,...d.gallery.flatMap(p=>[p.src,p.lightboxSrc,p.thumbnailSrc]),...Object.values(d.decorations),...d.gifts.map(g=>g.qrSrc),d.music.src];for(const path of paths)await access(path.startsWith('/')?'.'+path:path);});
test('guestbook validates, persists and safely renders user text',async()=>{const memory=new Map([['romantic-invitation-guestbook-v1',JSON.stringify([{name:'Old',message:'Old wish',date:'2026-01-01'}])]]);globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};await assert.rejects(()=>guestbookStore.add({name:' ',message:'hello'}));await guestbookStore.add({name:' Guest ',message:'<script>alert(1)</script>'});const rows=await guestbookStore.list();assert.equal(rows[0].name,'Guest');assert.equal(rows.length,1);assert.equal(memory.has('romantic-invitation-guestbook-v1'),false);assert.match(escapeHTML(rows[0].message),/^&lt;script&gt;/);memory.set('romantic-invitation-guestbook-v2','broken');assert.equal((await guestbookStore.list()).length,d.guestbookSeed.length);});
