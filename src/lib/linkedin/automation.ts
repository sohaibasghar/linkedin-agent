import type { LinkedInPostResult } from './api';

export async function publishViaAutomation(content: string): Promise<LinkedInPostResult> {
  const { chromium } = await import('playwright');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

    // Navigate to LinkedIn
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle' });

    // Check if already authenticated via stored session
    const isLoggedIn = await page
      .locator('[data-control-name="nav.home"]')
      .isVisible()
      .catch(() => false);

    if (!isLoggedIn) {
      throw new Error(
        'LinkedIn automation: not authenticated. Store a valid browser session or use API auth.'
      );
    }

    // Navigate to feed to open composer
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle' });

    // Click "Start a post" button
    await page.locator('[data-control-name="share.sharebox_text"]').click();
    await page.waitForSelector('.ql-editor', { timeout: 10000 });

    // Fill in content
    await page.locator('.ql-editor').fill(content);

    // Click Post button
    await page.locator('button.share-actions__primary-action').click();

    // Wait for confirmation and capture post URL
    await page.waitForURL(/linkedin\.com\/feed\/update\//, { timeout: 15000 });

    const url = page.url();
    const match = url.match(/update\/(urn:li:activity:\d+)/);
    const linkedInPostId = match ? match[1] : `automation-${Date.now()}`;

    return { linkedInPostId };
  } finally {
    await browser.close();
  }
}
