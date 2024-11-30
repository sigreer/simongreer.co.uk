const fetch = require("node-fetch");
require('dotenv').config({ path: '.dev.vars' });

const API_KEY = process.env.PAGESPEED_API_KEY;
const WEBHOOK_URL = process.env.PAGESPEED_WEBHOOK_URL;
const URL_TO_ANALYZE = process.env.SITE_URL;

async function getPageSpeedReport(url, apiKey) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Error fetching PageSpeed Insights: ${response.statusText}`);
  }
  return await response.json();
}

async function sendToWebhook(webhookUrl, data) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Error sending to webhook: ${response.statusText}`);
  }
  console.log("Webhook sent successfully!");
}

(async () => {
  try {
    const report = await getPageSpeedReport(URL_TO_ANALYZE, API_KEY);

    // Prepare payload for the webhook
    const payload = {
      url: URL_TO_ANALYZE,
      performance_score: report.lighthouseResult.categories.performance.score,
      metrics: {
        first_contentful_paint: report.lighthouseResult.audits["first-contentful-paint"].displayValue,
        speed_index: report.lighthouseResult.audits["speed-index"].displayValue,
      },
    };

    // Send the report to the webhook
    await sendToWebhook(WEBHOOK_URL, payload);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1); // Exit with an error code to fail the build if needed
  }
})();
