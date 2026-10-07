import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolveInvitation} from '../src/invitation.js';

test('published demo codes resolve only fixed fake records and ignore injected query fields',async()=>{
 const tokens=await readdir('public/invitation-demos');assert.equal(tokens.length,5);
 for(const token of tokens){
  assert.match(token,/^[a-f0-9]{32}$/);
  const directory=`public/invitation-demos/${token}`,record=JSON.parse(await readFile(directory+'/invitation.json','utf8'));
  assert.equal(record.demo,true);assert.match(record.name,/^(Khách thử nhà (trai|gái)|Bạn Đạt)$/);
  if(record.name==='Bạn Đạt'){assert.equal(record.group,'Nhà trai');assert.equal(record.event,'2026-10-31T10:00');}
  const html=await readFile(directory+'/index.html','utf8');assert.match(html,/<base href="\.\.\/\.\.\/\.\.\/">/);assert.ok(html.includes(token+'/preview.png'));
  const png=await readFile(directory+'/preview.png');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
  const found=await resolveInvitation(`?i=${token}&to=Attacker&group=Nhà gái&event=bad`,'',async address=>{assert.equal(address,`https://example.test/wedding/public/invitation-demos/${token}/invitation.json`);return Response.json(record);},'https://example.test/wedding/');
  assert.deepEqual(found,{name:record.name,group:record.group,event:record.event});
 }
 assert.equal(await resolveInvitation('?i='+'0'.repeat(32),'',async()=>new Response(null,{status:404}),'https://example.test/wedding/'),null);
 assert.equal(await resolveInvitation('?i='+'0'.repeat(32),'',async()=>Response.json({name:'Injected',group:'Nhà trai',event:'2026-10-31T10:00'}),'https://example.test/wedding/'),null);
});
