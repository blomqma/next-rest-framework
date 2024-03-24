import {
  createTodo,
  deleteTodo,
  getTodoById,
  getTodos,
  formDataUrlEncoded,
  formDataMultipart
} from '@/actions';
import { rpcApiRoute } from 'next-rest-framework';

const handler = rpcApiRoute({
  getTodos,
  getTodoById,
  createTodo,
  deleteTodo,
  formDataUrlEncoded,
  formDataMultipart
});

export type RpcClient = typeof handler.client;

export default handler;
