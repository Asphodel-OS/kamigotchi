import type { UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig as UserConfig,
  defineConfig({
    test: {
      environment: 'node',
      setupFiles: ['./src/test/setup.ts'],
    },
  })
);
