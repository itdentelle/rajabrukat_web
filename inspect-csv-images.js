const fs = require('fs');

const content = fs.readFileSync('wc-product-export-18-8-2026-1787036722228.csv', 'utf8');

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') { cell += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim()); cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(cell.trim());
      if (row.some(c => c.length > 0)) rows.push(row);
      row = []; cell = '';
    } else { cell += char; }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell.trim()); if (row.some(c => c.length > 0)) rows.push(row); }
  return rows;
}

const rows = parseCSV(content);
const headers = rows[0].map(h => h.replace(/^\uFEFF/, '').trim());
const nameIdx = headers.indexOf('Name');
const imagesIdx = headers.indexOf('Images');

console.log('Sample 8 Products and their Images from CSV:');
rows.slice(1, 9).forEach((r, i) => {
  console.log(`\n[${i+1}] ${r[nameIdx].substring(0, 50)}`);
  const imgs = (r[imagesIdx] || '').split(',').map(s => s.trim()).filter(Boolean);
  console.log(`  -> Total Images: ${imgs.length}`);
  imgs.forEach((img, idx) => {
    const fn = decodeURIComponent(img.split('/').pop() || '');
    console.log(`     #${idx + 1} ${idx === 0 ? '[⭐ FEATURED / THUMBNAIL]' : '[GALLERY / COLOR]'}: ${fn}`);
  });
});
