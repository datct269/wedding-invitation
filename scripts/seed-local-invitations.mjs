import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';

const sample=[
  {name:'Khách thử nhà trai',group:'Nhà trai',event:'2026-10-30T17:00'},
  {name:'Khách thử nhà gái',group:'Nhà gái',event:'2026-10-30T17:00'},
  {name:'Khách thử mặc định',group:'Nhà gái',event:'2026-10-31T10:00'},
  {name:'<img src=x onerror=alert(1)>',group:'Nhà trai',event:'2026-10-31T10:00'}
];
const records=sample.map(record=>({key:randomBytes(32).toString('hex'),value:JSON.stringify(record)}));
const file=resolve('.wrangler/local-invitations.json');
await writeFile(file,JSON.stringify(records,null,2),'utf8');
execFileSync(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),'kv','bulk','put',file,'--local','--persist-to','.wrangler/state','--binding','INVITATIONS','--preview','--config','worker/wrangler.toml'],{stdio:'inherit'});
for(let i=0;i<records.length;i++)console.log(`${sample[i].name}: http://localhost:5173/?i=${records[i].key}`);
