import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createInvitationToken} from '../shared/invitation-token.js';

const config=JSON.parse(await readFile(new URL('../config/link-targets.json',import.meta.url),'utf8'));
const examples=[],batch=[];
for(const group of ['Nhà trai','Nhà gái'])for(const event of ['2026-10-30T17:00','2026-10-31T10:00']){
 const record={name:`Khách thử ${group.toLowerCase()}`,group,event},token=createInvitationToken();
 const share=new URL(config.targets.local.prefix);share.searchParams.set('i',token);
 const site=new URL(config.targets.local.siteUrl);site.searchParams.set('i',token);
 examples.push({...record,share:share.href,site:site.href});
 batch.push({key:token,value:JSON.stringify(record)});
 console.log(`${group} / ${event}: ${share.href}`);
}
await mkdir('.local',{recursive:true});
await writeFile('.local/guest-links-examples.json',JSON.stringify(examples,null,2));
await writeFile('.local/guest-links-examples-kv.json',JSON.stringify(batch,null,2));
console.log('Import before opening: npm run links:import -- .local/guest-links-examples-kv.json --local');
