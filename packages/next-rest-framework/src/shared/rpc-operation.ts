import { type z, type ZodSchema } from 'zod';

interface OutputObject {
  schema: ZodSchema;
  name?: string;
}

type OperationHandler<
  Input = unknown,
  Outputs extends readonly OutputObject[] = readonly OutputObject[]
> = (
  params: z.infer<ZodSchema<Input>>
) =>
  | Promise<z.infer<Outputs[number]['schema']>>
  | z.infer<Outputs[number]['schema']>;

interface OperationDefinitionMeta<
  Input,
  Outputs extends readonly OutputObject[]
> {
  input?: ZodSchema<Input | unknown>;
  outputs?: Outputs;
  middleware?: OperationHandler<Input, Outputs>;
  handler?: OperationHandler<Input, Outputs>;
}

export type OperationDefinition<
  Input = unknown,
  Outputs extends readonly OutputObject[] = readonly OutputObject[],
  HasInput extends boolean = true
> = (HasInput extends true
  ? (
      body: z.infer<ZodSchema<Input>>
    ) => Promise<z.infer<Outputs[number]['schema']>>
  : () => Promise<z.infer<Outputs[number]['schema']>>) & {
  _meta: OperationDefinitionMeta<Input, Outputs>;
};

export const rpcOperation = () => {
  function createOperation<Input, Outputs extends readonly OutputObject[]>(
    input: ZodSchema<Input>,
    outputs: Outputs | undefined,
    middleware: OperationHandler<Input, Outputs> | undefined,
    handler: OperationHandler<Input, Outputs> | undefined
  ): OperationDefinition<Input, Outputs, true>;

  function createOperation<Outputs extends readonly OutputObject[]>(
    input: undefined,
    outputs: Outputs | undefined,
    middleware: OperationHandler<unknown, Outputs> | undefined,
    handler: OperationHandler<unknown, Outputs> | undefined
  ): OperationDefinition<unknown, Outputs, false>;

  function createOperation<Input, Outputs extends readonly OutputObject[]>(
    input: ZodSchema<Input> | undefined,
    outputs: Outputs | undefined,
    middleware: OperationHandler<Input, Outputs> | undefined,
    handler: OperationHandler<Input, Outputs> | undefined
  ): OperationDefinition<Input, Outputs, boolean> {
    const meta = {
      input,
      outputs,
      middleware,
      handler
    };

    if (input === undefined) {
      const operation = async () => {};
      operation._meta = meta;
      return operation as OperationDefinition<unknown, Outputs, false>;
    } else {
      const operation = async (_body: z.infer<ZodSchema<Input>>) => {};
      operation._meta = meta;
      return operation as OperationDefinition<Input, Outputs, true>;
    }
  }

  return {
    input: <Input>(input: ZodSchema<Input>) => ({
      outputs: <Output extends readonly OutputObject[]>(outputs: Output) => ({
        middleware: (middleware: OperationHandler<Input, Output>) => ({
          handler: (handler: OperationHandler<Input, Output>) =>
            createOperation(input, outputs, middleware, handler)
        }),
        handler: (handler: OperationHandler<Input, Output>) =>
          createOperation(input, outputs, undefined, handler)
      }),
      middleware: (middleware: OperationHandler<Input>) => ({
        outputs: <Output extends readonly OutputObject[]>(outputs: Output) => ({
          handler: (handler: OperationHandler<Input, Output>) =>
            createOperation(input, outputs, middleware, handler)
        }),
        handler: (handler: OperationHandler<Input>) =>
          createOperation(input, undefined, middleware, handler)
      }),
      handler: (handler: OperationHandler<Input>) =>
        createOperation(input, undefined, undefined, handler)
    }),
    outputs: <Output extends readonly OutputObject[]>(outputs: Output) => ({
      middleware: (middleware: OperationHandler<unknown, Output>) => ({
        handler: (handler: OperationHandler<unknown, Output>) =>
          createOperation(undefined, outputs, middleware, handler)
      }),
      handler: (handler: OperationHandler<unknown, Output>) =>
        createOperation(undefined, outputs, undefined, handler)
    }),
    middleware: (middleware: OperationHandler) => ({
      handler: (handler: OperationHandler) =>
        createOperation(undefined, undefined, middleware, handler)
    }),
    handler: (handler: OperationHandler) =>
      createOperation(undefined, undefined, undefined, handler)
  };
};
