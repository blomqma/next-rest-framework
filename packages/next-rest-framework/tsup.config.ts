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
  // zod must NOT be bundled. It is only a devDependency here, so without this tsup inlines
  // a snapshot of it into dist -- and then `getJsonSchema` calls *that* copy's toJSONSchema
  // on schemas built by the consumer's own zod. Constraints live in the internal `_zod.bag`
  // (populated at construction time by the consumer's zod, via each check's `onattach`), and
  // that internal layout shifts between zod minor versions. When the two copies disagree,
  // every check is silently dropped: `z.number().min(0.5).max(2)` emits as a bare
  // `{"type":"number"}`, `z.string().min(1).max(10000)` loses minLength/maxLength, and even
  // `.int()` stops producing `"type":"integer"`. Only `type`/`default`/`enum` -- which are read
  // from `def` rather than `bag` -- survive, so the spec looks plausible while being wrong.
  //
  // The same mismatch breaks `isZodObjectSchema`, which is an `instanceof ZodObject` against
  // the bundled class and is therefore always false for consumer schemas -- so
  // `registerDescriptions` never recurses and nested `.describe()` text goes missing too.
  //
  // Externalizing it makes `generate` use the consumer's zod, which is the only copy that can
  // read its own internals. `zod-form-data` is a type-only import; it is listed for symmetry.
  external: ['zod', 'zod-form-data'],
  esbuildPlugins: [uaParserDirnamePlugin()],
  format: ['cjs', 'esm'],
  platform: 'node'
});
