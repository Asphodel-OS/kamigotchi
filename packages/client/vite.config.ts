import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import dsv from '@rollup/plugin-dsv'

import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dsv(),
  ],
  resolve: {
    alias: {
      'abi': path.resolve(__dirname, './abi'),
      'assets': path.resolve(__dirname, './src/assets'),
      'constants': path.resolve(__dirname, './src/constants'),
      'layers': path.resolve(__dirname, './src/layers'),
      'utils': path.resolve(__dirname, './src/utils'),
      'src': path.resolve(__dirname, './src'),
      'types': path.resolve(__dirname, './types'),
    },
  },
})
