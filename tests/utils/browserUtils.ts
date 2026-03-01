import { Page } from '@playwright/test';

// Utility helpers for robust browser interactions used across tests.
// This file will be populated incrementally with small, focused helpers.

export const DEFAULT_TIMEOUT = 30_000;

export async function safeGoto(page: Page, url: string, timeout = DEFAULT_TIMEOUT) {
  // basic wrapper; implementation to be added
  await page.goto(url, { timeout });
}

export async function robustClick(page: Page, selector: string, timeout = DEFAULT_TIMEOUT) {
  // basic wrapper; implementation to be added
  await page.click(selector, { timeout });
}

export async function clickByTextFallback(page: Page, text: string, timeout = DEFAULT_TIMEOUT) {
  // basic wrapper; implementation to be added
  const locator = page.locator(`text=${text}`);
  if (await locator.count()) {
    await locator.first().click({ timeout });
  } else {
    // fallback evaluate
    await page.evaluate((t) => {
      const el = Array.from(document.querySelectorAll('a,button')).find(e => e.textContent && e.textContent.trim() === t);
      if (el) (el as HTMLElement).click();
    }, text);
  }
}
