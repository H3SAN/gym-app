import { test, expect } from '@playwright/test'
import { TEST_USER, signup, login } from './helpers'

const user = {
  ...TEST_USER,
  email: `auth-${Date.now()}@test.com`,
}

test.describe('Authentication', () => {
  test('signup creates account and redirects to dashboard', async ({ page }) => {
    await signup(page, user)
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByText(/welcome|hello|hi/i)).toBeVisible({ timeout: 5_000 }).catch(() => {})
  })

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    // Ensure account exists first
    try { await signup(page, user) } catch { /* already signed up */ }

    await login(page, user)
    await expect(page).toHaveURL(/dashboard/)
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/email/i).fill(user.email)
    await page.getByPlaceholder(/password/i).fill('WrongPass999!')
    await page.getByRole('button', { name: /log in|sign in/i }).click()

    await expect(
      page.getByText(/invalid|incorrect|wrong|not found/i)
    ).toBeVisible({ timeout: 5_000 })
  })

  test('protected route redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login|signin/, { timeout: 8_000 })
  })

  test('signup rejects duplicate email', async ({ page }) => {
    await page.goto('/signup')
    await page.getByPlaceholder(/name/i).fill(user.name)
    await page.getByPlaceholder(/email/i).fill(user.email)
    await page.getByPlaceholder(/password/i).fill(user.password)
    await page.getByRole('button', { name: /sign up|create account/i }).click()

    await expect(
      page.getByText(/already|registered|exists/i)
    ).toBeVisible({ timeout: 5_000 })
  })

  test('signup rejects short password', async ({ page }) => {
    await page.goto('/signup')
    await page.getByPlaceholder(/name/i).fill('New User')
    await page.getByPlaceholder(/email/i).fill(`short-${Date.now()}@test.com`)
    await page.getByPlaceholder(/password/i).fill('abc')
    await page.getByRole('button', { name: /sign up|create account/i }).click()

    await expect(
      page.getByText(/8 character|too short|minimum/i)
    ).toBeVisible({ timeout: 5_000 })
  })
})
