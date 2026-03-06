import { expect, type Page } from '@playwright/test';

// Test data sourced from SauceLab_TestData.pdf
export const saucedemoData = {
  baseUrl: 'https://www.saucedemo.com/',
  validUser: { username: 'standard_user', password: 'secret_sauce' },
  invalidUser: { username: 'invalid_user', password: 'secret_sauce' },
  invalidPassword: { username: 'standard_user', password: 'wrong_password' },
  bothInvalid: { username: 'invalid_user', password: 'wrong_password' },
  lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
  expectedErrors: {
    invalidCredentials: 'Username and password do not match any user in this service',
    usernameRequired: 'Username is required',
    passwordRequired: 'Password is required',
    lockedOut: 'Sorry, this user has been locked out.',
  },
  // Reasonably implied "dashboard" page for SauceDemo after login
  protectedInventoryPath: 'inventory.html',
};

export const saucedemoSelectors = {
  username: '#user-name',
  password: '#password',
  loginButton: '#login-button',
  errorMessage: '[data-test="error"]',
  inventoryContainer: '#inventory_container',
};

export async function gotoLogin(page: Page) {
  await page.goto(saucedemoData.baseUrl);
  await page.waitForLoadState('domcontentloaded');
}

export async function login(page: Page, username: string, password: string) {
  await page.locator(saucedemoSelectors.username).fill(username);
  await page.locator(saucedemoSelectors.password).fill(password);
  await page.locator(saucedemoSelectors.loginButton).click();
}

export async function expectOnInventory(page: Page) {
  await expect(page).toHaveURL(/\/inventory\.html(?:\?.*)?$/);
  await expect(page.locator(saucedemoSelectors.inventoryContainer)).toBeVisible();
}

export async function expectLoginErrorContains(page: Page, expectedSubstring: string) {
  const error = page.locator(saucedemoSelectors.errorMessage);
  await expect(error).toBeVisible();
  await expect(error).toContainText(expectedSubstring);
}
