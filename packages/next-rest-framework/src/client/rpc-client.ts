import { type RpcOperationDefinition } from '../shared';

type RpcRequestInit = Omit<RequestInit, 'method' | 'body'>;

export type RpcClient<
  T extends Record<string, RpcOperationDefinition<any, any, any, any>>
> = {
  [key in keyof T]: T[key] & { _meta: never };
};

const fetcher = async ({
  url,
  body,
  init
}: {
  url: string;
  body?: unknown;
  init?: RpcRequestInit;
}) => {
  const opts: RequestInit = {
    ...init,
    method: 'POST',
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error);
  }

  return await res.json();
};

export const rpcClient = <
  T extends Record<string, RpcOperationDefinition<any, any, any, any>>
>({
  url: _url,
  init
}: {
  url: string;
  init?: RpcRequestInit;
}) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return new Proxy({} as RpcClient<T>, {
    get: (_, prop) => {
      if (typeof prop === 'string') {
        return async (body?: unknown) => {
          const baseUrl = _url.endsWith('/') ? _url : `${_url}/`;
          const url = `${baseUrl}${prop}`;
          return await fetcher({ url, body, init });
        };
      }
    }
  });
};
