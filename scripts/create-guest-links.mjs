import ExcelJS from 'exceljs';
import {resolve,parse,join} from 'node:path';
import {writeFile,access} from 'node:fs/promises';
import {createInvitationToken,invitationFields} from '../shared/invitation-token.js';
import {linkTarget} from './link-config.mjs';

const {positionals, prefix:baseUrl}=await linkTarget(process.argv.slice(2));
const [input,output='guest-links-output.xlsx']=positionals;
if(!input){console.error('Usage: npm run links:create -- <input.xlsx|csv> [output.xlsx|csv] [--target local|github|cloudflare] [--config path] [--prefix url]');process.exit(2);}
const workbook=new ExcelJS.Workbook();
if(input.toLowerCase().endsWith('.csv'))await workbook.csv.readFile(resolve(input));else await workbook.xlsx.readFile(resolve(input));
const sheet=workbook.worksheets[0];
if(!sheet)throw new Error('Input file does not contain a worksheet.');
const headers=new Map();sheet.getRow(1).eachCell((cell,col)=>headers.set(String(cell.value??'').trim(),col));
for(const heading of ['Tên khách','Nhóm khách','Lịch tiệc'])if(!headers.has(heading))throw new Error(`Missing column: ${heading}`);
const choices={'30/10/2026 17:00':'2026-10-30T17:00','31/10/2026 10:00':'2026-10-31T10:00'};
const result=[];
const batch=[],used=new Set();
const outputPath=parse(resolve(output));
const kvPath=join(outputPath.dir,outputPath.name+'-kv.json');
for(const path of [resolve(output),kvPath]) {
 try { await access(path); } catch(error) { if(error.code==='ENOENT')continue; throw error; }
 throw new Error(`Output already exists: ${path}. Choose a new output filename to preserve previously generated links.`);
}
for(let r=2;r<=sheet.rowCount;r++){
 const row=sheet.getRow(r),value=col=>String(row.getCell(headers.get(col)).text??row.getCell(headers.get(col)).value??'').trim();
 const name=value('Tên khách');if(!name)continue;
 const group=value('Nhóm khách')||'Nhà gái',schedule=value('Lịch tiệc')||'31/10/2026 10:00';
 if(!['Nhà trai','Nhà gái'].includes(group))throw new Error(`Nhóm khách không hợp lệ ở dòng ${r}: ${group}`);
 if(!choices[schedule])throw new Error(`Lịch tiệc không hợp lệ ở dòng ${r}: ${schedule}`);
 const fields=invitationFields({name,group,event:choices[schedule]});
 if(!fields)throw new Error(`Invalid guest data at row ${r}; names must be at most 80 characters.`);
 let token;do{token=createInvitationToken();}while(used.has(token));used.add(token);
 const url=new URL(baseUrl);url.searchParams.set('i',token);
 batch.push({key:token,value:JSON.stringify(fields)});
 result.push({name,group,schedule,link:url.href});
}
const outbook=new ExcelJS.Workbook(),outSheet=outbook.addWorksheet('Liên kết');
outSheet.columns=[{header:'Tên khách',key:'name',width:32},{header:'Nhóm khách',key:'group',width:18},{header:'Lịch tiệc',key:'schedule',width:24},{header:'Link riêng',key:'link',width:65}];
for(const item of result)outSheet.addRow({name:item.name,group:item.group,schedule:item.schedule,link:item.link});
if(output.toLowerCase().endsWith('.csv'))await outbook.csv.writeFile(resolve(output));else await outbook.xlsx.writeFile(resolve(output));
await writeFile(kvPath,JSON.stringify(batch,null,2),{flag:'wx'});
console.log(`Created ${result.length} unique links in ${output}.`);
console.log(`KV batch: ${kvPath}. Import this same batch before sending links.`);
