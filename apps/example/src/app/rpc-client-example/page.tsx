import { rpcClient } from 'next-rest-framework/dist/client';
import { type AppRouterRpcClient } from '../api/routes/rpc/route';

// Works both on server and client.
const client = rpcClient<AppRouterRpcClient>({
  url: 'http://localhost:3000/api/routes/rpc'
});

// Simple example - the client can be easily integrated with any data fetching framework, like React Query or RTKQ.
export default async function Page() {
  const data = await client.getTodos();
  return <>{JSON.stringify(data)}</>;
}
