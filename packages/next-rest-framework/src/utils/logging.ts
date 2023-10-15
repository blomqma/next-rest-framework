import chalk from 'chalk';
import { isEqualWith } from 'lodash';
import { type NextRestFrameworkConfig } from '../types';

export const logInitInfo = ({
  config,
  baseUrl,
  url
}: {
  config: NextRestFrameworkConfig;
  baseUrl: string;
  url: string;
}) => {
  const configsEqual = isEqualWith(global.nextRestFrameworkConfig, config);

  const logReservedPaths = () => {
    console.info(
      chalk.yellowBright(`Docs: ${url}
OpenAPI JSON: ${baseUrl}${config.openApiJsonPath}`)
    );
  };

  if (!global.nextRestFrameworkConfig) {
    global.nextRestFrameworkConfig = config;
    console.info(chalk.green('Next REST Framework initialized! 🚀'));
    logReservedPaths();
  } else if (!configsEqual) {
    console.info(
      chalk.green('Next REST Framework config changed, re-initializing!')
    );

    global.nextRestFrameworkConfig = config;
    logReservedPaths();
  }
};

export const logNextRestFrameworkError = (error: unknown) => {
  console.error(
    chalk.red(`Next REST Framework encountered an error:
${error}`)
  );
};
