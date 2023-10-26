import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import liveReload from 'vite-plugin-live-reload'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    liveReload([
      // using this for our teamup:
      __dirname + '../../*.php',
    ]),
    splitVendorChunkPlugin(),
  ],
  base: process.env.APP_ENV === 'development'
  ? '/local/teamup/frontend/'
  : '/local/teamup/frontend/dist',
  build: {
    //outDir: '../',
    // emit manifest so PHP can find the hashed files
    manifest: true,
    assetsInlineLimit: '0',
  },
  server: {
    // we need a strict port to match on PHP side
    // change freely, but update on PHP to match the same port
    // tip: choose a different port per project to run them at the same time
    strictPort: true,
    port: 5133,
    origin: 'http://127.0.0.1:5133',
  },
  resolve: {
    alias: {
      src: "/src",
    },
  },
})
