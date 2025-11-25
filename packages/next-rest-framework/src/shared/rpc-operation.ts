/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { type z, type ZodType } from 'zod';
import { validateSchema } from './schemas';
import { DEFAULT_ERRORS } from '../constants';
import {
  type ZodFormSchema,
  type BaseOptions,
  type OpenApiOperation,
  type TypedFormData,
  type FormDataContentType
} from '../types';
import { type OpenAPIV3_1 } from 'openapi-types';

type BaseContentType =
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data';

interface InputObject<ContentType = BaseContentType, Body = unknown> {
  contentType?: ContentType;
  body?: ContentType extends FormDataContentType
    ? ZodFormSchema<Body>
    : ZodType<Body>;
  /*! If defined, this will override the body schema for the OpenAPI spec. */
  bodySchema?: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
}
interface OutputObject {
  body: ZodType;
  /*! If defined, this will override the body schema for the OpenAPI spec. */
  bodySchema?: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
  contentType: BaseContentType;
  name?: string /*! A custom name for the response, used for the generated component name in the OpenAPI spec. */;
}

type RpcMiddleware<
  InputOptions extends BaseOptions = BaseOptions,
  OutputOptions extends BaseOptions = BaseOptions
> = (
  params: unknown,
  options: InputOptions
) => Promise<OutputOptions> | OutputOptions | Promise<void> | void;

type RpcOperationHandler<
  ContentType extends BaseContentType = BaseContentType,
  Body = unknown,
  Options extends BaseOptions = BaseOptions,
  Outputs extends readonly OutputObject[] = readonly OutputObject[]
> = (
  params: ContentType extends FormDataContentType
    ? TypedFormData<z.infer<ZodFormSchema<Body>>>
    : z.infer<ZodType<Body>>,
  options: Options
) =>
  | Promise<z.infer<Outputs[number]['body']>>
  | z.infer<Outputs[number]['body']>;

interface OperationDefinitionMeta {
  openApiOperation?: OpenApiOperation;
  input?: InputObject;
  outputs?: readonly OutputObject[];
  middleware1?: RpcOperationHandler;
  middleware2?: RpcOperationHandler;
  middleware3?: RpcOperationHandler;
  handler?: RpcOperationHandler;
}

export type RpcOperationDefinition<
  ContentType extends BaseContentType = BaseContentType,
  Body = unknown,
  Outputs extends readonly OutputObject[] = readonly OutputObject[],
  HasInput extends boolean = false,
  TypedResponse = Promise<z.infer<Outputs[number]['body']>>
> = (HasInput extends true
  ? (
      body: ContentType extends FormDataContentType
        ? FormData
        : z.infer<ZodType<Body>>
    ) => TypedResponse
  : () => TypedResponse) & {
  _meta: OperationDefinitionMeta;
};

// Build function chain for creating an RPC operation.
export const rpcOperation = (openApiOperation?: OpenApiOperation) => {
  function createOperation<
    ContentType extends BaseContentType,
    Body,
    Outputs extends readonly OutputObject[]
  >(_params: {
    input: InputObject<ContentType, Body>;
    outputs?: Outputs;
    middleware1?: RpcMiddleware<any, any>;
    middleware2?: RpcMiddleware<any, any>;
    middleware3?: RpcMiddleware<any, any>;
    handler?: RpcOperationHandler<ContentType, Body, any, Outputs>;
  }): RpcOperationDefinition<ContentType, Body, Outputs, true>;

  function createOperation<Outputs extends readonly OutputObject[]>(_params: {
    outputs?: Outputs;
    middleware1?: RpcMiddleware<any, any>;
    middleware2?: RpcMiddleware<any, any>;
    middleware3?: RpcMiddleware<any, any>;
    handler?: RpcOperationHandler<BaseContentType, unknown, any, Outputs>;
  }): RpcOperationDefinition<BaseContentType, unknown, Outputs, false>;

  function createOperation<
    ContentType extends BaseContentType,
    Body,
    Outputs extends readonly OutputObject[]
  >({
    input,
    outputs,
    middleware1,
    middleware2,
    middleware3,
    handler
  }: {
    input?: InputObject<ContentType, Body>;
    outputs?: Outputs;
    middleware1?: RpcMiddleware<any, any>;
    middleware2?: RpcMiddleware<any, any>;
    middleware3?: RpcMiddleware<any, any>;
    handler?: RpcOperationHandler<ContentType, Body, any, Outputs>;
  }): RpcOperationDefinition<ContentType, Body, Outputs, boolean> {
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

      if (input?.body) {
        const { valid, errors } = validateSchema({
          schema: input.body,
          obj: body
        });

        if (!valid) {
          throw Error(`${DEFAULT_ERRORS.invalidRequestBody}: ${errors}`);
        }
      }

      if (!handler) {
        throw Error('Handler not found.');
      }

      const res = await handler(
        body as ContentType extends FormDataContentType
          ? TypedFormData<Body>
          : Body,
        middlewareOptions
      );
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

    if (input?.body === undefined) {
      const operation = async () => await callOperation();
      operation._meta = meta;
      return operation as RpcOperationDefinition<
        ContentType,
        unknown,
        Outputs,
        false
      >;
    } else {
      const operation = async (
        body: ContentType extends FormDataContentType
          ? FormData
          : z.infer<ZodType<Body>>
      ) => await callOperation(body);

      operation._meta = meta;
      return operation as RpcOperationDefinition<
        ContentType,
        Body,
        Outputs,
        true
      >;
    }
  }

  return {
    input: <ContentType extends BaseContentType, Body>(
      input: InputObject<ContentType, Body>
    ) => ({
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
                handler: RpcOperationHandler<
                  ContentType,
                  Body,
                  Options3,
                  Output
                >
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
            handler: (
              handler: RpcOperationHandler<ContentType, Body, Options2, Output>
            ) =>
              createOperation({
                input,
                outputs,
                middleware1,
                middleware2,
                handler
              })
          }),
          handler: (
            handler: RpcOperationHandler<ContentType, Body, Options1, Output>
          ) =>
            createOperation({
              input,
              outputs,
              middleware1,
              handler
            })
        }),
        handler: (
          handler: RpcOperationHandler<ContentType, Body, BaseOptions, Output>
        ) =>
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
                handler: RpcOperationHandler<
                  ContentType,
                  Body,
                  Options3,
                  Output
                >
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
            handler: (
              handler: RpcOperationHandler<ContentType, Body, Options2>
            ) =>
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
            handler: (
              handler: RpcOperationHandler<ContentType, Body, Options2, Output>
            ) =>
              createOperation({
                input,
                outputs,
                middleware1,
                middleware2,
                handler
              })
          }),
          handler: (
            handler: RpcOperationHandler<ContentType, Body, Options2>
          ) =>
            createOperation({
              input,
              middleware1,
              middleware2,
              handler
            })
        }),
        outputs: <Output extends readonly OutputObject[]>(outputs: Output) => ({
          handler: (
            handler: RpcOperationHandler<ContentType, Body, Options1, Output>
          ) =>
            createOperation({
              input,
              outputs,
              middleware1,
              handler
            })
        }),
        handler: (handler: RpcOperationHandler<ContentType, Body, Options1>) =>
          createOperation({
            input,
            middleware1,
            handler
          })
      }),
      handler: (handler: RpcOperationHandler<ContentType, Body>) =>
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
              handler: RpcOperationHandler<
                BaseContentType,
                unknown,
                Options3,
                Output
              >
            ) =>
              createOperation({
                outputs,
                middleware1,
                middleware2,
                middleware3,
                handler
              })
          }),
          handler: (
            handler: RpcOperationHandler<
              BaseContentType,
              unknown,
              Options2,
              Output
            >
          ) =>
            createOperation({
              outputs,
              middleware1,
              middleware2,
              handler
            })
        }),
        handler: (
          handler: RpcOperationHandler<
            BaseContentType,
            unknown,
            Options1,
            Output
          >
        ) =>
          createOperation({
            outputs,
            middleware1,
            handler
          })
      }),
      handler: (
        handler: RpcOperationHandler<
          BaseContentType,
          unknown,
          BaseOptions,
          Output
        >
      ) =>
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
          handler: (
            handler: RpcOperationHandler<BaseContentType, unknown, Options3>
          ) =>
            createOperation({ middleware1, middleware2, middleware3, handler })
        }),
        handler: (
          handler: RpcOperationHandler<BaseContentType, unknown, Options2>
        ) => createOperation({ middleware1, middleware2, handler })
      }),
      handler: (
        handler: RpcOperationHandler<BaseContentType, unknown, Options1>
      ) => createOperation({ middleware1, handler })
    }),
    handler: (handler: RpcOperationHandler) => createOperation({ handler })
  };
};
