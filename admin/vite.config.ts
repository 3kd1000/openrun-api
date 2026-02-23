import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
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
          "ui-vendor": ["class-variance-authority", "clsx", "tailwind-merge", "lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
