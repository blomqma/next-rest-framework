#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { generate } from './generate';
import { validate } from './validate';

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
      console.info(chalk.yellowBright('Generating OpenAPI spec...'));

      await generate({
        configPath
      });
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
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
      console.info(chalk.yellowBright('Validating OpenAPI spec...'));

      const valid = await validate({
        configPath
      });

      if (!valid) {
        process.exit(1);
      }
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

program.parse(process.argv);
