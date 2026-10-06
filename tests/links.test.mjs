import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
test('template writes actual dropdowns and default selections',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'invite-template-'));
 try{
  execFileSync(process.execPath,[resolve(root,'scripts/create-link-template.mjs')],{cwd:dir});
  const book=new ExcelJS.Workbook();await book.xlsx.readFile(join(dir,'guest-links-input-template.xlsx'));
  const sheet=book.worksheets[0];assert.deepEqual(sheet.getRow(1).values.slice(1),['Tên khách','Nhóm khách','Lịch tiệc']);
  assert.equal(sheet.getCell('B2').value,'Nhà gái');assert.equal(sheet.getCell('C2').value,'31/10/2026 10:00');
  assert.equal(sheet.getCell('B2').dataValidation.formulae[0],'"Nhà trai,Nhà gái"');assert.equal(sheet.getCell('C2').dataValidation.formulae[0],'"30/10/2026 17:00,31/10/2026 10:00"');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('XLSX and CSV create unique links, apply defaults and skip blank names',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'invite-links-'));
 try{
  const source=new ExcelJS.Workbook(),sheet=source.addWorksheet('Guests');sheet.addRow(['Tên khách','Nhóm khách','Lịch tiệc']);
  sheet.addRow(['Khách trùng','Nhà trai','30/10/2026 17:00']);sheet.addRow(['','Nhà gái','']);sheet.addRow(['Khách trùng','','']);
  const xlsxIn=join(dir,'input.xlsx');await source.xlsx.writeFile(xlsxIn);
  const csvIn=join(dir,'input.csv');await source.csv.writeFile(csvIn);
  for(const [input,ext] of [[xlsxIn,'xlsx'],[csvIn,'csv']]){
   const output=join(dir,`out.${ext}`),kv=join(dir,`kv-${ext}.json`);
   execFileSync(process.execPath,[resolve(root,'scripts/create-guest-links.mjs'),input,output,'https://datct269.github.io/wedding-invitation/'],{cwd:dir,env:{...process.env,INVITATION_KV_JSON:kv}});
   const out=new ExcelJS.Workbook();if(ext==='csv')await out.csv.readFile(output);else await out.xlsx.readFile(output);
   const rows=out.worksheets[0].getSheetValues().slice(2).filter(Boolean);
   assert.equal(rows.length,2);assert.equal(rows[0][1],'Khách trùng');assert.equal(rows[1][1],'Khách trùng');
   assert.equal(rows[0][2],'Nhà trai');assert.equal(rows[0][3],'30/10/2026 17:00');
   assert.equal(rows[1][2],'Nhà gái');assert.equal(rows[1][3],'31/10/2026 10:00');
   const tokens=rows.map(row=>new URL(row[4]).searchParams.get('i'));assert.notEqual(tokens[0],tokens[1]);
   const records=JSON.parse(await readFile(kv,'utf8'));assert.equal(records.length,2);assert.deepEqual(records.map(record=>record.key).sort(),[...tokens].sort());assert.equal(JSON.parse(records.find(record=>record.key===tokens[1]).value).event,'2026-10-31T10:00');
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
