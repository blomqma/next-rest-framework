import { type Plugin } from 'esbuild';
import { defineConfig } from 'tsup';
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
    'src/cli/index.ts',
    'src/cli/generate.ts',
    'src/cli/validate.ts'
  ],
  bundle: true,
  // `zod` and `zod-form-data` are externalised so that schemas constructed by
  // the consumer's installed `zod` share the same realm as the `toJSONSchema`
  // call inside this package. Bundling them caused cross-realm bugs where
  // `_zod.bag` was unreadable across versions (see #222).
  external: ['zod', 'zod-form-data'],
  esbuildPlugins: [uaParserDirnamePlugin()],
  format: ['cjs', 'esm'],
  platform: 'node'
});
