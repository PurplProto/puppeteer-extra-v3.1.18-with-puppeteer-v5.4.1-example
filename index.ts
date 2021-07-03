#!/usr/bin/env node
import puppeteerTypes from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { URL } from 'url';

async function processUrl(browser: puppeteerTypes.Browser, url: URL) {
  browser.on('disconnected', () => {
    console.error('Browser no longer available! Did it crash?', 'error', 1);
    process.exit(1);
  });

  async function handlePageClose(page: puppeteerTypes.Page) {
    console.log(`Closing page!`);
    await page.close();
    if (!page.isClosed()) {
      console.log('Page did not close!', 'error');
    }
  }

  console.log(`processing URL: ${url.href}`);

  const page = await browser.newPage();

  let response: puppeteerTypes.Response | null;
  try {
    response = await page.goto(url.href);
  } catch (error) {
    console.log(`Failed to navigate to page: ${url.href}`, 'error');
    handlePageClose(page);
    process.exit(1);
  }

  if (response && !response.ok() && response.status() > 400 && response.status() !== 503) {
    console.log(
      `Got a non-success status for page: ${url.href} of "${response.status()}: ${response.statusText()}"`
    );
    handlePageClose(page);
    process.exit(1);
  }

  await page.waitForSelector('title');
  let element = await page.$('title');
  let content = await page.evaluate(el => el.textContent, element);
  await handlePageClose(page);
  console.log(`Here's the page content for ${url.href}:\n`, content);
  process.exit(0);
}

puppeteer.use(AdblockerPlugin()).use(StealthPlugin());
puppeteer.launch({ headless: true })
  .then(browser => {
    processUrl(browser, new URL('https://www.codepen.io'));
  })
  .catch(e => {
    console.error('something got borked!\n\n', e);
    process.exit(1);
  });
