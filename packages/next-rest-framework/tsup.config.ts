import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/constants.ts',
    'src/client/index.ts',
    'src/cli/index.ts'
  ],
  bundle: true,
  format: ['cjs', 'esm'],
  external: ['zod'],
  platform: 'node'
});
