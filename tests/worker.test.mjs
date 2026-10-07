import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../worker/src/index.js';
import {createInvitationToken,lookupInvitation} from '../shared/invitation-token.js';
import {configureRenderer,previewSvg} from '../worker/src/preview.js';

const records=new Map();
const env={INVITATIONS:{get:async key=>records.get(key)??null}};
const row={name:'Khách <svg> "có dấu"',group:'Nhà trai',event:'2026-10-31T10:00'};
const save=fields=>{const token=createInvitationToken();records.set(token,fields);return token;};
const token=save(row);
await configureRenderer(await readFile('node_modules/@resvg/resvg-wasm/index_bg.wasm'),[await readFile('worker/assets/NotoSans.ttf'),await readFile('worker/assets/NotoSansBold.ttf'),await readFile('worker/assets/NotoSerif.ttf')],await readFile('public/images/decorations/floral.svg','utf8'));
const request=(path,headers={})=>new Request(`https://worker.test${path}`,{headers});
test('opaque tokens have 32 hex characters and KV rejects unknown, changed or invalid data',async()=>{
 const unique=new Set(Array.from({length:1000},createInvitationToken));assert.equal(unique.size,1000);
 for(const code of unique)assert.match(code,/^[a-f0-9]{32}$/);
 assert.deepEqual(await lookupInvitation(token,env.INVITATIONS),row);
 for(const code of ['', 'bad', 'header.payload.signature',token.slice(0,-1)+(token.endsWith('0')?'1':'0')])assert.equal(await lookupInvitation(code,env.INVITATIONS),null);
 assert.equal(await lookupInvitation(save({...row,group:'unknown'}),env.INVITATIONS),null);
 assert.equal(await lookupInvitation(token,undefined),null);
 assert.equal(await lookupInvitation(token,{get:async()=>{throw Error('offline');}}),null);
});
test('API returns KV fields, rejects invalid tokens and applies origin CORS',async()=>{
 const r=await worker.fetch(request(`/api/invitation?i=${token}`,{Origin:'https://datct269.github.io'}),env);
 assert.equal(r.status,200);assert.deepEqual(await r.json(),row);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://datct269.github.io');
 for(const query of ['', '?i=bad'])assert.equal((await worker.fetch(request('/api/invitation'+query),env)).status,401);
 assert.equal((await worker.fetch(request(`/api/invitation?i=${token}&to=Injected&event=bad`),env)).status,200);
 assert.equal((await worker.fetch(request(`/api/invitation?i=${token}`,{Origin:'https://evil.test'}),env)).status,403);
 assert.equal((await worker.fetch(request('/all'),env)).status,404);
 assert.equal((await worker.fetch(new Request(`https://worker.test/api/invitation?i=${token}`,{method:'POST'}),env)).status,405);
 const local=request(`/api/invitation?i=${token}`,{Origin:'http://localhost:5173'});
 assert.equal((await worker.fetch(local,env)).status,403);
 assert.equal((await worker.fetch(local,{...env,LOCAL_DEVELOPMENT:'true'})).status,200);
});
test('sharing serves escaped KV metadata and redirects people to the configured website',async()=>{
 for(const group of ['Nhà trai','Nhà gái'])for(const event of ['2026-10-30T17:00','2026-10-31T10:00']){
  const code=save({...row,group,event});
  const r=await worker.fetch(request(`/invite?i=${code}`,{'User-Agent':'TelegramBot'}),env),html=await r.text();
  assert.equal(r.status,200);assert.match(html,/Khách &lt;svg&gt;/);assert.doesNotMatch(html,/<svg>/);
  assert.match(html,new RegExp(event.endsWith('17:00')?'30 tháng 10, 2026 lúc 17:00':'31 tháng 10, 2026 lúc 10:00'));
  assert.ok(html.includes(group==='Nhà gái'?'Huyền Dịu &amp; Tiến Đạt':'Tiến Đạt &amp; Huyền Dịu'));
  assert.ok(html.includes(`/preview.png?i=${code}`));
  const person=await worker.fetch(request(`/invite?i=${code}`),{...env,SITE_URL:'https://example.test/wedding/'});
  assert.equal(person.status,302);assert.equal(person.headers.get('Location'),`https://example.test/wedding/?i=${code}`);
 }
 assert.match(await (await worker.fetch(request('/invite?i=bad',{'User-Agent':'TelegramBot'}),env)).text(),/Quý khách/);
 assert.equal((await worker.fetch(request('/invite?i=bad'),env)).headers.get('Location'),'https://datct269.github.io/wedding-invitation/');
});
test('PNG endpoint renders actual 1200x630 images and defaults safely',async()=>{
 for(const query of [`?i=${token}`,'?i=bad']){
  const r=await worker.fetch(request('/preview.png'+query),env);assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'image/png');
  const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);
 }
 assert.match(previewSvg(row),/Khách &lt;svg&gt; &quot;có dấu&quot;/);
});
