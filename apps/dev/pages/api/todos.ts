import sampleData from 'sample-data.json';
import * as z from 'zod';
import * as yup from 'yup';
import { defineEndpoints } from 'next-rest-framework/client';

export default defineEndpoints({
  middleware: ({ params: { foo, bar, baz } }) => ({
    foo: bar,
    bar: baz,
    baz: foo,
    asd: 'asd'
  }),
  GET: {
    middleware: () => ({
      qux: 'qux'
    }),
    responses: [
      {
        status: 200,
        contentType: 'text/html',
        schema: z.object({
          data: z.array(
            z.object({
              userId: z.number(),
              id: z.number(),
              title: z.string(),
              completed: z.boolean()
            })
          )
        })
      }
    ],
    handler: async ({ res, params: { foo, bar, baz, qux } }) => {
      console.log({ foo, bar, baz, qux });
      res.setHeader('content-type', 'text/html');
      res.status(200).json({ data: sampleData });
    }
  },
  POST: {
    tags: ['Todo'],
    description: 'Create a new todo',
    externalDocs: {
      description: 'Find out more about Swagger',
      url: 'http://swagger.io'
    },
    operationId: 'createTodo',
    parameters: [
      {
        name: 'todo',
        in: 'body',
        description: 'The todo to create',
        required: true,
        deprecated: false,
        allowEmptyValue: false
      }
    ],
    deprecated: false,
    security: [
      {
        foo: ['bar']
      }
    ],
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
        variables: {}
      }
    ],
    requestBody: {
      description: 'The todo to create',
      contentType: 'application/json',
      schema: yup.object({
        foo: yup.string(),
        bar: yup.number()
      }),
      example: {
        foo: 'Buy milk',
        bar: 1
      },
      examples: {},
      encoding: {},
      required: true
    },
    responses: [
      {
        status: 201,
        contentType: 'application/json',
        schema: z.object({
          data: z.array(
            z.object({
              userId: z.number(),
              id: z.number(),
              title: z.string(),
              completed: z.boolean()
            })
          )
        })
      }
    ],
    middleware: () => ({
      qux: 'qux'
    }),
    handler: async ({ res }) => {
      res.status(201).json({ data: sampleData });
    }
  }
});
