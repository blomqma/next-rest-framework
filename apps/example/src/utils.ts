import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const todoSchema = z.object({
  id: z.number(),
  name: z.string(),
  completed: z.boolean()
});

export const formSchema = zfd.formData({
  text: zfd.text()
});

export const multipartFormSchema = zfd.formData({
  text: zfd.text(),
  file: zfd.file() // In development with Edge runtime this won't work: https://github.com/vercel/next.js/issues/38184
});

export type Todo = z.infer<typeof todoSchema>;

export const MOCK_TODOS: Todo[] = [
  {
    id: 1,
    name: 'TODO 1',
    completed: false
  },
  {
    id: 2,
    name: 'TODO 2',
    completed: false
  },
  {
    id: 3,
    name: 'TODO 3',
    completed: false
  }
  // ...
];
