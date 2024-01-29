/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { type z, type ZodSchema } from 'zod';
import { validateSchema } from './schemas';
import { DEFAULT_ERRORS } from '../constants';
import { type BaseOptions, type OpenApiOperation } from '../types';

interface OutputObject {
  schema: ZodSchema;
  name?: string;
}

type RpcMiddleware<
  InputOptions extends BaseOptions = BaseOptions,
  OutputOptions extends BaseOptions = BaseOptions
> = (
  params: unknown,
  options: InputOptions
) => Promise<OutputOptions> | OutputOptions | Promise<void> | void;

type RpcOperationHandler<
  Input = unknown,
  Options extends BaseOptions = BaseOptions,
  Outputs extends readonly OutputObject[] = readonly OutputObject[]
> = (
  params: z.infer<ZodSchema<Input>>,
  options: Options
) =>
  | Promise<z.infer<Outputs[number]['schema']>>
  | z.infer<Outputs[number]['schema']>;

interface OperationDefinitionMeta {
  openApiOperation?: OpenApiOperation;
  input?: ZodSchema;
  outputs?: readonly OutputObject[];
  middleware1?: RpcOperationHandler;
  middleware2?: RpcOperationHandler;
  middleware3?: RpcOperationHandler;
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

// Build function chain for creating an RPC operation.
export const rpcOperation = (openApiOperation?: OpenApiOperation) => {
  function createOperation<
    Input,
    Outputs extends readonly OutputObject[]
  >(_params: {
    input: ZodSchema<Input>;
    outputs?: Outputs;
    middleware1?: RpcMiddleware<any, any>;
    middleware2?: RpcMiddleware<any, any>;
    middleware3?: RpcMiddleware<any, any>;
    handler?: RpcOperationHandler<Input, any, Outputs>;
  }): RpcOperationDefinition<Input, Outputs, true>;

  function createOperation<Outputs extends readonly OutputObject[]>(_params: {
    outputs?: Outputs;
    middleware1?: RpcMiddleware<any, any>;
    middleware2?: RpcMiddleware<any, any>;
    middleware3?: RpcMiddleware<any, any>;
    handler?: RpcOperationHandler<unknown, any, Outputs>;
  }): RpcOperationDefinition<unknown, Outputs, false>;

  function createOperation<Input, Outputs extends readonly OutputObject[]>({
    input,
    outputs,
    middleware1,
    middleware2,
    middleware3,
    handler
  }: {
    input?: ZodSchema<Input>;
    outputs?: Outputs;
    middleware1?: RpcMiddleware<any, any>;
    middleware2?: RpcMiddleware<any, any>;
    middleware3?: RpcMiddleware<any, any>;
    handler?: RpcOperationHandler<Input, any, Outputs>;
  }): RpcOperationDefinition<Input, Outputs, boolean> {
    const callOperation = async (body?: unknown) => {
      let middlewareOptions: BaseOptions = {};

      if (middleware1) {
        middlewareOptions = await middleware1(body, middlewareOptions);

        if (middleware2) {
          middlewareOptions = await middleware2(body, middlewareOptions);

          if (middleware3) {
            middlewareOptions = await middleware3(body, middlewareOptions);
          }
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

      const res = await handler(body as Input, middlewareOptions);
      return res;
    };

    const meta = {
      openApiOperation,
      input,
      outputs,
      middleware1,
      middleware2,
      middleware3,
      handler
    };

    if (input === undefined) {
      const operation = async () => await callOperation();
      operation._meta = meta;
      return operation as RpcOperationDefinition<unknown, Outputs, false>;
    } else {
      const operation = async (body: z.infer<ZodSchema>) =>
        await callOperation(body);

      operation._meta = meta;
      return operation as RpcOperationDefinition<Input, Outputs, true>;
    }
  }

  return {
    input: <Input>(input: ZodSchema<Input>) => ({
      outputs: <Output extends readonly OutputObject[]>(outputs: Output) => ({
        middleware: <Options1 extends BaseOptions>(
          middleware1: RpcMiddleware<BaseOptions, Options1>
        ) => ({
          middleware: <Options2 extends BaseOptions>(
            middleware2: RpcMiddleware<Options1, Options2>
          ) => ({
            middleware: <Options3 extends BaseOptions>(
              middleware3: RpcMiddleware<Options2, Options3>
            ) => ({
              handler: (
                handler: RpcOperationHandler<Input, Options3, Output>
              ) =>
                createOperation({
                  input,
                  outputs,
                  middleware1,
                  middleware2,
                  middleware3,
                  handler
                })
            }),
            handler: (handler: RpcOperationHandler<Input, Options2, Output>) =>
              createOperation({
                input,
                outputs,
                middleware1,
                middleware2,
                handler
              })
          }),
          handler: (handler: RpcOperationHandler<Input, Options1, Output>) =>
            createOperation({
              input,
              outputs,
              middleware1,
              handler
            })
        }),
        handler: (handler: RpcOperationHandler<Input, BaseOptions, Output>) =>
          createOperation({
            input,
            outputs,
            handler
          })
      }),
      middleware: <Options1 extends BaseOptions>(
        middleware1: RpcMiddleware<BaseOptions, Options1>
      ) => ({
        middleware: <Options2 extends BaseOptions>(
          middleware2: RpcMiddleware<Options1, Options2>
        ) => ({
          middleware: <Options3 extends BaseOptions>(
            middleware3: RpcMiddleware<Options2, Options3>
          ) => ({
            outputs: <Output extends readonly OutputObject[]>(
              outputs: Output
            ) => ({
              handler: (
                handler: RpcOperationHandler<Input, Options3, Output>
              ) =>
                createOperation({
                  input,
                  outputs,
                  middleware1,
                  middleware2,
                  middleware3,
                  handler
                })
            }),
            handler: (handler: RpcOperationHandler<Input, Options2>) =>
              createOperation({
                input,
                middleware1,
                middleware2,
                middleware3,
                handler
              })
          }),
          outputs: <Output extends readonly OutputObject[]>(
            outputs: Output
          ) => ({
            handler: (handler: RpcOperationHandler<Input, Options2, Output>) =>
              createOperation({
                input,
                outputs,
                middleware1,
                middleware2,
                handler
              })
          }),
          handler: (handler: RpcOperationHandler<Input, Options2>) =>
            createOperation({
              input,
              middleware1,
              middleware2,
              handler
            })
        }),
        outputs: <Output extends readonly OutputObject[]>(outputs: Output) => ({
          handler: (handler: RpcOperationHandler<Input, Options1, Output>) =>
            createOperation({
              input,
              outputs,
              middleware1,
              handler
            })
        }),
        handler: (handler: RpcOperationHandler<Input, Options1>) =>
          createOperation({
            input,
            middleware1,
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
      middleware: <Options1 extends BaseOptions>(
        middleware1: RpcMiddleware<BaseOptions, Options1>
      ) => ({
        middleware: <Options2 extends BaseOptions>(
          middleware2: RpcMiddleware<Options1, Options2>
        ) => ({
          middleware: <Options3 extends BaseOptions>(
            middleware3: RpcMiddleware<Options2, Options3>
          ) => ({
            handler: (
              handler: RpcOperationHandler<unknown, Options3, Output>
            ) =>
              createOperation({
                outputs,
                middleware1,
                middleware2,
                middleware3,
                handler
              })
          }),
          handler: (handler: RpcOperationHandler<unknown, Options2, Output>) =>
            createOperation({
              outputs,
              middleware1,
              middleware2,
              handler
            })
        }),
        handler: (handler: RpcOperationHandler<unknown, Options1, Output>) =>
          createOperation({
            outputs,
            middleware1,
            handler
          })
      }),
      handler: (handler: RpcOperationHandler<unknown, BaseOptions, Output>) =>
        createOperation({
          outputs,
          handler
        })
    }),
    middleware: <Options1 extends BaseOptions>(
      middleware1: RpcMiddleware<BaseOptions, Options1>
    ) => ({
      middleware: <Options2 extends BaseOptions>(
        middleware2: RpcMiddleware<Options1, Options2>
      ) => ({
        middleware: <Options3 extends BaseOptions>(
          middleware3: RpcMiddleware<Options2, Options3>
        ) => ({
          handler: (handler: RpcOperationHandler<unknown, Options3>) =>
            createOperation({ middleware1, middleware2, middleware3, handler })
        }),
        handler: (handler: RpcOperationHandler<unknown, Options2>) =>
          createOperation({ middleware1, middleware2, handler })
      }),
      handler: (handler: RpcOperationHandler<unknown, Options1>) =>
        createOperation({ middleware1, handler })
    }),
    handler: (handler: RpcOperationHandler) => createOperation({ handler })
  };
};
