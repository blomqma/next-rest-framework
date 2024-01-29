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
