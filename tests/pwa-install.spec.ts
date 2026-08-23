import { expect, test, type Page } from '@playwright/test'

async function prepareHome(page: Page) {
  await page.addInitScript(() => localStorage.setItem('lamyig:introductionSeen', '1'))
  await page.route('**/rest/v1/regions**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/places**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/villages**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/repo_stats**', (route) => route.fulfill({ json: [] }))
  await page.route(/tiles\.openfreemap\.org|fonts\.googleapis\.com|fonts\.gstatic\.com/, (route) => route.abort())
  await page.goto('/')
}

test('install suggestion is responsive, accessible, and dismissible', async ({ page }) => {
  await prepareHome(page)

  const prompt = page.getByRole('complementary', { name: 'Install Lamyig' })
  await expect(prompt).toBeVisible()
  await expect(prompt.getByRole('button', { name: 'Install app' })).toBeVisible()

  const box = await prompt.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height)

  await prompt.getByRole('button', { name: 'Dismiss install suggestion' }).click()
  await expect(prompt).not.toBeVisible()
  await page.reload()
  await expect(prompt).not.toBeVisible()
})

test('install button opens the browser-provided installer when available', async ({ page }) => {
  await prepareHome(page)

  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(event, {
      prompt: async () => { (window as typeof window & { installPromptOpened?: boolean }).installPromptOpened = true },
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    })
    window.dispatchEvent(event)
  })

  await page.getByRole('button', { name: 'Install app' }).click()
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { installPromptOpened?: boolean }
  ).installPromptOpened)).toBe(true)
  await expect(page.getByRole('complementary', { name: 'Install Lamyig' })).not.toBeVisible()
})

test('install button gives manual instructions when a native prompt is unavailable', async ({ page }) => {
  await prepareHome(page)

  await page.getByRole('button', { name: 'Install app' }).click()
  await expect(page.getByRole('status')).toContainText(/browser menu|Safari/)
})

test('app dialogs remain usable while the install suggestion is present', async ({ page }) => {
  await prepareHome(page)

  await page.getByTitle('Why Lamyig exists').click()
  await expect(page.getByRole('heading', { name: 'Welcome to Lamyig' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue Exploring' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('complementary', { name: 'Install Lamyig' })).toBeVisible()
})
