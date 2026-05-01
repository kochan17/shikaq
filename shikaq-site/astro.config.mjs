// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/schema
export default defineConfig({
  site: 'https://shikaq.app',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [sitemap()]
});