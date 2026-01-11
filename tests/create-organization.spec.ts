import { test, expect } from "@playwright/test";

test.describe("Create Organization", () => {
  test("should create a new organization successfully", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:3001");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Log in with test credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Sign in")');

    if (await emailInput.isVisible()) {
      await emailInput.fill("paymenttest1@example.com");
      await passwordInput.fill("TestPassword123!");
      await loginButton.click();

      // Wait for redirect to dashboard
      await page.waitForURL("**/dashboard", { timeout: 10000 });
    }

    // Find and click the workspace switcher
    const workspaceSwitcher = page.locator(
      'button:has-text("Switch Context"), button:has-text("Switch Account")'
    ).first();
    await workspaceSwitcher.click();

    // Wait for dropdown to open
    await page.waitForSelector('text="Orgs"', { timeout: 5000 });

    // Click on the Orgs tab
    await page.locator('button:has-text("Orgs")').click();

    // Wait for organizations list to load
    await page.waitForTimeout(1000);

    // Click on Create Organization button
    const createOrgButton = page.locator('button:has-text("Create Organization")');
    await expect(createOrgButton).toBeVisible();
    await createOrgButton.click();

    // Wait for modal to open
    await page.waitForSelector('text="Create New Organization"', {
      timeout: 5000,
    });

    // Fill in organization name
    const orgNameInput = page.locator('input[id="organization-name"]');
    await orgNameInput.fill("Test Organization 2");

    // Click Create button
    const createButton = page.locator('button:has-text("Create Organization")');
    await createButton.click();

    // Wait for success message
    await page.waitForSelector('text="created successfully"', {
      timeout: 10000,
    });

    // Verify redirect or page update
    await page.waitForTimeout(2000);

    // Open workspace switcher again to verify the organization appears
    await workspaceSwitcher.click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Orgs")').click();
    await page.waitForTimeout(500);

    // Check if the new organization appears in the list
    const newOrg = page.locator('text="Test Organization 2"');
    await expect(newOrg).toBeVisible();

    console.log("✓ Organization created successfully");

    // Navigate to billing page
    await page.goto("http://localhost:3001/billing");
    await page.waitForLoadState("networkidle");

    // Verify billing page loads
    await expect(page.locator('h1, h2').filter({ hasText: /billing|subscription/i })).toBeVisible({ timeout: 10000 });

    console.log("✓ Billing page accessible");
  });
});
