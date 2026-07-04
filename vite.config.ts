import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths so the built site works at a domain root OR a subfolder.
  base: './',
  plugins: [react()],
  server: {
    port: 5178,
    strictPort: false,
  },
})
