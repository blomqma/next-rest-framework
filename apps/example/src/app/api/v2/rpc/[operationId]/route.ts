import { createTodo, deleteTodo, getTodoById, getTodos } from 'actions';
import { rpcRoute } from 'next-rest-framework';

const { POST, client } = rpcRoute({
  getTodos,
  getTodoById,
  createTodo,
  deleteTodo
});

export type RpcClient = typeof client;

export { POST };
