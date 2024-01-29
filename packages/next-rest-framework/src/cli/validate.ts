import { join } from 'path';
import { findConfig, generateOpenApiSpec } from './utils';
import { readFileSync } from 'fs';
import { isEqualWith } from 'lodash';
import chalk from 'chalk';

// Check if the OpenAPI spec is up-to-date.
export const validateOpenApiSpecFromBuild = async ({
  configPath
}: {
  configPath?: string;
}) => {
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
      console.error(
        chalk.red(
          'API spec changed is not up-to-date. Run `next-rest-framework generate` to update it.'
        )
      );
    } else {
      console.info(chalk.green('OpenAPI spec up to date!'));
      return true;
    }
  } catch {
    console.error(
      chalk.red(
        'No OpenAPI spec found. Run `next-rest-framework generate` to generate it.'
      )
    );
  }

  return false;
};
