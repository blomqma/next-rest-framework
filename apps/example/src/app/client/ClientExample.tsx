'use client';

import { type RpcClient } from 'app/api/v2/rpc/[operationId]/route';
import { rpcClient } from 'next-rest-framework/dist/client/rpc-client';
import { useEffect, useState } from 'react';
import { type Todo } from 'utils';

const client = rpcClient<RpcClient>({
  url: 'http://localhost:3000/api/v2/rpc'
});

export const ClientExample: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    client
      .getTodos()
      .then(setTodos)
      .catch(console.error)
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">RPC client example</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>Data:</p> <p>{JSON.stringify(todos)}</p>
        </>
      )}
    </div>
  );
};
