import dsv from '@rollup/plugin-dsv';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dsv(), react()],
  assetsInclude: ['**/*.gif', '**/*.jpg', '**/*.mp3', '**/*.png', '**/*.wav'],
  resolve: {
    alias: {
      abi: path.resolve(__dirname, './abi'),
      assets: path.resolve(__dirname, './src/assets'),
      constants: path.resolve(__dirname, './src/constants'),
      layers: path.resolve(__dirname, './src/layers'),
      utils: path.resolve(__dirname, './src/utils'),
      src: path.resolve(__dirname, './src'),
      types: path.resolve(__dirname, './types'),
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
});
