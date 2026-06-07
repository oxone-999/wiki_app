import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API + static photos to the Express backend in dev.
      '/api': 'http://localhost:5000',
      '/photos': 'http://localhost:5000',
    },
  },
});
