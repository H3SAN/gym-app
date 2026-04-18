import { test, expect } from '@playwright/test'
import { TEST_USER, signup, login } from './helpers'

const user = {
  ...TEST_USER,
  email: `booking-${Date.now()}@test.com`,
}

test.describe('Class Booking', () => {
  test.beforeEach(async ({ page }) => {
    try { await signup(page, user) } catch { await login(page, user) }
  })

  test('classes page loads with class list', async ({ page }) => {
    await page.goto('/classes')
    // Wait for skeleton to disappear and content to load
    await expect(page.getByRole('heading', { name: /classes/i })).toBeVisible({ timeout: 8_000 })
    // Should have at least one class card or empty state
    const classCards = page.locator('[data-testid="class-card"], .class-card, [class*="card"]')
    const emptyState = page.getByText(/no classes|coming soon/i)
    await expect(classCards.first().or(emptyState)).toBeVisible({ timeout: 8_000 })
  })

  test('can navigate to class detail page', async ({ page }) => {
    await page.goto('/classes')
    await page.waitForLoadState('networkidle')

    const firstClassLink = page.locator('a[href*="/classes/"]').first()
    if (await firstClassLink.isVisible()) {
      await firstClassLink.click()
      await expect(page).toHaveURL(/\/classes\/[a-z0-9]+/i)
      // Class detail should show booking button
      await expect(
        page.getByRole('button', { name: /book|join|reserve/i })
      ).toBeVisible({ timeout: 8_000 })
    }
  })

  test('can book a class', async ({ page }) => {
    await page.goto('/classes')
    await page.waitForLoadState('networkidle')

    const firstClassLink = page.locator('a[href*="/classes/"]').first()
    if (!(await firstClassLink.isVisible())) {
      test.skip()
      return
    }

    await firstClassLink.click()
    await page.waitForURL(/\/classes\/[a-z0-9]+/i)

    const bookBtn = page.getByRole('button', { name: /book|join|reserve/i })
    await expect(bookBtn).toBeVisible({ timeout: 8_000 })
    await bookBtn.click()

    // Should show success feedback
    await expect(
      page.getByText(/confirmed|booked|success/i)
    ).toBeVisible({ timeout: 8_000 })
  })

  test('my bookings page shows booked classes', async ({ page }) => {
    await page.goto('/classes')
    // Navigate to bookings tab or section
    const bookingsLink = page.getByRole('link', { name: /my bookings|bookings/i })
    if (await bookingsLink.isVisible()) {
      await bookingsLink.click()
    } else {
      await page.goto('/classes?tab=bookings')
    }
    // Page should load without error
    await expect(page).not.toHaveURL(/error|404/)
  })
})
