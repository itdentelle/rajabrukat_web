import * as XLSX from 'xlsx';
import * as path from 'path';

const excelPath = path.join(__dirname, '../../rajabrukat_products_complete_v2.xlsx');
console.log('Reading Excel from:', excelPath);

const workbook = XLSX.readFile(excelPath);
console.log('Sheet Names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log(`Total rows in Excel: ${rawData.length}`);
if (rawData.length > 0) {
  console.log('Keys/Headers in first row:', Object.keys(rawData[0]));
  console.log('\n--- Sample Row 1 ---');
  console.log(JSON.stringify(rawData[0], null, 2));

  console.log('\n--- Sample Row 2 ---');
  if (rawData.length > 1) {
    console.log(JSON.stringify(rawData[1], null, 2));
  }

  console.log('\n--- Sample Row 3 ---');
  if (rawData.length > 2) {
    console.log(JSON.stringify(rawData[2], null, 2));
  }
}
