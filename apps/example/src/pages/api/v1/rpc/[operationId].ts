import {
  createTodo,
  deleteTodo,
  getTodoById,
  getTodos,
  formDataUrlEncoded,
  formDataMultipart
} from '@/actions';
import { rpcApiRoute } from 'next-rest-framework';

// Body parser must be disabled when parsing multipart/form-data requests with pages router.
// A recommended way is to create a separate RPC API route for multipart/form-data requests.
// export const config = {
//   api: {
//     bodyParser: false
//   }
// };

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
