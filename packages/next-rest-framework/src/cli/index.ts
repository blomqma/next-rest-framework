#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { clearTmpFolder, compileEndpoints } from './utils';
import { validateOpenApiSpecFromBuild } from './validate';
import { syncOpenApiSpecFromBuild } from './generate';

const program = new Command();

program
  .command('generate')
  .option(
    '--configPath <string>',
    'In case you have multiple docs handlers with different configurations, you can specify which configuration you want to use by providing the path to the API. Example: `/api/my-configuration`.'
  )
  .description('Generate an OpenAPI spec with Next REST Framework.')
  .action(async (options) => {
    const configPath: string = options.configPath ?? '';

    try {
      await compileEndpoints();
      console.info(chalk.yellowBright('Generating OpenAPI spec...'));

      await syncOpenApiSpecFromBuild({
        configPath
      });
    } catch (e) {
      console.error(e);
      process.exit(1);
    }

    await clearTmpFolder();
  });

program
  .command('validate')
  .option(
    '--configPath <string>',
    'In case you have multiple docs handlers with different configurations, you can specify which configuration you want to use by providing the path to the API. Example: `/api/my-configuration`.'
  )
  .description('Validate an OpenAPI spec with Next REST Framework.')
  .action(async (options) => {
    const configPath: string = options.configPath ?? '';

    try {
      await compileEndpoints();
      console.info(chalk.yellowBright('Validating OpenAPI spec...'));

      const valid = await validateOpenApiSpecFromBuild({
        configPath
      });

      if (!valid) {
        process.exit(1);
      }
    } catch (e) {
      console.error(e);
      process.exit(1);
    }

    await clearTmpFolder();
  });

program.parse(process.argv);
