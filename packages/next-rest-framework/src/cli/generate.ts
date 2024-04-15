import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as prettier from 'prettier';
import { findConfig, generateOpenApiSpec } from './utils';
import { isEqualWith } from 'lodash';

const writeOpenApiSpec = async ({
  path,
  spec
}: {
  path: string;
  spec: Record<string, unknown>;
}) => {
  try {
    if (!existsSync(join(process.cwd(), 'public'))) {
      console.info(
        chalk.redBright(
          'The `public` folder was not found. Generating OpenAPI spec aborted.'
        )
      );

      return;
    }

    const jsonSpec = await prettier.format(JSON.stringify(spec), {
      parser: 'json'
    });

    writeFileSync(path, jsonSpec, null);
    console.info(chalk.green('OpenAPI spec generated successfully!'));
  } catch (e) {
    console.error(chalk.red(`Error while generating the API spec: ${e}`));
  }
};

// Regenerate the OpenAPI spec if it has changed.
export const generate = async ({ configPath }: { configPath?: string }) => {
  const config = await findConfig({ configPath });

  if (!config) {
    return;
  }

  const spec = await generateOpenApiSpec({ config });
  const path = join(process.cwd(), 'public', config.openApiJsonPath);

  try {
    const data = readFileSync(path);
    const openApiSpec = JSON.parse(data.toString());

    if (!isEqualWith(openApiSpec, spec)) {
      console.info(
        chalk.yellowBright(
          'OpenAPI spec changed, regenerating `openapi.json`...'
        )
      );

      await writeOpenApiSpec({ path, spec });
    } else {
      console.info(
        chalk.green('OpenAPI spec up to date, skipping generation.')
      );
    }
  } catch {
    console.info(
      chalk.yellowBright('No OpenAPI spec found, generating `openapi.json`...')
    );

    await writeOpenApiSpec({ path, spec });
  }
};
