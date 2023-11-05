import { type ZodSchema, type z } from 'zod';
import { type OperationDefinition } from '../shared';

export type Client<T extends Record<string, OperationDefinition<any, any>>> = {
  [key in keyof T]: T[key];
};

const fetcher = async <Input>(
  body: z.infer<ZodSchema<Input>>,
  options: { url: string; operationId: string }
) => {
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RPC-Operation': options.operationId
    }
  };

  const res = await fetch(
    options.url,
    body ? { ...opts, body: JSON.stringify(body) } : opts
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message);
  }

  return await res.json();
};

export const rpcClient = <
  T extends Record<string, OperationDefinition<any, any>>
>({
  url
}: {
  url: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return new Proxy({} as Client<T>, {
    get: (_, prop) => {
      if (typeof prop === 'string') {
        return async (body?: z.infer<ZodSchema<any>>) => {
          return await fetcher(body, { url, operationId: prop });
        };
      }
    }
  });
};
