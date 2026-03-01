import { Page } from '@playwright/test';

// Utility helpers for robust browser interactions used across tests.
// Focus: safer navigation, resilient clicks with DOM fallbacks, and simple retry helpers.

export const DEFAULT_TIMEOUT = 30_000;

async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < attempts - 1) await delay(delayMs * (i + 1));
    }
  }
  throw lastError;
}

export async function safeGoto(page: Page, url: string, timeout = DEFAULT_TIMEOUT, attempts = 3) {
  // Attempts to navigate and wait for network idle, with retries.
  return retry(async () => {
    await page.goto(url, { timeout });
    // Some pages take extra to settle; prefer networkidle for stable state
    await page.waitForLoadState('networkidle', { timeout });
  }, attempts, 1000);
}

export async function clickByTextFallback(page: Page, text: string, timeout = DEFAULT_TIMEOUT, attempts = 2) {
  // Tries a Locator click first, then falls back to a DOM click via evaluate.
  return retry(async () => {
    const locator = page.locator(`text=${text}`);
    const count = await locator.count();
    if (count) {
      await locator.first().scrollIntoViewIfNeeded();
      try {
        await locator.first().click({ timeout });
        return;
      } catch (e) {
        // try force click as a next attempt
        await locator.first().click({ force: true, timeout }).catch(() => {});
      }
    }

    // fallback: DOM evaluation click (matches exact trimmed text)
    const clicked = await page.evaluate((t) => {
      const el = Array.from(document.querySelectorAll('a,button,div,span')).find(e => e.textContent && e.textContent.trim() === t);
      if (el) {
        (el as HTMLElement).click();
        return true;
      }
      return false;
    }, text);

    if (!clicked) throw new Error(`Element with exact text "${text}" not found for click fallback`);
  }, attempts, 500);
}

export async function waitForTextVisible(page: Page, text: string, timeout = DEFAULT_TIMEOUT) {
  const locator = page.getByText(text);
  await locator.first().waitFor({ state: 'visible', timeout });
}

export default {
  safeGoto,
  clickByTextFallback,
  waitForTextVisible,
  retry,
  DEFAULT_TIMEOUT,
};
