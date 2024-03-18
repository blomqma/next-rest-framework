import {
  createTodo,
  deleteTodo,
  getTodoById,
  getTodos,
  formDataUrlEncoded,
  formDataMultipart
} from '@/actions';
import { rpcRoute } from 'next-rest-framework';

export const runtime = 'edge';

export const { POST } = rpcRoute({
  getTodos,
  getTodoById,
  createTodo,
  deleteTodo,
  formDataUrlEncoded,
  formDataMultipart
});

export type RpcClient = typeof POST.client;
