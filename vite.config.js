import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "Suntech Pakistan — Inventory",
        short_name: "Suntech Inv",
        description: "Inventory & Sales Management by Suntech Pakistan",
        theme_color: "#0f172a",
        background_color: "#020617",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Cache static assets; always go to network for API
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api") || url.href.includes("/api"),
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: {
        enabled: false, // PWA only in production build
      },
    }),
  ],
  server: { port: 5173 },
});
