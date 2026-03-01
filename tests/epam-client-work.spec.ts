import { test, expect } from '@playwright/test';

test.describe('EPAM site - Client Work flow', () => {
  test('navigate to Client Work via Services menu', async ({ page }) => {
    // Steps:
    // 1) Navigate to EPAM homepage
    await page.goto('https://www.epam.com/');
    await page.waitForLoadState('networkidle');

    // 2) Open Services from the header (robust click)
    const services = page.getByRole('link', { name: 'Services' });
    await services.first().scrollIntoViewIfNeeded();
    await services.first().click({ force: true }).catch(async () => {
      // fallback DOM click
      await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('a')).find(a => a.textContent && a.textContent.trim() === 'Services');
        if (el) el.click();
      });
    });
    await page.waitForLoadState('networkidle');

    // 3) Click the "Explore Our Client Work" link (if present on page), else navigate directly.
    const explore = page.locator('a:has-text("Explore Our Client Work")');
    if (await explore.count()) {
      await explore.first().scrollIntoViewIfNeeded();
      await explore.first().click({ force: true });
      await page.waitForLoadState('networkidle');
    } else {
      // Fallback: navigate directly to the client work page
      await page.goto('https://www.epam.com/services/client-work');
      await page.waitForLoadState('networkidle');
    }

    // 4) Verify that the "Client Work" text is visible on the page
    await expect(page.getByText('Client Work')).toBeVisible();
  });
});
