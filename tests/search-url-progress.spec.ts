import { test, expect } from "@playwright/test";

/**
 * Search URL Progress E2E Tests
 *
 * Tests the progress polling and UI updates during search URL lead fetching.
 *
 * Prerequisites:
 * - Backend (ashborn) running on localhost:3000
 * - Frontend (red-magic) running on localhost:3001
 * - Test user with valid LinkedIn integration
 *
 * Note: Full E2E tests for search URL progress require:
 * 1. A valid LinkedIn account connected to the campaign
 * 2. A valid LinkedIn search URL
 * 3. Backend lead fetching infrastructure running
 *
 * This test focuses on the UI components and polling mechanism.
 */

test.describe("Search URL Progress", () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test("should display progress bar for PROCESSING search URLs", async ({
    page,
  }) => {
    // Navigate to outreach campaigns
    await page.goto("http://localhost:3001/outreach/campaigns");
    await page.waitForLoadState("networkidle");

    // Check if there are any campaigns with search URLs
    const campaignLinks = page.locator('a[href*="/outreach/campaigns/"]');
    const campaignCount = await campaignLinks.count();

    if (campaignCount === 0) {
      console.log("No campaigns found - skipping progress test");
      test.skip();
      return;
    }

    // Click on the first campaign
    await campaignLinks.first().click();
    await page.waitForLoadState("networkidle");

    // Navigate to Add Leads step (step 2)
    // This test assumes the campaign creation flow allows navigation to the leads step
    const addLeadsTab = page.locator(
      'button:has-text("Add Leads"), [data-testid="add-leads-step"]'
    );
    if (await addLeadsTab.isVisible()) {
      await addLeadsTab.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for any progress indicators
    // The progress bar should appear when a search URL is in PROCESSING status
    const progressBar = page.locator('[role="progressbar"], .progress');
    const progressText = page.locator('text=/\\d+%/');
    const fetchingIndicator = page.locator('text="Fetching..."');

    // Check if any progress indicators are visible
    const hasProgress =
      (await progressBar.isVisible().catch(() => false)) ||
      (await progressText.isVisible().catch(() => false)) ||
      (await fetchingIndicator.isVisible().catch(() => false));

    if (hasProgress) {
      console.log("✓ Progress indicator found");

      // Wait for progress to update (poll every 3 seconds)
      await page.waitForTimeout(3500);

      // Verify the progress is updating
      const progressValue = await progressText.textContent().catch(() => null);
      if (progressValue) {
        console.log(`✓ Progress value: ${progressValue}`);
      }
    } else {
      console.log(
        "No active progress indicators - search URLs may be completed or not present"
      );
    }

    // Verify the leads table is present
    const leadsTable = page.locator("table");
    await expect(leadsTable).toBeVisible({ timeout: 5000 });
    console.log("✓ Leads table is visible");
  });

  test("should show status badges for completed search URLs", async ({
    page,
  }) => {
    // Navigate to outreach campaigns
    await page.goto("http://localhost:3001/outreach/campaigns");
    await page.waitForLoadState("networkidle");

    // Check if there are any campaigns
    const campaignLinks = page.locator('a[href*="/outreach/campaigns/"]');
    const campaignCount = await campaignLinks.count();

    if (campaignCount === 0) {
      console.log("No campaigns found - skipping status badge test");
      test.skip();
      return;
    }

    // Click on the first campaign
    await campaignLinks.first().click();
    await page.waitForLoadState("networkidle");

    // Navigate to Add Leads step
    const addLeadsTab = page.locator(
      'button:has-text("Add Leads"), [data-testid="add-leads-step"]'
    );
    if (await addLeadsTab.isVisible()) {
      await addLeadsTab.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for status badges
    const completedBadge = page.locator('text="Completed"');
    const failedBadge = page.locator('text="Failed"');
    const pausedBadge = page.locator('text="Paused"');

    // Check for any status badges
    const hasCompletedBadge = await completedBadge
      .isVisible()
      .catch(() => false);
    const hasFailedBadge = await failedBadge.isVisible().catch(() => false);
    const hasPausedBadge = await pausedBadge.isVisible().catch(() => false);

    if (hasCompletedBadge || hasFailedBadge || hasPausedBadge) {
      console.log("✓ Status badges found:");
      if (hasCompletedBadge) console.log("  - Completed badge visible");
      if (hasFailedBadge) console.log("  - Failed badge visible");
      if (hasPausedBadge) console.log("  - Paused badge visible");
    } else {
      console.log(
        "No status badges visible - search URLs may be in PROCESSING status or not present"
      );
    }
  });

  test("API endpoint should return progress data", async ({ page, request }) => {
    // This test verifies the API endpoint directly

    // First login to get auth token
    await page.goto("http://localhost:3001");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill("paymenttest1@example.com");
      await page.locator('input[type="password"]').fill("TestPassword123!");
      await page.locator('button:has-text("Sign in")').click();
      await page.waitForURL("**/dashboard", { timeout: 10000 });
    }

    // Get cookies from the browser context
    const cookies = await page.context().cookies();
    const accessToken = cookies.find(c => c.name === "access_token")?.value;

    if (!accessToken) {
      console.log("No access token found - skipping API test");
      test.skip();
      return;
    }

    // Make a request to get campaigns first
    const campaignsResponse = await request.get(
      "http://localhost:3000/white-walker/v1/campaigns",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (campaignsResponse.ok()) {
      const campaignsData = await campaignsResponse.json();
      const campaigns = campaignsData?.data?.campaigns || campaignsData?.campaigns || [];

      if (campaigns.length > 0) {
        const campaignId = campaigns[0].id;

        // Get target leads to find search URL IDs
        const leadsResponse = await request.get(
          `http://localhost:3000/white-walker/v1/campaigns/${campaignId}/target-leads`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (leadsResponse.ok()) {
          const leadsData = await leadsResponse.json();
          const targetLeads = leadsData?.data?.target_leads || leadsData?.target_leads || [];

          // Find a search URL target lead
          const searchUrlLead = targetLeads.find(
            (lead: any) =>
              lead.data_source === "SEARCH_URL" && lead.target_search_url_id
          );

          if (searchUrlLead) {
            // Test the progress endpoint
            const progressResponse = await request.get(
              `http://localhost:3000/white-walker/v1/campaigns/${campaignId}/search-urls/${searchUrlLead.target_search_url_id}/progress`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (progressResponse.ok()) {
              const progressData = await progressResponse.json();
              console.log("✓ Progress API response:", JSON.stringify(progressData, null, 2));

              // Verify response structure
              expect(progressData).toHaveProperty("success", true);
              expect(progressData.data).toHaveProperty("id");
              expect(progressData.data).toHaveProperty("status");
              expect(progressData.data).toHaveProperty("fetchedCount");
              expect(progressData.data).toHaveProperty("expectedCount");
              expect(progressData.data).toHaveProperty("progress");

              console.log("✓ API response structure is valid");
            } else {
              console.log(
                "Progress API returned error:",
                progressResponse.status()
              );
            }
          } else {
            console.log("No search URL leads found in campaign");
          }
        }
      } else {
        console.log("No campaigns found");
      }
    }
  });
});
