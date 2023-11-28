import { type z, type ZodSchema } from 'zod';
import { validateSchema } from './schemas';
import { DEFAULT_ERRORS } from '../constants';
import { type OpenApiOperation } from '../types';

interface OutputObject {
  schema: ZodSchema;
  name?: string;
}

type RpcOperationHandler<
  Input = unknown,
  Outputs extends readonly OutputObject[] = readonly OutputObject[]
> = (
  params: z.infer<ZodSchema<Input>>
) =>
  | Promise<z.infer<Outputs[number]['schema']>>
  | z.infer<Outputs[number]['schema']>;

interface OperationDefinitionMeta {
  openApiOperation?: OpenApiOperation;
  input?: ZodSchema;
  outputs?: readonly OutputObject[];
  middleware?: RpcOperationHandler;
  handler?: RpcOperationHandler;
}

export type RpcOperationDefinition<
  Input = unknown,
  Outputs extends readonly OutputObject[] = readonly OutputObject[],
  HasInput extends boolean = false,
  TypedResponse = Promise<z.infer<Outputs[number]['schema']>>
> = (HasInput extends true
  ? (body: z.infer<ZodSchema<Input>>) => TypedResponse
  : () => TypedResponse) & {
  _meta: OperationDefinitionMeta;
};

export const rpcOperation = (openApiOperation?: OpenApiOperation) => {
  function createOperation<
    Input,
    Outputs extends readonly OutputObject[]
  >(_params: {
    input: ZodSchema<Input>;
    outputs?: Outputs;
    middleware?: RpcOperationHandler<unknown, Outputs>;
    handler?: RpcOperationHandler<Input, Outputs>;
  }): RpcOperationDefinition<Input, Outputs, true>;

  function createOperation<Outputs extends readonly OutputObject[]>(_params: {
    outputs?: Outputs;
    middleware?: RpcOperationHandler<unknown, Outputs>;
    handler?: RpcOperationHandler<unknown, Outputs>;
  }): RpcOperationDefinition<unknown, Outputs, false>;

  function createOperation<Input, Outputs extends readonly OutputObject[]>({
    input,
    outputs,
    middleware,
    handler
  }: {
    input?: ZodSchema<Input>;
    outputs?: Outputs;
    middleware?: RpcOperationHandler<unknown, Outputs>;
    handler?: RpcOperationHandler<Input, Outputs>;
  }): RpcOperationDefinition<Input, Outputs, boolean> {
    const meta = {
      openApiOperation,
      input,
      outputs,
      middleware,
      handler
    };

    const callOperation = async (body?: unknown) => {
      if (middleware) {
        const _res = await middleware(body);

        if (_res) {
          return _res;
        }
      }

      if (input) {
        const { valid, errors } = await validateSchema({
          schema: input,
          obj: body
        });

        if (!valid) {
          throw Error(`${DEFAULT_ERRORS.invalidRequestBody}: ${errors}`);
        }
      }

      if (!handler) {
        throw Error('Handler not found.');
      }

      return await handler(body as z.infer<ZodSchema<Input>>);
    };

    if (input === undefined) {
      const operation = async () => await callOperation();
      operation._meta = meta;
      return operation as RpcOperationDefinition<unknown, Outputs, false>;
    } else {
      const operation = async (body: z.infer<ZodSchema<Input>>) =>
        await callOperation(body);

      operation._meta = meta;
      return operation as RpcOperationDefinition<Input, Outputs, true>;
    }
  }

  return {
    input: <Input>(input: ZodSchema<Input>) => ({
      outputs: <Output extends readonly OutputObject[]>(outputs: Output) => ({
        middleware: (middleware: RpcOperationHandler<unknown, Output>) => ({
          handler: (handler: RpcOperationHandler<Input, Output>) =>
            createOperation({
              input,
              outputs,
              middleware,
              handler
            })
        }),
        handler: (handler: RpcOperationHandler<Input, Output>) =>
          createOperation({
            input,
            outputs,
            handler
          })
      }),
      middleware: (middleware: RpcOperationHandler) => ({
        outputs: <Output extends readonly OutputObject[]>(outputs: Output) => ({
          handler: (handler: RpcOperationHandler<Input, Output>) =>
            createOperation({
              input,
              outputs,
              middleware,
              handler
            })
        }),
        handler: (handler: RpcOperationHandler<Input>) =>
          createOperation({
            input,
            middleware,
            handler
          })
      }),
      handler: (handler: RpcOperationHandler<Input>) =>
        createOperation({
          input,
          handler
        })
    }),
    outputs: <Output extends readonly OutputObject[]>(outputs: Output) => ({
      middleware: (middleware: RpcOperationHandler<unknown, Output>) => ({
        handler: (handler: RpcOperationHandler<unknown, Output>) =>
          createOperation({
            outputs,
            middleware,
            handler
          })
      }),
      handler: (handler: RpcOperationHandler<unknown, Output>) =>
        createOperation({
          outputs,
          handler
        })
    }),
    middleware: (middleware: RpcOperationHandler) => ({
      handler: (handler: RpcOperationHandler) =>
        createOperation({ middleware, handler })
    }),
    handler: (handler: RpcOperationHandler) => createOperation({ handler })
  };
};
