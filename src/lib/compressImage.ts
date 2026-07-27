const MAX_DIMENSION = 1600
const QUALITY = 0.75

// Downscale + re-encode client-side before upload - keeps uploads small for
// travellers on poor connections. See "Offline" / photo handling in docs/08-mvp.md.
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/webp', QUALITY)
  })
}
