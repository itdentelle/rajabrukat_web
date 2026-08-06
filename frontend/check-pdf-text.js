const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractText() {
  const data = new Uint8Array(fs.readFileSync('./public/Katalog.pdf'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  
  for (let i = 2; i <= 5; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(' ');
    console.log(`Page ${i} text:`, text.substring(0, 200));
  }
}

extractText().catch(console.error);
