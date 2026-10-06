import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/src/index.js';

const origin='https://datct269.github.io', token='f'.repeat(64);
function env(row){return {INVITATIONS:{get:async key=>key===token?row:null}};}
test('worker returns one invitation by token and applies published-site CORS',async()=>{
 const response=await worker.fetch(new Request(`https://worker.test/?i=${token}`,{headers:{Origin:origin}}),env({name:'Khách <svg>',group:'Nhà trai',event:'2026-10-31T10:00'}));
 assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);assert.deepEqual(await response.json(),{name:'Khách <svg>',group:'Nhà trai',event:'2026-10-31T10:00'});
});
test('worker rejects bad/missing tokens and foreign origins without listing',async()=>{
 for(const url of ['https://worker.test/','https://worker.test/?i=bad'])assert.notEqual((await worker.fetch(new Request(url),env(null))).status,200);
 assert.equal((await worker.fetch(new Request(`https://worker.test/?i=${token}`),env(null))).status,404);
 assert.equal((await worker.fetch(new Request(`https://worker.test/?i=${token}`,{headers:{Origin:'https://evil.test'}}),env({name:'x',group:'Nhà trai',event:'2026-10-31T10:00'}))).status,403);
 assert.equal((await worker.fetch(new Request('https://worker.test/all'),env(null))).status,404);
});
test('local CORS is enabled only by the explicit local development binding',async()=>{
 const request=new Request(`https://worker.test/?i=${token}`,{headers:{Origin:'http://localhost:5173'}});
 const local=await worker.fetch(request,{...env({name:'Fake',group:'Nhà trai',event:'2026-10-31T10:00'}),LOCAL_DEVELOPMENT:'true'});
 assert.equal(local.status,200);assert.equal(local.headers.get('Access-Control-Allow-Origin'),'http://localhost:5173');
 const production=await worker.fetch(request,env({name:'Fake',group:'Nhà trai',event:'2026-10-31T10:00'}));assert.equal(production.status,403);
});
