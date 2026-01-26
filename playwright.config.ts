import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:1313',
    screenshot: 'only-on-failure',
  },
  reporter: 'list',
});
