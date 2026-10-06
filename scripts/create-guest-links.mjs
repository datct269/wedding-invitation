import ExcelJS from 'exceljs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';

const [input,output='guest-links-output.xlsx',baseUrl='https://datct269.github.io/wedding-invitation/']=process.argv.slice(2);
if(!input){console.error('Usage: node scripts/create-guest-links.mjs <input.xlsx|csv> [output.xlsx|csv] [base-url]');process.exit(2);}
const workbook=new ExcelJS.Workbook();
if(input.toLowerCase().endsWith('.csv'))await workbook.csv.readFile(resolve(input));else await workbook.xlsx.readFile(resolve(input));
const sheet=workbook.worksheets[0];
if(!sheet)throw new Error('Input file does not contain a worksheet.');
const headers=new Map();sheet.getRow(1).eachCell((cell,col)=>headers.set(String(cell.value??'').trim(),col));
for(const heading of ['Tên khách','Nhóm khách','Lịch tiệc'])if(!headers.has(heading))throw new Error(`Missing column: ${heading}`);
const choices={'30/10/2026 17:00':'2026-10-30T17:00','31/10/2026 10:00':'2026-10-31T10:00'};
const result=[];
for(let r=2;r<=sheet.rowCount;r++){
 const row=sheet.getRow(r),value=col=>String(row.getCell(headers.get(col)).text??row.getCell(headers.get(col)).value??'').trim();
 const name=value('Tên khách');if(!name)continue;
 const group=value('Nhóm khách')||'Nhà gái',schedule=value('Lịch tiệc')||'31/10/2026 10:00';
 if(!['Nhà trai','Nhà gái'].includes(group))throw new Error(`Nhóm khách không hợp lệ ở dòng ${r}: ${group}`);
 if(!choices[schedule])throw new Error(`Lịch tiệc không hợp lệ ở dòng ${r}: ${schedule}`);
 const token=randomBytes(32).toString('hex'),url=new URL(baseUrl);url.searchParams.set('i',token);
 result.push({name,group,schedule,link:url.href,token,record:{name,group,event:choices[schedule]}});
}
const outbook=new ExcelJS.Workbook(),outSheet=outbook.addWorksheet('Liên kết');
outSheet.columns=[{header:'Tên khách',key:'name',width:32},{header:'Nhóm khách',key:'group',width:18},{header:'Lịch tiệc',key:'schedule',width:24},{header:'Link riêng',key:'link',width:65}];
for(const item of result)outSheet.addRow({name:item.name,group:item.group,schedule:item.schedule,link:item.link});
if(output.toLowerCase().endsWith('.csv'))await outbook.csv.writeFile(resolve(output));else await outbook.xlsx.writeFile(resolve(output));
if(process.env.INVITATION_KV_JSON){const records=result.map(r=>({key:r.token,value:JSON.stringify(r.record)}));await writeFile(resolve(process.env.INVITATION_KV_JSON),JSON.stringify(records,null,2),'utf8');}
console.log(`Created ${result.length} unique links in ${output}.`);
