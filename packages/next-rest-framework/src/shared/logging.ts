import chalk from 'chalk';

export interface NextRestFrameworkErrorLogContext {
  method?: string;
  operationId?: string;
  route?: string;
  url?: string;
}

const formatValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatError = (error: unknown, depth = 0): string => {
  const lines: string[] = [];

  if (error instanceof Error) {
    lines.push(error.stack ?? `${error.name}: ${error.message}`);

    const props = Object.fromEntries(
      Object.entries(error).filter(([key]) => key !== 'cause')
    );

    if (Object.keys(props).length > 0) {
      lines.push(`properties: ${formatValue(props)}`);
    }

    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause !== undefined && depth < 3) {
      lines.push(`cause:\n${formatError(cause, depth + 1)}`);
    }
  } else {
    lines.push(formatValue(error));
  }

  return lines.join('\n');
};

const formatContext = (context?: NextRestFrameworkErrorLogContext) => {
  if (!context) {
    return '';
  }

  const entries = Object.entries(context).filter(
    ([, value]) => value !== undefined && value !== ''
  );

  if (entries.length === 0) {
    return '';
  }

  return `${entries.map(([key, value]) => `${key}: ${value}`).join('\n')}\n`;
};

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

/**
 * A hook for reporting server-side errors somewhere other than the console.
 *
 * Why this exists: `route`, `apiRoute`, `rpcRoute` and the docs routes wrap every handler
 * in a try/catch and answer with a generic 500. That is the right thing to send a client,
 * but it also means the error never propagates out of the handler — so a host framework's
 * error hook (Next's `onRequestError`, for one) never sees it, and an application has no
 * place at all to persist the error, count it, or forward it to an APM. All that was left
 * was `console.error`, which on a serverless/edge host means "attach a log tail and hope
 * you were watching".
 *
 * The reporter receives the original error, untouched, plus whatever context the framework
 * knows (method, operationId, url/route). What the client gets back does not change.
 */
export type NextRestFrameworkErrorReporter = (
  error: unknown,
  context?: NextRestFrameworkErrorLogContext
) => void | Promise<void>;

let errorReporter: NextRestFrameworkErrorReporter | undefined;

/**
 * Register (or, with no argument, clear) the error reporter described above. Call it once
 * while the server starts up — Next's `instrumentation.ts` `register()` is the natural
 * place. Registering twice replaces the previous reporter: there is deliberately only one,
 * so that "where do server errors go" has a single answer per process.
 */
export const setErrorReporter = (
  reporter?: NextRestFrameworkErrorReporter
) => {
  errorReporter = reporter;
};

export const logNextRestFrameworkError = async (
  error: unknown,
  context?: NextRestFrameworkErrorLogContext
) => {
  // Console first, and never conditionally: it is the one channel that cannot itself fail,
  // so the error is on the record before we hand it to anything that might.
  console.error(
    chalk.red(`Next REST Framework encountered an error:
${formatContext(context)}${formatError(error)}`)
  );

  if (!errorReporter) {
    return;
  }

  // Awaited rather than fired and forgotten: on serverless/edge hosts, work that outlives
  // the response is liable to be cancelled, and a reporter that persists the error is
  // exactly the kind of work that must not be. The cost is paid only on responses that
  // were already failing.
  try {
    await errorReporter(error, context);
  } catch (reportingError) {
    // A reporter that throws must not replace the error it was handed.
    console.error(
      chalk.red(`Next REST Framework error reporter threw:
${formatError(reportingError)}`)
    );
  }
};

export const logNextRestFrameworkResponse = async (
  response: Response,
  context?: NextRestFrameworkErrorLogContext
) => {
  if (response.status < 500) {
    return;
  }

  let body: unknown;
  try {
    const text = await response.clone().text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
  } catch (error) {
    body = `Failed to read response body: ${formatError(error)}`;
  }

  console.error(
    chalk.red(`Next REST Framework returned an error response:
${formatContext(context)}status: ${response.status}
body: ${formatValue(body)}`)
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
