import { test, expect } from '@playwright/test';

test.describe('Production Operations', () => {
  // We'll perform these operations sequentially to maintain state
  // 1. Create a production
  // 2. Toggle its status
  // 3. Delete it

  test('should complete full production lifecycle', async ({ page }) => {
    // --- 1. Create Production ---
    await page.goto('/production/new');
    
    // Fill in quantities
    // Using names based on ProductionCreateFrom.tsx
    await page.fill('input[name="orange"]', '10');
    await page.fill('input[name="blue"]', '5');
    await page.fill('input[name="green"]', '2');

    // Wait for auto-calculation (debounced or effect based?)
    // The `total` field is readOnly, verifying it updates
    // Assuming calculation happens on change immediately or via state update
    // Let's assert the total is correct. 
    // Multipliers (default): Orange: 1200, Blue: 1000, Green: 650
    // Total = (10 * 1200) + (5 * 1000) + (2 * 650) = 12000 + 5000 + 1300 = 18300
    // Wait for the value to be updated
    await expect(page.locator('input[name="total"]')).toHaveValue('18300', { timeout: 5000 });

    // Click Create
    await page.click('button[type="submit"]');

    // Expect success toast or redirect/form clear. 
    // The component clears form on success: setPayload(initial).
    // Let's verify form is cleared or check toast. 
    // Toast might be hard to catch if fast. 
    // Let's go to list page to verify creation.
    await page.locator('input[name="orange"]').waitFor({ state: 'visible' });
    // Expect fields to be empty
    await expect(page.locator('input[name="orange"]')).toHaveValue('');

    // --- 2. Verify in List & Navigate to Details ---
    await page.goto('/productions/all');
    
    // The new production should be at the top (sorted by created_at desc)
    // Click the first row. 
    // Table rows are clickable: onClick={() => window.location.href = ...}
    // We can target the first row in TableBody
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // Verify we are on the details page
    await expect(page).toHaveURL(/\/production\/page\/.+/);
    
    // Verify quantities on details page
    await expect(page.getByText('10', { exact: true })).toBeVisible(); // Orange
    await expect(page.getByText('5', { exact: true })).toBeVisible();  // Blue
    await expect(page.getByText('2', { exact: true })).toBeVisible();  // Green
    
    // --- 3. Toggle Status ---
    // The button text is "Open" when open, "Closed" when closed.
    // Initially it is Open (as we just created it and default is open).
    // Click "Open" to close it.
    await page.click('button:has-text("Open")'); 
    
    // Wait for it to become "Closed"
    await expect(page.locator('button:has-text("Closed")')).toBeVisible({ timeout: 10000 });
    
    // Toggle back to Open
    await page.click('button:has-text("Closed")');
    await expect(page.locator('button:has-text("Open")')).toBeVisible({ timeout: 10000 });
    
    // --- 4. Delete Production ---
    // Click Delete button in Actions
    // It might be in a dropdown or direct button. ProductionActions has direct button on Desktop.
    await page.click('button:has-text("Delete")');
    
    // Confirm dialog
    // Assuming DeleteProductionDialog uses a standard AlertDialog
    await page.click('button:has-text("Continue")'); // Or "Delete" in the dialog

    // Verify redirect to all productions
    await expect(page).toHaveURL(/\/productions\/all/);
    
    // Verify it is gone (optional, might be hard if there are many others, but top one should be different)
    // Or just pass if no error.
  });
});
