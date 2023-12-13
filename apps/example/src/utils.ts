import { z } from 'zod';

export const todoSchema = z.object({
  id: z.number(),
  name: z.string(),
  completed: z.boolean()
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
