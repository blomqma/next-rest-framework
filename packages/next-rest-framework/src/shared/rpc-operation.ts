import { type z, type ZodSchema } from 'zod';
import { type OpenAPIV3_1 } from 'openapi-types';

type OperationHandler<
  Input = unknown,
  Output extends readonly ZodSchema[] = readonly ZodSchema[]
> = (
  params: z.infer<ZodSchema<Input>>
) => Promise<z.infer<Output[number]>> | z.infer<Output[number]>;

interface OperationDefinitionMeta<Input, Output extends readonly ZodSchema[]> {
  openApiOperation?: OpenAPIV3_1.OperationObject;
  input?: ZodSchema<Input | unknown>;
  output?: Output;
  middleware?: OperationHandler<Input, Output>;
  handler?: OperationHandler<Input, Output>;
}

export type OperationDefinition<
  Input = unknown,
  Output extends readonly ZodSchema[] = readonly ZodSchema[],
  HasInput extends boolean = true
> = (HasInput extends true
  ? (body: z.infer<ZodSchema<Input>>) => Promise<z.infer<Output[number]>>
  : () => Promise<z.infer<Output[number]>>) & {
  _meta: OperationDefinitionMeta<Input, Output>;
};

export const rpcOperation = (
  openApiOperation?: OpenAPIV3_1.OperationObject
) => {
  function createOperation<Input, Output extends readonly ZodSchema[]>(
    input: ZodSchema<Input>,
    output: Output | undefined,
    middleware: OperationHandler<Input, Output> | undefined,
    handler: OperationHandler<Input, Output> | undefined
  ): OperationDefinition<Input, Output, true>;

  function createOperation<Output extends readonly ZodSchema[]>(
    input: undefined,
    output: Output | undefined,
    middleware: OperationHandler<unknown, Output> | undefined,
    handler: OperationHandler<unknown, Output> | undefined
  ): OperationDefinition<unknown, Output, false>;

  function createOperation<Input, Output extends readonly ZodSchema[]>(
    input: ZodSchema<Input> | undefined,
    output: Output | undefined,
    middleware: OperationHandler<Input, Output> | undefined,
    handler: OperationHandler<Input, Output> | undefined
  ): OperationDefinition<Input, Output, boolean> {
    const meta = {
      openApiOperation,
      input,
      output,
      middleware,
      handler
    };

    if (input === undefined) {
      const operation = async () => {};
      operation._meta = meta;
      return operation as OperationDefinition<unknown, Output, false>;
    } else {
      const operation = async (_body: z.infer<ZodSchema<Input>>) => {};
      operation._meta = meta;
      return operation as OperationDefinition<Input, Output, true>;
    }
  }

  return {
    input: <Input>(input: ZodSchema<Input>) => ({
      output: <Output extends readonly ZodSchema[]>(output: Output) => ({
        middleware: (middleware: OperationHandler<Input, Output>) => ({
          handler: (handler: OperationHandler<Input, Output>) =>
            createOperation(input, output, middleware, handler)
        }),
        handler: (handler: OperationHandler<Input, Output>) =>
          createOperation(input, output, undefined, handler)
      }),
      middleware: (middleware: OperationHandler<Input>) => ({
        output: <Output extends readonly ZodSchema[]>(output: Output) => ({
          handler: (handler: OperationHandler<Input, Output>) =>
            createOperation(input, output, middleware, handler)
        }),
        handler: (handler: OperationHandler<Input>) =>
          createOperation(input, undefined, middleware, handler)
      }),
      handler: (handler: OperationHandler<Input>) =>
        createOperation(input, undefined, undefined, handler)
    }),
    output: <Output extends readonly ZodSchema[]>(output: Output) => ({
      middleware: (middleware: OperationHandler<unknown, Output>) => ({
        handler: (handler: OperationHandler<unknown, Output>) =>
          createOperation(undefined, output, middleware, handler)
      }),
      handler: (handler: OperationHandler<unknown, Output>) =>
        createOperation(undefined, output, undefined, handler)
    }),
    middleware: (middleware: OperationHandler) => ({
      handler: (handler: OperationHandler) =>
        createOperation(undefined, undefined, middleware, handler)
    }),
    handler: (handler: OperationHandler) =>
      createOperation(undefined, undefined, undefined, handler)
  };
};
