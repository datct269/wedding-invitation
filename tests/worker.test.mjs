import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SignJWT} from 'jose';
import worker from '../worker/src/index.js';
import {signInvitation,verifyInvitation} from '../shared/invitation-token.js';
import {configureRenderer,previewSvg} from '../worker/src/preview.js';

const secret='test-only-secret-not-for-production-123456789';
const env={INVITATION_JWT_SECRET:secret};
const row={name:'Khách <svg> "có dấu"',group:'Nhà trai',event:'2026-10-31T10:00'};
const token=await signInvitation(row,secret);
await configureRenderer(await readFile('node_modules/@resvg/resvg-wasm/index_bg.wasm'),[await readFile('worker/assets/NotoSans.ttf'),await readFile('worker/assets/NotoSansBold.ttf'),await readFile('worker/assets/NotoSerif.ttf')],await readFile('public/images/decorations/floral.svg','utf8'));
const request=(path,headers={})=>new Request(`https://worker.test${path}`,{headers});
test('JWT verifies signature, rejects edits and wrong key, and creates unique links',async()=>{
 assert.deepEqual(await verifyInvitation(token,secret),row);
 assert.notEqual(token,await signInvitation(row,secret));
 assert.equal(await verifyInvitation(token,secret+'other'),null);
 const parts=token.split('.');parts[1]=Buffer.from(JSON.stringify({...row,jti:'edited',name:'Attacker'})).toString('base64url');
 assert.equal(await verifyInvitation(parts.join('.'),secret),null);
 assert.equal(await verifyInvitation('bad',secret),null);
 await assert.rejects(()=>signInvitation({...row,group:'unknown'},secret));
 const invalid=await new SignJWT({...row,group:'unknown',jti:'invalid'}).setProtectedHeader({alg:'HS256',typ:'JWT'}).sign(new TextEncoder().encode(secret));
 assert.equal(await verifyInvitation(invalid,secret),null);
 const expired=await new SignJWT({...row,jti:'expired'}).setProtectedHeader({alg:'HS256',typ:'JWT'}).setExpirationTime(1).sign(new TextEncoder().encode(secret));
 assert.equal(await verifyInvitation(expired,secret),null);
 assert.equal(await verifyInvitation(token,undefined),null);
});
test('API returns verified fields, rejects invalid tokens and applies origin CORS',async()=>{
 const r=await worker.fetch(request(`/api/invitation?i=${token}`,{Origin:'https://datct269.github.io'}),env);
 assert.equal(r.status,200);assert.deepEqual(await r.json(),row);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://datct269.github.io');
 for(const query of ['', '?i=bad'])assert.equal((await worker.fetch(request('/api/invitation'+query),env)).status,401);
 assert.equal((await worker.fetch(request(`/api/invitation?i=${token}`,{Origin:'https://evil.test'}),env)).status,403);
 assert.equal((await worker.fetch(request('/all'),env)).status,404);
 const local=request(`/api/invitation?i=${token}`,{Origin:'http://localhost:5173'});
 assert.equal((await worker.fetch(local,env)).status,403);
 assert.equal((await worker.fetch(local,{...env,LOCAL_DEVELOPMENT:'true'})).status,200);
});
test('sharing serves token-specific escaped metadata and redirects people to the configured website',async()=>{
 for(const group of ['Nhà trai','Nhà gái'])for(const event of ['2026-10-30T17:00','2026-10-31T10:00']){
  const selected={...row,group,event},jwt=await signInvitation(selected,secret);
  const r=await worker.fetch(request(`/invite?i=${jwt}`,{'User-Agent':'TelegramBot'}),env),html=await r.text();
  assert.equal(r.status,200);assert.match(html,/Khách &lt;svg&gt;/);assert.doesNotMatch(html,/<svg>/);
  assert.match(html,new RegExp(event.endsWith('17:00')?'30 tháng 10, 2026 lúc 17:00':'31 tháng 10, 2026 lúc 10:00'));
  assert.ok(html.indexOf(group==='Nhà gái'?'Huyền Dịu &amp; Tiến Đạt':'Tiến Đạt &amp; Huyền Dịu')>=0);
  assert.ok(html.includes(`/preview.png?i=${jwt}`));
  const person=await worker.fetch(request(`/invite?i=${jwt}`),{...env,SITE_URL:'https://example.test/wedding/'});
  assert.equal(person.status,302);assert.equal(person.headers.get('Location'),`https://example.test/wedding/?i=${jwt}`);
 }
 const invalid=await worker.fetch(request('/invite?i=bad',{'User-Agent':'TelegramBot'}),env);
 assert.match(await invalid.text(),/Quý khách/);
 assert.equal((await worker.fetch(request('/invite?i=bad'),env)).headers.get('Location'),'https://datct269.github.io/wedding-invitation/');
});
test('PNG endpoint renders actual 1200x630 images and defaults safely',async()=>{
 for(const query of [`?i=${token}`,'?i=bad']){
  const r=await worker.fetch(request('/preview.png'+query),env);assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'image/png');
  const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);
 }
 assert.match(previewSvg(row),/Khách &lt;svg&gt; &quot;có dấu&quot;/);
});
