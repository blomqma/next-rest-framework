import { defineConfig } from 'tsup';
import { type Plugin } from 'esbuild';
import { readFileSync } from 'fs';

// A Next.js dependency (ua-parser-js) uses __dirname, which is not supported in Edge environment.
const uaParserDirnamePlugin = (): Plugin => {
  return {
    name: 'dirname-plugin',
    setup(build) {
      build.onLoad({ filter: /\/ua-parser-js\// }, async (args) => {
        let contents = readFileSync(args.path, 'utf8');
        contents = contents.replace(/__dirname/g, '');

        return {
          contents,
          loader: 'js'
        };
      });
    }
  };
};

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/constants.ts',
    'src/client/index.ts',
    'src/cli/index.ts'
  ],
  format: ['cjs', 'esm'],
  esbuildPlugins: [uaParserDirnamePlugin()],
  external: ['esbuild', 'tiny-glob', 'prettier', 'commander'],
  platform: 'node'
});
