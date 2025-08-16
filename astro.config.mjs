import { defineConfig } from 'astro/config';

export default defineConfig({
  server: { host: true, port: 4321 },
  vite: {
    server: {
      hmr: { protocol: 'ws', host: 'localhost', clientPort: 4321 },
      proxy: { '/api': 'http://localhost:3001' }
    }
  }
});
