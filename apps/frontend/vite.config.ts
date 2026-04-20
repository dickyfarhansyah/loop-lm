import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const BACKEND_URL = process.env.VITE_API_URL || "http://localhost:8080"

const proxyConfig = {
  "/api": {
    target: BACKEND_URL,
    changeOrigin: true,
  },
  "/socket.io": {
    target: BACKEND_URL,
    changeOrigin: true,
    ws: true,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: proxyConfig,
  },
  preview: {
    proxy: proxyConfig,
  },
})