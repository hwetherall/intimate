import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure environment variables are processed correctly
  envPrefix: 'VITE_',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    open: true,
    // Include more specific error messages in development
    hmr: {
      overlay: true,
    },
  },
})
