import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import liveReload from 'vite-plugin-live-reload'
import { VitePWA } from "vite-plugin-pwa";

const manifestForPlugin = {
	registerType: "prompt",
	includeAssets: ["favicon.png", "logo.svg"],
	manifest: {
		name: "Teamup",
		short_name: "Teamup",
		description: "Sports management.",
    // Generated assets and the following code via npx pwx-asset-generator command in npm run build"
    icons: [
      {
        "src": "assets/pwa/manifest-icon-192.maskable.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "assets/pwa/manifest-icon-192.maskable.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "maskable"
      },
      {
        "src": "assets/pwa/manifest-icon-512.maskable.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "assets/pwa/manifest-icon-512.maskable.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
		theme_color: "#0F172A",
		background_color: "#f1f5f9",
		display: "standalone",
		scope: "/local/teamup/",
		start_url: "/local/teamup/",
		orientation: "portrait",
	},
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    liveReload([
      // using this for our teamup:
      __dirname + '../../*.php',
    ]),
    splitVendorChunkPlugin(),
    VitePWA(manifestForPlugin), // PWA
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
