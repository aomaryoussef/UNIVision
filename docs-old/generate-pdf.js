const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const htmlPath = path.join(__dirname, "documentation.html");
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });

  const outputPath = path.join(__dirname, "UniVision_Documentation.pdf");
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8px;color:#a0aec0;width:100%;text-align:center;padding:5px 0;">UniVision — Project Documentation</div>`,
    footerTemplate: `<div style="font-size:8px;color:#a0aec0;width:100%;text-align:center;padding:5px 0;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
  });

  console.log(`PDF generated: ${outputPath}`);
  await browser.close();
})();
