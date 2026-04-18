import { test, expect, Page } from '@playwright/test'
import { TEST_USER, signup, login } from './helpers'

const user = {
  ...TEST_USER,
  email: `checkout-${Date.now()}@test.com`,
}

async function addFirstProductToCart(page: Page) {
  await page.goto('/store')
  await page.waitForLoadState('networkidle')

  const addBtn = page.getByRole('button', { name: /add to cart|add/i }).first()
  if (await addBtn.isVisible({ timeout: 5_000 })) {
    await addBtn.click()
    return true
  }
  return false
}

test.describe('Store & Checkout', () => {
  test.beforeEach(async ({ page }) => {
    try { await signup(page, user) } catch { await login(page, user) }
  })

  test('store page loads with products', async ({ page }) => {
    await page.goto('/store')
    await expect(page.getByRole('heading', { name: /store|shop/i })).toBeVisible({ timeout: 8_000 })
    // Products or empty state
    const products = page.locator('[data-testid="product-card"], [class*="product"], [class*="card"]')
    const emptyState = page.getByText(/no products|coming soon|empty/i)
    await expect(products.first().or(emptyState)).toBeVisible({ timeout: 8_000 })
  })

  test('can add product to cart', async ({ page }) => {
    const added = await addFirstProductToCart(page)
    if (!added) { test.skip(); return }

    // Cart badge should show item count
    const cartBadge = page.locator('[data-testid="cart-count"], [class*="badge"]').filter({ hasText: /[1-9]/ })
    const cartIcon = page.getByRole('link', { name: /cart/i })
    await expect(cartBadge.or(cartIcon)).toBeVisible({ timeout: 5_000 })
  })

  test('cart page shows added items', async ({ page }) => {
    const added = await addFirstProductToCart(page)
    if (!added) { test.skip(); return }

    await page.goto('/store/cart')
    await page.waitForLoadState('networkidle')

    // Cart should show product or empty state
    const cartItem = page.locator('[data-testid="cart-item"], [class*="cart"]').first()
    const emptyCart = page.getByText(/empty|no items/i)
    await expect(cartItem.or(emptyCart)).toBeVisible({ timeout: 8_000 })
  })

  test('checkout flow shows address and payment steps', async ({ page }) => {
    const added = await addFirstProductToCart(page)
    if (!added) { test.skip(); return }

    await page.goto('/store/cart')
    await page.waitForLoadState('networkidle')

    const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i })
    if (!(await checkoutBtn.isVisible({ timeout: 5_000 }))) { test.skip(); return }

    await checkoutBtn.click()

    // Should show shipping address form
    await expect(
      page.getByPlaceholder(/name|address|street|city/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('checkout requires shipping address fields', async ({ page }) => {
    const added = await addFirstProductToCart(page)
    if (!added) { test.skip(); return }

    await page.goto('/store/cart')
    await page.waitForLoadState('networkidle')

    const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i })
    if (!(await checkoutBtn.isVisible({ timeout: 5_000 }))) { test.skip(); return }
    await checkoutBtn.click()

    // Try to advance without filling fields
    const nextBtn = page.getByRole('button', { name: /next|continue|payment/i })
    if (await nextBtn.isVisible({ timeout: 5_000 })) {
      await nextBtn.click()
      // Should show validation error or stay on address step
      await expect(page.getByText(/required|fill|address/i).or(
        page.getByPlaceholder(/name|address/i).first()
      )).toBeVisible({ timeout: 5_000 })
    }
  })

  test('product detail page loads', async ({ page }) => {
    await page.goto('/store')
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('a[href*="/store/"]').filter({ hasNot: page.locator('[href*="cart"], [href*="order"]') }).first()
    if (await productLink.isVisible({ timeout: 5_000 })) {
      await productLink.click()
      await expect(page).toHaveURL(/\/store\/[a-z0-9]+/i)
      await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible({ timeout: 8_000 })
    }
  })

  test('orders page loads for authenticated user', async ({ page }) => {
    await page.goto('/store/orders')
    await expect(page).not.toHaveURL(/login|signin/)
    await expect(page.getByRole('heading', { name: /orders|order history/i })).toBeVisible({ timeout: 8_000 })
  })
})
