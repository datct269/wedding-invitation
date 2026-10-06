import ExcelJS from 'exceljs';
const workbook=new ExcelJS.Workbook();
const sheet=workbook.addWorksheet('Danh sách khách');
sheet.columns=[{header:'Tên khách',key:'name',width:32},{header:'Nhóm khách',key:'group',width:18},{header:'Lịch tiệc',key:'event',width:24}];
for(let row=2;row<=101;row++){
 sheet.getCell(`B${row}`).value='Nhà gái';sheet.getCell(`C${row}`).value='31/10/2026 10:00';
 sheet.getCell(`B${row}`).dataValidation={type:'list',allowBlank:false,formulae:['"Nhà trai,Nhà gái"'],showErrorMessage:true,error:'Chọn Nhà trai hoặc Nhà gái.'};
 sheet.getCell(`C${row}`).dataValidation={type:'list',allowBlank:false,formulae:['"30/10/2026 17:00,31/10/2026 10:00"'],showErrorMessage:true,error:'Chọn một lịch tiệc hợp lệ.'};
}
await workbook.xlsx.writeFile('guest-links-input-template.xlsx');
console.log('Created guest-links-input-template.xlsx. Add guest names; blank name rows are ignored.');
