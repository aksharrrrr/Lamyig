import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Map tiles/geocoding/Supabase all need a live network connection
      // (see D-005/D-014) - this is app-shell caching for fast reloads and
      // installability, not the offline-map effort, which is a separate,
      // much larger, still-unbuilt feature.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      manifest: {
        name: 'Lamyig: the open road-book for remote India',
        short_name: 'Lamyig',
        description: 'A community-maintained travel knowledge base for remote India, starting with the Himalaya.',
        start_url: '/',
        display: 'standalone',
        background_color: '#e9e7e2',
        theme_color: '#B39F85',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-192x192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
