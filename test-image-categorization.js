const fs = require('fs');
const path = require('path');

const SCRAPED_DIR = 'C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb\\hasil_scraping';

function isNonColorImage(filename) {
  const f = filename.toLowerCase();
  return (
    f.includes('manekin') ||
    f.includes('gambar utama') ||
    f.includes('detail motif') ||
    f.includes('detail-motif') ||
    f.includes('chatgpt') ||
    f.includes('banner') ||
    f.includes('watermark') ||
    f.includes('eksklusif') ||
    f.includes('100%') ||
    f.includes('hero')
  );
}

function cleanColorName(filename) {
  let name = path.parse(filename).name;
  name = name.replace(/[-_]/g, ' ').replace(/scaled|copy/gi, '').trim();
  // Remove numbers at end if any (e.g. "Gold 1" -> "Gold")
  name = name.replace(/\s+\d+$/g, '').trim();
  // Capitalize
  return name.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
}

function testCategorization() {
  const categories = ['Panel A Grade', 'Panel B Grade', 'Tulle'];
  let totalProducts = 0;
  let productsWithNoColors = 0;

  categories.forEach(cat => {
    const catPath = path.join(SCRAPED_DIR, cat);
    if (!fs.existsSync(catPath)) return;
    const folders = fs.readdirSync(catPath).filter(f => fs.statSync(path.join(catPath, f)).isDirectory());

    folders.forEach(folder => {
      totalProducts++;
      const fullPath = path.join(catPath, folder);
      const allFiles = fs.readdirSync(fullPath).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

      // 1. Hero Image
      const heroFile = allFiles.find(f => /manekin.*\.png$|gambar utama.*\.png$/i.test(f)) ||
                       allFiles.find(f => /manekin|gambar utama/i.test(f)) ||
                       allFiles[0];

      // 2. Detail / Texture Motif files
      const detailFiles = allFiles.filter(f => f !== heroFile && isNonColorImage(f));

      // 3. True Color Variant files
      const colorFiles = allFiles.filter(f => f !== heroFile && !isNonColorImage(f));

      const colors = colorFiles.map(f => cleanColorName(f));
      const uniqueColors = Array.from(new Set(colors));

      if (uniqueColors.length === 0) {
        productsWithNoColors++;
        console.log(`⚠️ Produk tanpa foto varian warna spesifik: [${cat}] ${folder.substring(0, 50)}`);
        console.log(`   Files:`, allFiles);
      }
    });
  });

  console.log(`\nTotal Produk Diperiksa: ${totalProducts}`);
  console.log(`Produk tanpa varian warna terpisah: ${productsWithNoColors}`);
}

testCategorization();
