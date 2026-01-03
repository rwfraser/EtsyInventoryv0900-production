import { chromium } from 'playwright';
import { OpenAI } from 'openai';

const openai = new OpenAI();

async function scrapeGemstones(url: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // 1. Extract raw text/HTML from the product container
  const productsRaw = await page.$$eval('.product-small.col', (els) => 
    els.map(el => el.innerText)
  );

  // 2. Delegate parsing to AI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Cost-effective for extraction
    messages: [
      { role: "system", content: "Extract product data into JSON: { name, price, size, shape, material }." },
      { role: "user", content: productsRaw.join("\n---\n") }
    ],
    response_format: { type: "json_object" }
  });

  console.log("Structured Data:", completion.choices[0].message.content);
  await browser.close();
}