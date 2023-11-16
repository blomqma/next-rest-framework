import { rpcApiRouteHandler } from 'next-rest-framework';

// Example Pages Router RPC handler.
const handler = rpcApiRouteHandler({
  // ...
  // Exactly the same as the App Router example.
});

export default handler;

export type RpcApiRouteClient = typeof handler.client;
