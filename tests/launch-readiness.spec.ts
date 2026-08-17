import { expect, test, type Page } from '@playwright/test'

async function blockExternalMapTraffic(page: Page) {
  await page.route(/tiles\.openfreemap\.org|fonts\.googleapis\.com|fonts\.gstatic\.com/, (route) => route.abort())
}

test('privacy and contribution terms are directly reachable', async ({ page }) => {
  await blockExternalMapTraffic(page)
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy notice' })).toBeVisible()
  await expect(page.getByText('You can permanently delete your account from Profile')).toBeVisible()

  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: 'Contribution terms' })).toBeVisible()
  await expect(page.getByText('Open Database License 1.0')).toBeVisible()
})

test('sign-up requires age, terms, and privacy consent', async ({ page }) => {
  await blockExternalMapTraffic(page)
  await page.goto('/auth?mode=sign-up')
  const consent = page.getByRole('checkbox')
  await expect(consent).toBeVisible()
  await expect(consent).not.toBeChecked()
  await expect(page.getByRole('link', { name: 'contribution terms' })).toHaveAttribute('href', '/terms')
  await expect(page.getByRole('link', { name: 'privacy notice' })).toHaveAttribute('href', '/privacy')
})

test('Spiti pack persists and renders its saved places without network', async ({ page, context }) => {
  const region = {
    id: '11111111-1111-4111-8111-111111111111', slug: 'spiti', name: 'Spiti', state: 'Himachal Pradesh',
    description: 'High-altitude valley', featured: true, center_lat: 32.246, center_lng: 78.034, default_zoom: 8,
  }
  const place = {
    id: '22222222-2222-4222-8222-222222222222', name: 'Test Spiti Homestay', category: 'homestay',
    lat: 32.246, lng: 78.034, village_id: null, region_id: region.id, trek_id: null,
    description: 'Offline test place', phone: null, whatsapp: null, price_range: null,
    attributes: { host_name: 'Tashi' }, added_by: null, last_edited_by: null,
    last_verified_at: null, verified_count: 0, created_at: '2026-08-17T00:00:00Z', updated_at: '2026-08-17T00:00:00Z',
  }

  await page.route('**/rest/v1/regions**', async (route) => {
    const isSingle = route.request().url().includes('slug=eq.spiti')
    await route.fulfill({ json: isSingle ? region : [region] })
  })
  await page.route('**/rest/v1/places**', (route) => route.fulfill({ json: [place] }))
  await page.route('**/rest/v1/place_photos**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/community_notes**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/villages**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/repo_stats**', (route) => route.fulfill({ json: [] }))
  await blockExternalMapTraffic(page)

  await page.goto('/region/spiti')
  await page.getByRole('button', { name: 'Download Spiti' }).click()
  await expect(page.getByText('Downloaded', { exact: false })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText('Places:').locator('..')).toContainText('1')

  await context.setOffline(true)
  await page.getByRole('link', { name: 'Open map' }).click()
  await expect(page.locator('.maplibregl-marker')).toHaveCount(1, { timeout: 20_000 })
})
