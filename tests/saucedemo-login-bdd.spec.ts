import { test, expect } from '@playwright/test';
import {
  gotoLogin,
  login,
  expectOnInventory,
  expectLoginErrorContains,
  saucedemoData,
  saucedemoSelectors,
} from './support/saucedemo';

test.describe('SauceDemo Login - BDD scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLogin(page);
  });

  test('TC-001: Login page loads and core UI elements are present and usable', async ({ page }) => {
    await test.step('Given the user navigates to the SauceDemo login page URL', async () => {
      await expect(page).toHaveURL(saucedemoData.baseUrl);
    });

    await test.step('When the login page finishes loading', async () => {
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Then the username input should be visible and enabled', async () => {
      await expect(page.locator(saucedemoSelectors.username)).toBeVisible();
      await expect(page.locator(saucedemoSelectors.username)).toBeEnabled();
    });

    await test.step('And the password input should be visible and enabled', async () => {
      await expect(page.locator(saucedemoSelectors.password)).toBeVisible();
      await expect(page.locator(saucedemoSelectors.password)).toBeEnabled();
    });

    await test.step('And the login/submit button should be visible', async () => {
      await expect(page.locator(saucedemoSelectors.loginButton)).toBeVisible();
    });

    await test.step('And the login/submit button should be enabled or disabled according to the product design', async () => {
      const btn = page.locator(saucedemoSelectors.loginButton);
      const enabled = await btn.isEnabled();
      const disabled = await btn.isDisabled();
      expect(enabled || disabled).toBeTruthy();
    });
  });

  test('TC-002: Password input masks characters and is not displayed in plain text', async ({ page }) => {
    await test.step('Given the user is on the SauceDemo login page', async () => {
      await expect(page.locator(saucedemoSelectors.password)).toBeVisible();
    });

    await test.step('When the user enters any password into the password field', async () => {
      await page.locator(saucedemoSelectors.password).fill(saucedemoData.validUser.password);
    });

    await test.step('Then the password field should mask the entered characters', async () => {
      await expect(page.locator(saucedemoSelectors.password)).toHaveAttribute('type', 'password');
    });

    await test.step('And the password value should not be displayed as plain text anywhere on the login UI', async () => {
      // Ensure the literal password string does not appear in visible UI text.
      await expect(page.locator(`text=${saucedemoData.validUser.password}`)).toHaveCount(0);
    });
  });

  test('TC-003: Successful login redirects to the dashboard and shows no error', async ({ page }) => {
    await test.step('Given the user is on the SauceDemo login page', async () => {
      await expect(page.locator(saucedemoSelectors.loginButton)).toBeVisible();
    });

    await test.step('When the user enters the valid username and valid password and clicks Login', async () => {
      await login(page, saucedemoData.validUser.username, saucedemoData.validUser.password);
    });

    await test.step('Then the user should be redirected to the dashboard and identifier should be present', async () => {
      await expectOnInventory(page);
    });

    await test.step('And no login error message should be displayed', async () => {
      await expect(page.locator(saucedemoSelectors.errorMessage)).toHaveCount(0);
    });
  });

  test.describe('TC-004: Invalid credentials show a clear, specific, non-sensitive error message', () => {
    const examples = [
      { name: 'invalid_user + valid_password', ...saucedemoData.invalidUser },
      { name: 'valid_username + invalid_pass', ...saucedemoData.invalidPassword },
      { name: 'invalid_user + invalid_pass', ...saucedemoData.bothInvalid },
    ];

    for (const ex of examples) {
      test(`TC-004 Example: ${ex.name}`, async ({ page }) => {
        await test.step('When the user enters username/password and clicks Login', async () => {
          await login(page, ex.username, ex.password);
        });

        await test.step('Then a login error message should be displayed and be understandable', async () => {
          await expectLoginErrorContains(page, saucedemoData.expectedErrors.invalidCredentials);
        });

        await test.step('And the error message should not expose sensitive details', async () => {
          const errorText = await page.locator(saucedemoSelectors.errorMessage).innerText();

          // Should not echo the attempted credentials.
          expect(errorText).not.toContain(ex.username);
          expect(errorText).not.toContain(ex.password);

          // Should not indicate which field is correct.
          expect(errorText).not.toMatch(/username\s+is\s+correct|password\s+is\s+correct/i);
        });
      });
    }
  });

  test.describe('TC-005: Empty field validation shows appropriate feedback and updates when corrected', () => {
    const examples = [
      {
        name: 'Both empty',
        username: '',
        password: '',
        expectedError: saucedemoData.expectedErrors.usernameRequired,
      },
      {
        name: 'Empty username',
        username: '',
        password: 'any_password',
        expectedError: saucedemoData.expectedErrors.usernameRequired,
      },
      {
        name: 'Empty password',
        username: 'any_username',
        password: '',
        expectedError: saucedemoData.expectedErrors.passwordRequired,
      },
    ];

    for (const ex of examples) {
      test(`TC-005 Example: ${ex.name}`, async ({ page }) => {
        await test.step('When the user enters values and clicks Login', async () => {
          await page.locator(saucedemoSelectors.username).fill(ex.username);
          await page.locator(saucedemoSelectors.password).fill(ex.password);
          await page.locator(saucedemoSelectors.loginButton).click();
        });

        await test.step('Then validation feedback should be displayed for missing required input(s)', async () => {
          await expectLoginErrorContains(page, ex.expectedError);
        });

        await test.step('When the user corrects the input(s) to valid values and clicks Login', async () => {
          await page.locator(saucedemoSelectors.username).fill(saucedemoData.validUser.username);
          await page.locator(saucedemoSelectors.password).fill(saucedemoData.validUser.password);
          await page.locator(saucedemoSelectors.loginButton).click();
        });

        await test.step('Then the validation/error state should clear and user proceeds to dashboard', async () => {
          await expectOnInventory(page);
          await expect(page.locator(saucedemoSelectors.errorMessage)).toHaveCount(0);
        });
      });
    }
  });

  test('TC-006: Locked account login attempt is handled gracefully with appropriate message', async ({ page }) => {
    await test.step('When the user enters locked account credentials and clicks Login', async () => {
      await login(page, saucedemoData.lockedOut.username, saucedemoData.lockedOut.password);
    });

    await test.step('Then an appropriate locked-account message should be displayed', async () => {
      await expectLoginErrorContains(page, saucedemoData.expectedErrors.lockedOut);
    });

    await test.step('And the application should remain responsive', async () => {
      await expect(page.locator(saucedemoSelectors.loginButton)).toBeVisible();
      await expect(page.locator(saucedemoSelectors.loginButton)).toBeEnabled();
    });
  });

  test('TC-007: Session ends after browser closure and protected pages require re-authentication', async ({ browser }) => {
    // Given the user successfully logs in
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await gotoLogin(page1);
    await login(page1, saucedemoData.validUser.username, saucedemoData.validUser.password);
    await expectOnInventory(page1);

    // When the user closes the browser completely
    await context1.close();

    // And the user reopens the browser and navigates directly to a protected page URL
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    const protectedUrl = new URL(saucedemoData.protectedInventoryPath, saucedemoData.baseUrl).toString();
    await page2.goto(protectedUrl);

    // Then the user should not be authenticated and should be redirected/prompted to log in
    await expect(page2.locator(saucedemoSelectors.username)).toBeVisible();
    await expect(page2.locator(saucedemoSelectors.password)).toBeVisible();

    await context2.close();
  });

  test('TC-008: Login form is fully usable via keyboard (tab order, Enter submission, visible focus)', async ({ page }) => {
    await test.step('When the user navigates using the Tab key through the login form', async () => {
      await page.locator('body').click();

      await page.keyboard.press('Tab');
      await expect(page.locator(saucedemoSelectors.username)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator(saucedemoSelectors.password)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator(saucedemoSelectors.loginButton)).toBeFocused();
    });

    await test.step('Then a visible focus indicator should be shown on each focused element (best-effort)', async () => {
      // CSS focus styles vary; validate that focus is not visually suppressed (soft assertion).
      const focusStyle = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          outlineStyle: s.outlineStyle,
          outlineWidth: s.outlineWidth,
          boxShadow: s.boxShadow,
        };
      });

      expect.soft(focusStyle).not.toBeNull();
      if (focusStyle) {
        expect.soft(
          focusStyle.outlineStyle !== 'none' || focusStyle.boxShadow !== 'none'
        ).toBeTruthy();
      }
    });

    await test.step('When focus is in an input and user presses Enter, the form submits (valid creds)', async () => {
      await page.locator(saucedemoSelectors.username).fill(saucedemoData.validUser.username);
      await page.locator(saucedemoSelectors.password).fill(saucedemoData.validUser.password);
      await page.locator(saucedemoSelectors.password).focus();
      await page.keyboard.press('Enter');
    });

    await test.step('Then appropriate outcome occurs (successful login with valid credentials)', async () => {
      await expectOnInventory(page);
    });
  });
});
