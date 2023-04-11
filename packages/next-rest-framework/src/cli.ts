#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

import waitOn from 'wait-on';
import { spawn } from 'child_process';

const program = new Command();

program
  .command('generate')
  .option(
    '--port <string>',
    'The port in which you want to run your Next.js server during the generation. Defaults to 3000.'
  )
  .option(
    '--path <string>',
    'Path to the API endpoint that triggers the OpenAPI generation. Defaults to `/api`.'
  )
  .option(
    '--timeout <string>',
    'The timeout for waiting on the Next.js server to start. Defaults to 10000ms.'
  )
  .description(
    'Run the OpenAPI generation from your Next REST Framework client.'
  )
  .action(async (_, options) => {
    const port = options.port ?? '3000';
    const path = options.path ?? '/api';
    const timeout = options.timeout ?? '10000';

    const server = spawn('npx', ['next', 'dev', '-p', port], {
      stdio: 'inherit'
    });

    try {
      await waitOn({ resources: [`http://localhost:${port}${path}`], timeout });
      server.kill();
    } catch (e) {
      console.error(chalk.red(`Error while generating the API spec: ${e}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
