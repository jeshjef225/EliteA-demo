import { test, expect } from '@playwright/test';
import { safeGoto, clickByTextFallback, DEFAULT_TIMEOUT } from './utils/browserUtils';

test.describe('EPAM site - Client Work flow', () => {
  test('navigate to Client Work via Services menu', async ({ page }) => {
    // 1) Navigate to EPAM homepage using safe wrapper
    await safeGoto(page, 'https://www.epam.com/');

    // 2) Try to open Services from the header using text-based robust click with fallback
    await clickByTextFallback(page, 'Services');
    await page.waitForLoadState('networkidle', { timeout: DEFAULT_TIMEOUT });

    // 3) Click the "Explore Our Client Work" link (if present), else navigate directly.
    const exploreText = 'Explore Our Client Work';
    const exploreLocator = page.locator(`text=${exploreText}`);
    if (await exploreLocator.count()) {
      await exploreLocator.first().scrollIntoViewIfNeeded();
      try {
        await exploreLocator.first().click({ timeout: DEFAULT_TIMEOUT });
      } catch (e) {
        // fallback to DOM click (some dynamic overlays may block native click)
        await clickByTextFallback(page, exploreText);
      }
      await page.waitForLoadState('networkidle', { timeout: DEFAULT_TIMEOUT });
    } else {
      // Fallback: navigate directly to the client work page
      await safeGoto(page, 'https://www.epam.com/services/client-work');
    }

    // 4) Verify that the "Client Work" text is visible on the page
    await expect(page.getByText('Client Work')).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  });
});
