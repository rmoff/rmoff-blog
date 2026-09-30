import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    // Specs that use relative URLs (e.g. search*.spec.ts) honour BASE_URL, so they
    // can run against a full build (with Pagefind) served on another port.
    baseURL: process.env.BASE_URL || 'http://localhost:1313',
    screenshot: 'only-on-failure',
  },
  reporter: 'list',
});
