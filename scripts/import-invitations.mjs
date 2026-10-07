import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {invitationFields,validToken} from '../shared/invitation-token.js';

const [file,mode]=process.argv.slice(2);
if(!file||!['--local','--remote'].includes(mode)||process.argv.length!==4)throw new Error('Usage: npm run links:import -- <batch-kv.json> --local|--remote');
const batch=JSON.parse(await readFile(file,'utf8')),seen=new Set();
if(!Array.isArray(batch)||!batch.length)throw new Error('Batch must contain invitations.');
for(const item of batch){
 if(!validToken(item.key)||seen.has(item.key)||typeof item.value!=='string'||!invitationFields(JSON.parse(item.value)))throw new Error('Invalid or duplicate invitation in batch.');
 seen.add(item.key);
}
const cli=resolve('node_modules/wrangler/bin/wrangler.js');
const common=['--binding','INVITATIONS','--config','worker/wrangler.toml',mode];
const run=args=>execFileSync(process.execPath,[cli,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,WRANGLER_LOG_PATH:resolve('.local/wrangler-import.log')}}).trim();
try {
 for(const item of batch){
  const keys=JSON.parse(run(['kv','key','list','--prefix',item.key,...common]));
  if(keys.some(key=>key.name===item.key)){
   const existing=JSON.parse(run(['kv','key','get',item.key,'--text',...common]));
   if(JSON.stringify(invitationFields(existing))!==JSON.stringify(invitationFields(JSON.parse(item.value))))throw new Error('An existing code has different data. Import stopped.');
  }
 }
 run(['kv','bulk','put',resolve(file),...common]);
 console.log(`Imported ${batch.length} invitations ${mode}. Keep the matching output spreadsheet.`);
} catch(error){
 // Wrangler output may contain guest data or credentials; do not echo it.
 throw new Error(error.message.startsWith('An existing code')?error.message:'KV import failed. Check Cloudflare authentication, binding, network and batch; no guest data is printed.');
}
