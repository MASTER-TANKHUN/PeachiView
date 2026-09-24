// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// On Vercel the production domain is exposed at build time; locally we fall back to the dev server.
const site = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:4321';

export default defineConfig({
  site,
  adapter: vercel(),
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
