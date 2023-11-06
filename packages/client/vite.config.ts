import dsv from '@rollup/plugin-dsv';
import inject from '@rollup/plugin-inject';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dsv({ include: ['**/*.csv'] }), react()],
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
    rollupOptions: {
      plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
    },
  },
});
