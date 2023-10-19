import chalk from 'chalk';

export const logNextRestFrameworkError = (error: unknown) => {
  console.error(
    chalk.red(`Next REST Framework encountered an error:
${error}`)
  );
};
