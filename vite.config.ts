import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    proxy: {
      '/api/semaphore/messages': {
        target: 'https://api.semaphore.co',
        changeOrigin: true,
        rewrite: () => '/api/v4/messages',
      },
    },
  },
})