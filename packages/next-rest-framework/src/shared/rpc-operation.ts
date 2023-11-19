import { type z, type ZodSchema } from 'zod';

interface OutputObject {
  schema: ZodSchema;
  name?: string;
}

type OperationHandler<
  Input = unknown,
  Output extends readonly OutputObject[] = readonly OutputObject[]
> = (
  params: z.infer<ZodSchema<Input>>
) =>
  | Promise<z.infer<Output[number]['schema']>>
  | z.infer<Output[number]['schema']>;

interface OperationDefinitionMeta<
  Input,
  Output extends readonly OutputObject[]
> {
  input?: ZodSchema<Input | unknown>;
  output?: Output;
  middleware?: OperationHandler<Input, Output>;
  handler?: OperationHandler<Input, Output>;
}

export type OperationDefinition<
  Input = unknown,
  Output extends readonly OutputObject[] = readonly OutputObject[],
  HasInput extends boolean = true
> = (HasInput extends true
  ? (
      body: z.infer<ZodSchema<Input>>
    ) => Promise<z.infer<Output[number]['schema']>>
  : () => Promise<z.infer<Output[number]['schema']>>) & {
  _meta: OperationDefinitionMeta<Input, Output>;
};

export const rpcOperation = () => {
  function createOperation<Input, Output extends readonly OutputObject[]>(
    input: ZodSchema<Input>,
    output: Output | undefined,
    middleware: OperationHandler<Input, Output> | undefined,
    handler: OperationHandler<Input, Output> | undefined
  ): OperationDefinition<Input, Output, true>;

  function createOperation<Output extends readonly OutputObject[]>(
    input: undefined,
    output: Output | undefined,
    middleware: OperationHandler<unknown, Output> | undefined,
    handler: OperationHandler<unknown, Output> | undefined
  ): OperationDefinition<unknown, Output, false>;

  function createOperation<Input, Output extends readonly OutputObject[]>(
    input: ZodSchema<Input> | undefined,
    output: Output | undefined,
    middleware: OperationHandler<Input, Output> | undefined,
    handler: OperationHandler<Input, Output> | undefined
  ): OperationDefinition<Input, Output, boolean> {
    const meta = {
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
      output: <Output extends readonly OutputObject[]>(output: Output) => ({
        middleware: (middleware: OperationHandler<Input, Output>) => ({
          handler: (handler: OperationHandler<Input, Output>) =>
            createOperation(input, output, middleware, handler)
        }),
        handler: (handler: OperationHandler<Input, Output>) =>
          createOperation(input, output, undefined, handler)
      }),
      middleware: (middleware: OperationHandler<Input>) => ({
        output: <Output extends readonly OutputObject[]>(output: Output) => ({
          handler: (handler: OperationHandler<Input, Output>) =>
            createOperation(input, output, middleware, handler)
        }),
        handler: (handler: OperationHandler<Input>) =>
          createOperation(input, undefined, middleware, handler)
      }),
      handler: (handler: OperationHandler<Input>) =>
        createOperation(input, undefined, undefined, handler)
    }),
    output: <Output extends readonly OutputObject[]>(output: Output) => ({
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
