import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {signInvitation} from '../shared/invitation-token.js';

const vars=await readFile(new URL('../worker/.dev.vars',import.meta.url),'utf8').catch(()=> '');
const secret=process.env.INVITATION_JWT_SECRET || vars.match(/^INVITATION_JWT_SECRET\s*=\s*"?([^"\r\n]+)"?$/m)?.[1];
if(!secret)throw new Error('Configure worker/.dev.vars first; see README.');
const config=JSON.parse(await readFile(new URL('../config/link-targets.json',import.meta.url),'utf8'));
const examples=[];
for(const group of ['Nhà trai','Nhà gái'])for(const event of ['2026-10-30T17:00','2026-10-31T10:00']){
  const record={name:`Khách thử ${group.toLowerCase()}`,group,event};
  const token=await signInvitation(record,secret);
  const share=new URL(config.targets.local.prefix);share.searchParams.set('i',token);
  const site=new URL(config.targets.local.siteUrl);site.searchParams.set('i',token);
  examples.push({...record,share:share.href,site:site.href});
  console.log(`${group} / ${event}: ${share.href}`);
}
await mkdir('.local',{recursive:true});
await writeFile('.local/guest-links-examples.json',JSON.stringify(examples,null,2));
