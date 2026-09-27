import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {calendarCells,calendarURL,escapeHTML,guestNameFromSearch} from '../src/lib.js';
import {invitationData as d} from '../src/data.js';
import {guestbookStore} from '../src/guestbook-store.js';
import {wrapIndex} from '../src/components/gallery.js';
test('calendar starts Monday and handles leap years',()=>{assert.deepEqual(calendarCells('2026-04-07').cells.slice(0,4),[null,null,1,2]);assert.equal(calendarCells('2024-02-29').cells.filter(Boolean).length,29);});
test('calendar uses Vietnam timezone and reception end time',()=>{const url=new URL(calendarURL());assert.equal(url.searchParams.get('ctz'),'Asia/Ho_Chi_Minh');assert.equal(url.searchParams.get('dates'),'20261018T100000/20261018T203000');});
test('gallery wraps in both directions',()=>{assert.equal(wrapIndex(-1,12),11);assert.equal(wrapIndex(12,12),0);});
test('guest name comes safely from the to query parameter with a fallback',()=>{
  const cases=[
    ['', 'Quý khách'],
    ['?to=Nguyen%20Van%20An','Nguyen Van An'],
    ['?to=Nguyễn%20Văn%20An','Nguyễn Văn An'],
    ['?to=','Quý khách'],
    ['?to=%20%20','Quý khách'],
    ['?to=Anh%20Nam%20và%20Chị%20Lan','Anh Nam và Chị Lan']
  ];
  for(const [search,expected] of cases)assert.equal(guestNameFromSearch(search),expected);
});
test('social preview metadata is static and uses the GitHub Pages URL',async()=>{
  const html=await readFile('index.html','utf8');
  for(const tag of ['og:title','og:description','og:image','og:url','og:type','twitter:card','twitter:title','twitter:description','twitter:image'])assert.match(html,new RegExp(`["']${tag}["']`));
  assert.match(html,/https:\/\/datct269\.github\.io\/wedding-invitation\/public\/images\/og-preview\.jpg/);
  await access('public/images/og-preview.jpg');
});
test('bride family address uses TP Bắc Ninh',()=>{assert.match(d.families[1].address,/TP Bắc Ninh$/);assert.doesNotMatch(d.families[1].address,/Tỉnh Bắc Ninh/);});
test('all configured local media exists',async()=>{const paths=[d.hero.src,...d.gallery.flatMap(p=>[p.src,p.thumbnailSrc]),...Object.values(d.decorations),...d.gifts.map(g=>g.qrSrc),d.music.src];for(const path of paths)await access(path.startsWith('/')?'.'+path:path);});
test('guestbook validates, persists and safely renders user text',async()=>{const memory=new Map([['romantic-invitation-guestbook-v1',JSON.stringify([{name:'Old',message:'Old wish',date:'2026-01-01'}])]]);globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};await assert.rejects(()=>guestbookStore.add({name:' ',message:'hello'}));await guestbookStore.add({name:' Guest ',message:'<script>alert(1)</script>'});const rows=await guestbookStore.list();assert.equal(rows[0].name,'Guest');assert.equal(rows.length,1);assert.equal(memory.has('romantic-invitation-guestbook-v1'),false);assert.match(escapeHTML(rows[0].message),/^&lt;script&gt;/);memory.set('romantic-invitation-guestbook-v2','broken');assert.equal((await guestbookStore.list()).length,d.guestbookSeed.length);});
