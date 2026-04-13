import { test, expect } from '@playwright/test'

test.describe('smoke', () => {
  test('login → dashboard → beds grid loads', async ({ page }) => {
    page.on('console', (m) => console.log('BROWSER:', m.type(), m.text()))
    page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
    page.on('requestfailed', (r) =>
      console.log('REQFAIL:', r.url(), r.failure()?.errorText),
    )
    page.on('response', (r) => {
      if (r.url().includes('54321')) console.log('SUPABASE:', r.status(), r.url())
    })
    await page.goto('/')
    // Unauthenticated → redirected to hash /login
    await expect(page).toHaveURL(/#\/login$/)

    await page.getByLabel(/email/i).fill('registrar@clinic.local')
    await page.getByLabel(/parol/i).fill('password123')
    await page.getByRole('button', { name: /kirish/i }).click()

    // Dashboard
    await expect(page).toHaveURL(/#\/$/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Beds grid
    await page.getByRole('link', { name: /karavot/i }).first().click()
    await expect(page.getByRole('heading', { name: /karavotlar/i })).toBeVisible()
    await expect(page.getByText(/Terapiya · Xona/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('patients page lists seeded patient', async ({ page }) => {
    await page.goto('/#/login')
    await page.getByLabel(/email/i).fill('registrar@clinic.local')
    await page.getByLabel(/parol/i).fill('password123')
    await page.getByRole('button', { name: /kirish/i }).click()

    await page.getByRole('link', { name: /bemor/i }).click()
    await expect(page.getByRole('heading', { name: /bemorlar/i })).toBeVisible()
    // The patient created during API smoke tests
    await expect(page.locator('text=Valiyev')).toBeVisible({ timeout: 10_000 })
  })

  test('admin sees departments management', async ({ page }) => {
    await page.goto('/#/login')
    await page.getByLabel(/email/i).fill('admin@clinic.local')
    await page.getByLabel(/parol/i).fill('password123')
    await page.getByRole('button', { name: /kirish/i }).click()

    await page.getByRole('link', { name: /bo'limlar/i }).click()
    await expect(page.getByRole('heading', { name: /bo'limlar/i })).toBeVisible()
    await expect(page.locator('text=Terapiya')).toBeVisible({ timeout: 10_000 })
  })
})
