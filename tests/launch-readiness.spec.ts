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

test('direct region links keep the map behind the consistent overlay', async ({ page }) => {
  await page.route('**/rest/v1/regions**', (route) => route.fulfill({ json: [{
    id: '55555555-5555-4555-8555-555555555555', slug: 'ladakh', name: 'Ladakh', state: 'Ladakh',
    description: null, featured: true, center_lat: 34.15, center_lng: 77.58, default_zoom: 7,
  }] }))
  await page.route('**/rest/v1/places**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/villages**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/repo_stats**', (route) => route.fulfill({ json: [] }))
  await blockExternalMapTraffic(page)

  await page.goto('/region/ladakh')
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ladakh', exact: true })).toBeVisible()
  await page.getByTitle('Close').click()
  await expect(page).toHaveURL('/')
})

test('Spiti pack persists and renders its saved places without network', async ({ page, context }, testInfo) => {
  let serverRevision = 1
  const region = {
    id: '11111111-1111-4111-8111-111111111111', slug: 'spiti', name: 'Spiti', state: 'Himachal Pradesh',
    description: 'High-altitude valley', featured: true, center_lat: 32.246, center_lng: 78.034, default_zoom: 8,
    offline_revision: serverRevision,
  }
  const place = {
    id: '22222222-2222-4222-8222-222222222222', name: 'Test Spiti Homestay', category: 'homestay',
    lat: 32.246, lng: 78.034, village_id: null, region_id: region.id, trek_id: null,
    description: 'Offline test place', phone: null, whatsapp: null, price_range: null,
    attributes: { host_name: 'Tashi' }, added_by: null, last_edited_by: null,
    last_verified_at: null, verified_count: 0, created_at: '2026-08-17T00:00:00Z', updated_at: '2026-08-17T00:00:00Z',
  }
  const photos = [
    {
      id: '33333333-3333-4333-8333-333333333333', place_id: place.id, storage_path: 'spiti/first.png',
      caption: null, credit: null, uploaded_by: null, created_at: '2026-08-17T00:00:00Z',
    },
    {
      id: '44444444-4444-4444-8444-444444444444', place_id: place.id, storage_path: 'spiti/second.png',
      caption: null, credit: null, uploaded_by: null, created_at: '2026-08-17T00:00:01Z',
    },
  ]

  await page.route('**/rest/v1/regions**', async (route) => {
    const currentRegion = { ...region, offline_revision: serverRevision }
    const isSingle = route.request().url().includes('slug=eq.spiti')
    await route.fulfill({ json: isSingle ? currentRegion : [currentRegion] })
  })
  await page.route('**/rest/v1/places**', (route) => route.fulfill({ json: [{ ...place, place_photos: photos }] }))
  await page.route('**/rest/v1/place_photos**', (route) => route.fulfill({ json: photos }))
  await page.route('**/storage/v1/object/public/place-photos/**', (route) => route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+XQebWQAAAABJRU5ErkJggg==', 'base64'),
  }))
  await page.route('**/rest/v1/community_notes**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/villages**', (route) => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/repo_stats**', (route) => route.fulfill({ json: [] }))
  await blockExternalMapTraffic(page)

  await page.goto('/')
  await page.getByTitle('Offline maps').click()
  await expect(page.getByRole('heading', { name: 'Offline maps' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ladakh.*Download/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Zanskar.*Download/ })).toBeVisible()
  await page.getByRole('button', { name: /Spiti.*Download/ }).click()
  await expect(page.getByRole('heading', { name: 'Spiti', exact: true })).toBeVisible()
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Download Spiti' }).click()
  await expect(page.getByText('Ready for the road', { exact: false })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText('Place guide').locator('..')).toContainText('1')

  serverRevision = 2
  await page.getByRole('button', { name: 'Open map' }).click()
  await expect(page).toHaveURL(/offline=spiti/)
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await page.getByTitle('Offline maps').click()
  await expect(page.getByRole('button', { name: /Spiti.*Update available/ })).toBeVisible()
  await page.getByTitle('Close').click()
  await context.setOffline(true)
  const marker = page.locator('.maplibregl-marker')
  await expect(marker).toHaveCount(1, { timeout: 20_000 })
  if (testInfo.project.name === 'desktop') await marker.hover()
  else await marker.click()
  const popup = page.locator('.maplibregl-popup-content')
  await expect(popup.getByText('Test Spiti Homestay')).toBeVisible()
  await expect(popup.locator('img')).toHaveCount(1)
  await expect(popup.getByRole('button', { name: 'More details' })).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
})
