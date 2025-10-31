require('dotenv').config({ path: '.dev.vars' });

const API_KEY = process.env.PAGESPEED_API_KEY;
const WEBHOOK_URL = process.env.PAGESPEED_WEBHOOK_URL;
const URL_TO_ANALYZE = process.env.SITE_URL;

console.log('Starting PageSpeed analysis for:', URL_TO_ANALYZE);

async function getPageSpeedReport(url, apiKey, strategy) {
  console.log(`Fetching PageSpeed report for ${strategy}...`);
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
  const categoryParams = categories.map(cat => `category=${cat}`).join('&');
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&strategy=${strategy}&${categoryParams}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Error fetching PageSpeed Insights: ${response.statusText}`);
  }
  console.log(`PageSpeed report for ${strategy} received successfully`);
  return await response.json();
}

async function sendToWebhook(webhookUrl, data) {
  console.log('Sending data to webhook...');
  console.log('Webhook URL:', webhookUrl);
  console.log('Payload:', JSON.stringify(data, null, 2));
  
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error sending to webhook: ${response.statusText}\nResponse: ${errorText}`);
  }
  console.log("Webhook sent successfully!");
}

(async () => {
  try {
    const desktopReport = await getPageSpeedReport(URL_TO_ANALYZE, API_KEY, 'desktop');
    const mobileReport = await getPageSpeedReport(URL_TO_ANALYZE, API_KEY, 'mobile');
    console.log('Processing PageSpeed results...');

    const payload = {
      text: `### PageSpeed Insights Report for ${URL_TO_ANALYZE}

| Media Type | Performance | Accessibility | Best Practices | SEO |
|------------|------------|---------------|----------------|-----|
| Mobile | ${(mobileReport.lighthouseResult.categories.performance.score * 100).toFixed(0)}% | ${(mobileReport.lighthouseResult.categories.accessibility.score * 100).toFixed(0)}% | ${(mobileReport.lighthouseResult.categories['best-practices'].score * 100).toFixed(0)}% | ${(mobileReport.lighthouseResult.categories.seo.score * 100).toFixed(0)}% |
| Desktop | ${(desktopReport.lighthouseResult.categories.performance.score * 100).toFixed(0)}% | ${(desktopReport.lighthouseResult.categories.accessibility.score * 100).toFixed(0)}% | ${(desktopReport.lighthouseResult.categories['best-practices'].score * 100).toFixed(0)}% | ${(desktopReport.lighthouseResult.categories.seo.score * 100).toFixed(0)}% |

[View Full Report](https://pagespeed.web.dev/report?url=${encodeURIComponent(URL_TO_ANALYZE)})`
    };

    console.log('Prepared payload:', JSON.stringify(payload, null, 2));
    await sendToWebhook(WEBHOOK_URL, payload);
  } catch (error) {
    console.error("Detailed error:", error.message);
    process.exit(1);
  }
})();
