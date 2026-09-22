import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    cors: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-maskable.svg', 'icon-192.png', 'badge-96.png'],
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'FitForge',
        short_name: 'FitForge',
        description: 'Bilingual fitness & health tracking, workouts, nutrition and AI coaching.',
        theme_color: '#0b0d12',
        background_color: '#0b0d12',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          // Android's install/splash-screen icon runs "any" icons through its
          // own adaptive-icon mask too, cropping content near the edges (the
          // dumbbell's outer bars) down to a blank-looking swatch. A dedicated
          // maskable icon with the artwork scaled into the safe zone fixes that.
          { src: 'favicon-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The AI form-check page lazy-loads TensorFlow.js + pose-detection
        // (~1.5MB) on demand — don't force that download on every install.
        globIgnores: ['**/pose-detection*.js', '**/tfjs*.js', '**/dist-*.js', '**/shared-*.js'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // See src/lib/mediapipe-pose-stub.ts for why this is stubbed out.
      '@mediapipe/pose': fileURLToPath(new URL('./src/lib/mediapipe-pose-stub.ts', import.meta.url)),
    },
  },
})
