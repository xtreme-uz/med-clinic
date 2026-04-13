import { test, expect, chromium } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// Verifies dist/index.html (the asset Electron loads) works under file://
// — relative asset paths and HashRouter must both be correct. Electron's
// production window sets webSecurity:false to allow ESM under file://, so we
// match that flag here to mimic the runtime.
test('packaged build loads under file://', async () => {
  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security'],
  })
  const context = await browser.newContext()
  const page = await context.newPage()
  const fileUrl = pathToFileURL(resolve('dist/index.html')).toString()
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
  page.on('requestfailed', (r) =>
    console.log('REQFAIL:', r.url(), r.failure()?.errorText),
  )
  await page.goto(fileUrl)
  // HashRouter should redirect unauthenticated users to /#/login
  await expect(page).toHaveURL(/#\/login$/)
  await expect(page.getByRole('heading', { name: /klinika booking/i })).toBeVisible()

  // Login should work — Supabase URL is baked into the bundle
  await page.getByLabel(/email/i).fill('registrar@clinic.local')
  await page.getByLabel(/parol/i).fill('password123')
  await page.getByRole('button', { name: /kirish/i }).click()
  await expect(page).toHaveURL(/#\/$/)
  await browser.close()
})
