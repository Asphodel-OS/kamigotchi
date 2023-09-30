import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import dsv from '@rollup/plugin-dsv'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import EnvironmentPlugin from 'vite-plugin-environment'

export default defineConfig({
  plugins: [
    cssInjectedByJsPlugin(),
    dsv(),
    react(),
    tsconfigPaths(),
    EnvironmentPlugin(
      // ['MODE']
      { MODE: 'DEV' }
    ),
  ],
  root: "src",
  server: {
    port: 3000,
    fs: {
      strict: false,
    },
  },
  preview: {
    port: 3000,
  },

})