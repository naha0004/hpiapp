const puppeteer = require('puppeteer');
const path = require('path');

const ads = [
  { file: 'ad-01-affordable-hpi-checks.html', output: 'ad-01-affordable-hpi-checks.png' },
  { file: 'ad-02-uk-traffic-appeals.html', output: 'ad-02-uk-traffic-appeals.png' },
  { file: 'ad-03-mot-tax-reminders.html', output: 'ad-03-mot-tax-reminders.png' },
  { file: 'ad-04-parking-ticket-defence.html', output: 'ad-04-parking-ticket-defence.png' },
  { file: 'ad-05-instant-vehicle-reports.html', output: 'ad-05-instant-vehicle-reports.png' },
  { file: 'ad-06-speed-camera-appeals.html', output: 'ad-06-speed-camera-appeals.png' },
  { file: 'ad-07-trade-dealer-solutions.html', output: 'ad-07-trade-dealer-solutions.png' },
  { file: 'ad-08-mobile-app-features.html', output: 'ad-08-mobile-app-features.png' },
  { file: 'ad-09-dvla-appeals.html', output: 'ad-09-dvla-appeals.png' },
  { file: 'ad-10-complete-uk-solution.html', output: 'ad-10-complete-uk-solution.png' }
];

async function generateAllAds() {
  console.log('🚀 Generating 10 feature ads (1080x1080)...');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  
  for (const ad of ads) {
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
      
      const htmlPath = path.join(__dirname, ad.file);
      await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
      await page.waitForSelector('.ad-artboard');
      
      await page.addStyleTag({ content: 'html,body{margin:0;padding:0;background:#ffffff;overflow:hidden;}' });
      await page.screenshot({ 
        path: ad.output, 
        type: 'png', 
        clip: { x:0, y:0, width:1080, height:1080 }, 
        omitBackground: false 
      });
      
      await page.close();
      console.log(`✅ Created ${ad.output}`);
    } catch (error) {
      console.error(`❌ Failed to create ${ad.output}:`, error.message);
    }
  }
  
  await browser.close();
  console.log('🎉 All ads generated successfully!');
}

generateAllAds().catch(err => {
  console.error('❌ Batch generation failed:', err);
  process.exit(1);
});
