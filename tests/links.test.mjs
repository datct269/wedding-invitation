import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {verifyInvitation} from '../shared/invitation-token.js';
import {linkTarget} from '../scripts/link-config.mjs';

const root=process.cwd();
test('target config supports all hosts and rejects unconfigured production prefixes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'invite-config-'));
 try{
  const config=join(dir,'config.json');await writeFile(config,JSON.stringify({defaultTarget:'local',targets:{local:{prefix:'http://localhost:8787/invite'},github:{prefix:'https://worker.test/invite'},cloudflare:{prefix:'https://wedding.test/invite'}}}));
  for(const target of ['local','github','cloudflare']){
   const chosen=await linkTarget(['input.csv','out.csv','--config',config,'--target',target]);assert.equal(chosen.targetName,target);assert.ok(chosen.prefix.endsWith('/invite'));
  }
  assert.equal((await linkTarget(['--config',config,'--prefix','https://override.test/custom'])).prefix,'https://override.test/custom');
  await assert.rejects(()=>linkTarget(['--target','github']),/Configure the share prefix/);
  await assert.rejects(()=>linkTarget(['--prefix','javascript:bad']),/Invalid link prefix/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
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
   const output=join(dir,`out.${ext}`);
   const secret='test-only-secret-not-for-production-123456789';
   execFileSync(process.execPath,[resolve(root,'scripts/create-guest-links.mjs'),input,output,'--prefix','https://worker.test/invite'],{cwd:dir,env:{...process.env,INVITATION_JWT_SECRET:secret}});
   const out=new ExcelJS.Workbook();if(ext==='csv')await out.csv.readFile(output);else await out.xlsx.readFile(output);
   const rows=out.worksheets[0].getSheetValues().slice(2).filter(Boolean);
   assert.equal(rows.length,2);assert.equal(rows[0][1],'Khách trùng');assert.equal(rows[1][1],'Khách trùng');
   assert.equal(rows[0][2],'Nhà trai');assert.equal(rows[0][3],'30/10/2026 17:00');
   assert.equal(rows[1][2],'Nhà gái');assert.equal(rows[1][3],'31/10/2026 10:00');
   const tokens=rows.map(row=>new URL(row[4]).searchParams.get('i'));assert.notEqual(tokens[0],tokens[1]);
   const records=await Promise.all(tokens.map(token=>verifyInvitation(token,secret)));assert.equal(records[0].group,'Nhà trai');assert.equal(records[1].event,'2026-10-31T10:00');
   assert.ok(rows.every(row=>new URL(row[4]).pathname==='/invite'));
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
