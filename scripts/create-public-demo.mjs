// Public fixtures contain fake guests only. Production uses private KV records.
import {createInvitationToken} from '../shared/invitation-token.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import ExcelJS from 'exceljs';
import {configureRenderer,renderPreview,previewDetails,escape} from '../worker/src/preview.js';

const base=new URL('https://datct269.github.io/wedding-invitation/');
const source=await readFile('index.html','utf8');
await configureRenderer(await readFile('node_modules/@resvg/resvg-wasm/index_bg.wasm'),[await readFile('worker/assets/NotoSans.ttf'),await readFile('worker/assets/NotoSansBold.ttf'),await readFile('worker/assets/NotoSerif.ttf')],await readFile('public/images/decorations/floral.svg','utf8'));
const previous=JSON.parse(await readFile('.local/public-demo-links.json','utf8').catch(()=> '[]'));
const result=[];
const fixtures=['Nhà trai','Nhà gái'].flatMap(group=>['2026-10-30T17:00','2026-10-31T10:00'].map(event=>({name:`Khách thử ${group.toLowerCase()}`,group,event,demo:true})));
// Public sample requested by the site owner; never load real guest spreadsheets here.
fixtures.push({name:'Bạn Đạt',group:'Nhà trai',event:'2026-10-31T10:00',demo:true});
for(const fields of fixtures){
 const {group,event}=fields;
 const old=previous.find(row=>row.name===fields.name&&row.group===group&&row.event===event);
 const token=old?.token||createInvitationToken();
 const directory=`public/invitation-demos/${token}`;
 const link=new URL(directory+'/',base),image=new URL(directory+'/preview.png',base);
 const info=previewDetails(fields),title=`${info.first} & ${info.second} · Thân mời ${info.name}`,description=`${info.date} lúc ${info.time}`;
 let html=source.replace('<head>','<head>\n  <base href="../../../">');
 for(const [tag,value] of [['og:title',title],['og:description',description],['og:image',image.href],['twitter:title',title],['twitter:description',description],['twitter:image',image.href]]){
  html=html.replace(new RegExp(`(<meta (?:property|name)="${tag}" content=")[^"]*(">)`),(_,start,end)=>start+escape(value)+end);
 }
 html=html.replace('</head>',`  <meta property="og:url" content="${escape(link.href)}">\n</head>`);
 await mkdir(directory,{recursive:true});
 await writeFile(directory+'/index.html',html);
 await writeFile(directory+'/invitation.json',JSON.stringify(fields,null,2));
 await writeFile(directory+'/preview.png',await renderPreview(fields));
 result.push({...fields,token,link:link.href});
 console.log(`${fields.name} / ${group} / ${event}: ${link.href}`);
}
await mkdir('.local',{recursive:true});
await writeFile('.local/public-demo-links.json',JSON.stringify(result,null,2));
const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Demo');
sheet.addRow(['Tên khách','Nhóm khách','Lịch tiệc','Token','Link riêng']);
for(const row of result)sheet.addRow([row.name,row.group,row.event,row.token,row.link]);
await book.xlsx.writeFile('guest-links-output-public-demo.xlsx');
