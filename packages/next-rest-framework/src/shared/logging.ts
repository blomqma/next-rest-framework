import chalk from 'chalk';

export const logPagesEdgeRuntimeErrorForRoute = (route: string) => {
  console.error(
    chalk.red(`---
${route} is using Edge runtime in \`/pages\` folder that is not supported with \`apiRoute\`.
Please use \`route\` instead: https://vercel.com/docs/functions/edge-functions/quickstart
---`)
  );
};

export const logPagesEdgeRuntimeErrorForDocsRoute = (route: string) => {
  console.error(
    chalk.red(`---
${route} is using Edge runtime in \`/pages\` folder that is not supported with \`docsApiRoute\`.
Please use \`docsRoute\` instead: https://vercel.com/docs/functions/edge-functions/quickstart
---`)
  );
};

export const logNextRestFrameworkError = (error: unknown) => {
  console.error(
    chalk.red(`Next REST Framework encountered an error:
${error}`)
  );
};

export const logGenerateErrorForRoute = (path: string, error: unknown) => {
  console.info(
    chalk.yellow(`---
Error while importing ${path}, skipping path...`)
  );

  console.error(chalk.red(error));

  console.info(
    chalk.yellow(
      `If you don't want this path to be part of your generated OpenAPI spec and want to prevent seeing this error in the future, please add ${path} to 'deniedPaths'.`
    )
  );
};
