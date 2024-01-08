/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { type ValidMethod } from '../constants';
import {
  type OutputObject,
  type Modify,
  type AnyCase,
  type BaseQuery,
  type BaseStatus,
  type BaseContentType,
  type OpenApiOperation,
  type BaseOptions
} from '../types';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { type ZodSchema, type z } from 'zod';

export type TypedNextApiRequest<Body = unknown, Query = BaseQuery> = Modify<
  NextApiRequest,
  {
    body: Body;
    query: Query;
    method: ValidMethod;
  }
>;

type TypedNextApiResponse<Body, Status, ContentType> = Modify<
  NextApiResponse<Body>,
  {
    status: (status: Status) => TypedNextApiResponse<Body, Status, ContentType>;
    redirect: (
      status: Status,
      url: string
    ) => TypedNextApiResponse<Body, Status, ContentType>;

    setDraftMode: (options: {
      enable: boolean;
    }) => TypedNextApiResponse<Body, Status, ContentType>;

    setPreviewData: (
      data: object | string,
      options?: {
        maxAge?: number;
        path?: string;
      }
    ) => TypedNextApiResponse<Body, Status, ContentType>;

    clearPreviewData: (options?: {
      path?: string;
    }) => TypedNextApiResponse<Body, Status, ContentType>;

    setHeader: <
      K extends AnyCase<'Content-Type'> | string,
      V extends number | string | readonly string[]
    >(
      name: K,
      value: K extends AnyCase<'Content-Type'> ? ContentType : V
    ) => void;
  }
>;

type TypedApiRouteHandler<
  Body = unknown,
  Query extends BaseQuery = BaseQuery,
  Options extends BaseOptions = BaseOptions,
  ResponseBody = unknown,
  Status extends BaseStatus = BaseStatus,
  ContentType extends BaseContentType = BaseContentType,
  Outputs extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>
> = (
  req: TypedNextApiRequest<Body, Query>,
  res: TypedNextApiResponse<
    z.infer<Outputs[number]['schema']>,
    Outputs[number]['status'],
    Outputs[number]['contentType']
  >,
  options: Options
) => Promise<void> | void;

type ApiRouteMiddleware<
  InputOptions extends BaseOptions = BaseOptions,
  OutputOptions extends BaseOptions = BaseOptions,
  ResponseBody = unknown,
  Status extends BaseStatus = BaseStatus,
  ContentType extends BaseContentType = BaseContentType,
  Outputs extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>
> = (
  req: NextApiRequest,
  res: TypedNextApiResponse<
    z.infer<Outputs[number]['schema']>,
    Outputs[number]['status'],
    Outputs[number]['contentType']
  >,
  options: InputOptions
) => Promise<void> | void | OutputOptions;

interface InputObject<Body = unknown, Query = BaseQuery> {
  contentType?: BaseContentType;
  body?: ZodSchema<Body>;
  query?: ZodSchema<Query>;
}

export interface ApiRouteOperationDefinition<
  Method extends keyof typeof ValidMethod = keyof typeof ValidMethod
> {
  openApiOperation?: OpenApiOperation;
  method: Method;
  input?: InputObject;
  outputs?: readonly OutputObject[];
  middleware1?: ApiRouteMiddleware;
  middleware2?: ApiRouteMiddleware;
  middleware3?: ApiRouteMiddleware;
  handler?: TypedApiRouteHandler;
}

export const apiRouteOperation = <Method extends keyof typeof ValidMethod>({
  openApiOperation,
  method
}: {
  openApiOperation?: OpenApiOperation;
  method: Method;
}) => {
  const createOperation = ({
    input,
    outputs,
    middleware1,
    middleware2,
    middleware3,
    handler
  }: {
    input?: InputObject;
    outputs?: readonly OutputObject[];
    middleware1?: ApiRouteMiddleware<any, any>;
    middleware2?: ApiRouteMiddleware<any, any>;
    middleware3?: ApiRouteMiddleware<any, any>;
    handler?: TypedApiRouteHandler<any, any, any, any>;
  }): ApiRouteOperationDefinition<Method> => ({
    openApiOperation,
    method,
    input,
    outputs,
    middleware1,
    middleware2,
    middleware3,
    handler
  });

  return {
    input: <Body, Query extends BaseQuery>(
      input: InputObject<Body, Query>
    ) => ({
      outputs: <
        ResponseBody,
        Status extends BaseStatus,
        ContentType extends BaseContentType,
        Outputs extends ReadonlyArray<
          OutputObject<ResponseBody, Status, ContentType>
        >
      >(
        outputs: Outputs
      ) => ({
        middleware: <Options1 extends BaseOptions>(
          middleware1: ApiRouteMiddleware<
            BaseOptions,
            Options1,
            ResponseBody,
            Status,
            ContentType,
            Outputs
          >
        ) => ({
          middleware: <Options2 extends BaseOptions>(
            middleware2: ApiRouteMiddleware<
              Options1,
              Options2,
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => ({
            middleware: <Options3 extends BaseOptions>(
              middleware3: ApiRouteMiddleware<
                Options2,
                Options3,
                ResponseBody,
                Status,
                ContentType,
                Outputs
              >
            ) => ({
              handler: (
                handler: TypedApiRouteHandler<
                  Body,
                  Query,
                  Options3,
                  ResponseBody,
                  Status,
                  ContentType,
                  Outputs
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
              handler: TypedApiRouteHandler<
                Body,
                Query,
                Options2,
                ResponseBody,
                Status,
                ContentType,
                Outputs
              >
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
            handler: TypedApiRouteHandler<
              Body,
              Query,
              Options1,
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware1, handler })
        }),
        handler: (
          handler: TypedApiRouteHandler<
            Body,
            Query,
            BaseOptions,
            ResponseBody,
            Status,
            ContentType,
            Outputs
          >
        ) => createOperation({ input, outputs, handler })
      }),
      middleware: <Options1 extends BaseOptions>(
        middleware1: ApiRouteMiddleware<BaseOptions, Options1>
      ) => ({
        middleware: <Options2 extends BaseOptions>(
          middleware2: ApiRouteMiddleware<Options1, Options2>
        ) => ({
          middleware: <Options3 extends BaseOptions>(
            middleware3: ApiRouteMiddleware<Options2, Options3>
          ) => ({
            outputs: <
              ResponseBody,
              Status extends BaseStatus,
              ContentType extends BaseContentType,
              Outputs extends ReadonlyArray<
                OutputObject<ResponseBody, Status, ContentType>
              >
            >(
              outputs: Outputs
            ) => ({
              handler: (
                handler: TypedApiRouteHandler<
                  Body,
                  Query,
                  Options3,
                  ResponseBody,
                  Status,
                  ContentType,
                  Outputs
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
            handler: (handler: TypedApiRouteHandler<Body, Query, Options3>) =>
              createOperation({
                input,
                middleware1,
                middleware2,
                middleware3,
                handler
              })
          }),
          outputs: <
            ResponseBody,
            Status extends BaseStatus,
            ContentType extends BaseContentType,
            Outputs extends ReadonlyArray<
              OutputObject<ResponseBody, Status, ContentType>
            >
          >(
            outputs: Outputs
          ) => ({
            handler: (
              handler: TypedApiRouteHandler<
                Body,
                Query,
                Options2,
                ResponseBody,
                Status,
                ContentType,
                Outputs
              >
            ) =>
              createOperation({
                input,
                outputs,
                middleware1,
                middleware2,
                handler
              })
          }),
          handler: (handler: TypedApiRouteHandler<Body, Query, Options2>) =>
            createOperation({ input, middleware1, middleware2, handler })
        }),
        outputs: <
          ResponseBody,
          Status extends BaseStatus,
          ContentType extends BaseContentType,
          Outputs extends ReadonlyArray<
            OutputObject<ResponseBody, Status, ContentType>
          >
        >(
          outputs: Outputs
        ) => ({
          handler: (
            handler: TypedApiRouteHandler<
              Body,
              Query,
              Options1,
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware1, handler })
        }),
        handler: (handler: TypedApiRouteHandler<Body, Query, Options1>) =>
          createOperation({ input, middleware1, handler })
      }),
      handler: (handler: TypedApiRouteHandler<Body, Query>) =>
        createOperation({ input, handler })
    }),
    outputs: <
      ResponseBody,
      Status extends BaseStatus,
      ContentType extends BaseContentType,
      Outputs extends ReadonlyArray<
        OutputObject<ResponseBody, Status, ContentType>
      >
    >(
      outputs: Outputs
    ) => ({
      middleware: <Options1 extends BaseOptions>(
        middleware1: ApiRouteMiddleware<BaseOptions, Options1>
      ) => ({
        middleware: <Options2 extends BaseOptions>(
          middleware2: ApiRouteMiddleware<Options1, Options2>
        ) => ({
          middleware: <Options3 extends BaseOptions>(
            middleware3: ApiRouteMiddleware<Options2, Options3>
          ) => ({
            handler: (
              handler: TypedApiRouteHandler<
                unknown,
                BaseQuery,
                Options3,
                ResponseBody,
                Status,
                ContentType,
                Outputs
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
            handler: TypedApiRouteHandler<
              unknown,
              BaseQuery,
              Options2,
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ outputs, middleware1, middleware2, handler })
        }),
        handler: (
          handler: TypedApiRouteHandler<
            unknown,
            BaseQuery,
            Options1,
            ResponseBody,
            Status,
            ContentType,
            Outputs
          >
        ) => createOperation({ outputs, middleware1, handler })
      }),
      handler: (
        handler: TypedApiRouteHandler<
          unknown,
          BaseQuery,
          BaseOptions,
          ResponseBody,
          Status,
          ContentType,
          Outputs
        >
      ) => createOperation({ outputs, handler })
    }),
    middleware: <Options1 extends BaseOptions>(
      middleware1: ApiRouteMiddleware<BaseOptions, Options1>
    ) => ({
      middleware: <Options2 extends BaseOptions>(
        middleware2: ApiRouteMiddleware<Options1, Options2>
      ) => ({
        middleware: <Options3 extends BaseOptions>(
          middleware3: ApiRouteMiddleware<Options2, Options3>
        ) => ({
          handler: (
            handler: TypedApiRouteHandler<unknown, BaseQuery, Options3>
          ) =>
            createOperation({ middleware1, middleware2, middleware3, handler })
        }),
        handler: (
          handler: TypedApiRouteHandler<unknown, BaseQuery, Options2>
        ) => createOperation({ middleware1, middleware2, handler })
      }),
      handler: (handler: TypedApiRouteHandler<unknown, BaseQuery, Options1>) =>
        createOperation({ middleware1, handler })
    }),
    handler: (handler: TypedApiRouteHandler) => createOperation({ handler })
  };
};
