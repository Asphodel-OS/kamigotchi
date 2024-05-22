import dsv from '@rollup/plugin-dsv';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dsv(), react()],
  assetsInclude: ['**/*.gif', '**/*.jpg', '**/*.mp3', '**/*.png', '**/*.wav'],
  build: {
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      abi: path.resolve(__dirname, './abi'),
      src: path.resolve(__dirname, './src'),
      types: path.resolve(__dirname, './types'),
      assets: path.resolve(__dirname, './src/assets'),
      constants: path.resolve(__dirname, './src/constants'),
      layers: path.resolve(__dirname, './src/layers'),
      utils: path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    headers: {
      'Strict-Transport-Security': 'max-age=86400; includeSubDomains', // Adds HSTS options, with a expiry time of 1 day
      'X-Content-Type-Options': 'nosniff', // Protects from improper scripts runnings
      'X-Frame-Options': 'DENY', // Stops site being used as an iframe
      'X-XSS-Protection': '1; mode=block', // Gives XSS protection to legacy browsers
    },
  },
});
