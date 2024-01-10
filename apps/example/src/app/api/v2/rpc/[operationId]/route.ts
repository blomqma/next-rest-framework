import { createTodo, deleteTodo, getTodoById, getTodos } from '@/actions';
import { rpcRoute } from 'next-rest-framework';

export const runtime = 'edge';

export const { POST } = rpcRoute({
  getTodos,
  getTodoById,
  createTodo,
  deleteTodo
});

export type RpcClient = typeof POST.client;
