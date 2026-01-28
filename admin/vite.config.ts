import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      "admin.openrun.app",
      "dev-admin.openrun.app",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "date-vendor": ["date-fns"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
