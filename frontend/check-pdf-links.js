const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function checkAnnotations() {
  const data = new Uint8Array(fs.readFileSync('./public/Katalog.pdf'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  console.log(`Total pages: ${pdf.numPages}`);
  
  let totalLinks = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const annotations = await page.getAnnotations();
    const links = annotations.filter(a => a.subtype === 'Link');
    if (links.length > 0) {
      console.log(`Page ${i} has ${links.length} links.`);
      links.forEach(l => console.log(`  Url: ${l.url}, Dest: ${l.dest}, Rect: ${l.rect}`));
      totalLinks += links.length;
    }
  }
  
  console.log(`Total links in PDF: ${totalLinks}`);
}

checkAnnotations().catch(console.error);
