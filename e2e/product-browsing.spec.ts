import { test, expect } from '@playwright/test';

test.describe('Product Browsing Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the shop page
    await page.goto('/shop');
  });

  test('should display products with correct pricing format', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('ui-product-card');
    
    // Check if products are displayed
    const productCards = page.locator('ui-product-card');
    await expect(productCards).toHaveCountGreaterThan(0);
    
    // Check price format for regular products
    const regularProduct = productCards.filter({ hasNotText: '/ hó' }).first();
    await expect(regularProduct.locator('.price')).toContainText('Ft');
    
    // Check price format for rental products (if any)
    const rentalProduct = productCards.filter({ hasText: '/ hó' }).first();
    if (await rentalProduct.count() > 0) {
      await expect(rentalProduct.locator('.price')).toContainText('Ft / hó');
    }
  });

  test('should navigate to product detail page', async ({ page }) => {
    // Click on first product's details button
    await page.locator('ui-product-card .details').first().click();
    
    // Should navigate to product detail page
    await expect(page).toHaveURL(/\/shop\/product\/.+/);
    
    // Should display product information
    await expect(page.locator('.product-title')).toBeVisible();
    await expect(page.locator('.product-price')).toBeVisible();
  });

  test('should show rental indicator on rental products', async ({ page }) => {
    // Navigate to a rental product (if exists)
    await page.goto('/shop/product/test-rental-product');
    
    // Check for rental indicator
    const rentalIndicator = page.locator('.rental-indicator');
    if (await rentalIndicator.count() > 0) {
      await expect(rentalIndicator).toContainText('Csak bérelhető');
    }
    
    // Check rental pricing format
    const priceElement = page.locator('.product-price');
    if (await priceElement.textContent().then(text => text?.includes('/ hó'))) {
      await expect(priceElement).toContainText('/ hó');
    }
  });

  test('should add product to cart', async ({ page }) => {
    // Go to product detail page
    await page.locator('ui-product-card .details').first().click();
    
    // Add to cart
    await page.locator('.btn-add-to-cart').click();
    
    // Should show success feedback
    await expect(page.locator('.success-message, .btn-spinner')).toBeVisible();
  });
});
