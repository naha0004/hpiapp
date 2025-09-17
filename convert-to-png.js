const puppeteer = require('puppeteer');
const path = require('path');

async function convertHtmlToPng() {
  console.log('🎨 Exporting with updated original logo & brand color -> bailiffad.png');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  const htmlPath = path.join(__dirname, 'bailiff-appeal-ad.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
  await page.waitForSelector('.ad-artboard');
  await page.addStyleTag({ content: 'html,body{margin:0;padding:0;background:#ffffff;overflow:hidden;}' });
  await page.screenshot({ path: 'bailiffad.png', type: 'png', clip:{ x:0,y:0,width:1080,height:1080 }, omitBackground:false });
  await browser.close();
  console.log('✅ Saved bailiffad.png with original logo');
}

convertHtmlToPng().catch(e => { console.error('❌ Export failed', e); process.exit(1); });
