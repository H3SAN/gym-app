import { Page } from '@playwright/test'

export const TEST_USER = {
  name: 'E2E Test User',
  email: `e2e-${Date.now()}@test.com`,
  password: 'TestPass123!',
}

export async function signup(page: Page, user = TEST_USER) {
  await page.goto('/signup')
  await page.getByPlaceholder(/name/i).fill(user.name)
  await page.getByPlaceholder(/email/i).fill(user.email)
  await page.getByPlaceholder(/password/i).fill(user.password)
  await page.getByRole('button', { name: /sign up|create account/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

export async function login(page: Page, user = TEST_USER) {
  await page.goto('/login')
  await page.getByPlaceholder(/email/i).fill(user.email)
  await page.getByPlaceholder(/password/i).fill(user.password)
  await page.getByRole('button', { name: /log in|sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

export async function logout(page: Page) {
  await page.goto('/profile')
  const logoutBtn = page.getByRole('button', { name: /log out|sign out/i })
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click()
  }
}
