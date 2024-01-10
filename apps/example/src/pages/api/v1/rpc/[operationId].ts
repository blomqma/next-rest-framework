import { createTodo, deleteTodo, getTodoById, getTodos } from '@/actions';
import { rpcApiRoute } from 'next-rest-framework';

const handler = rpcApiRoute({
  getTodos,
  getTodoById,
  createTodo,
  deleteTodo
});

export type RpcClient = typeof handler.client;

export default handler;
