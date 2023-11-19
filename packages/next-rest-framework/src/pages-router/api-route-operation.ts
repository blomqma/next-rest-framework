import { type ValidMethod } from '../constants';
import {
  type InputObject,
  type OutputObject,
  type Modify,
  type AnyCase,
  type BaseQuery,
  type BaseStatus,
  type BaseContentType,
  type OpenApiOperation
} from '../types';
import {
  type NextApiRequest,
  type NextApiHandler,
  type NextApiResponse
} from 'next/types';
import { type z } from 'zod';

type TypedNextApiRequest<Body, Query> = Modify<
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

type ApiRouteHandler<
  Body = unknown,
  Query extends BaseQuery = BaseQuery,
  ResponseBody = unknown,
  Status extends BaseStatus = BaseStatus,
  ContentType extends BaseContentType = BaseContentType,
  Output extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>
> = (
  req: TypedNextApiRequest<Body, Query>,
  res: TypedNextApiResponse<
    z.infer<Output[number]['schema']>,
    Output[number]['status'],
    Output[number]['contentType']
  >
) => Promise<void> | void;

type ApiRouteOutput<
  Middleware extends boolean = false,
  Body = unknown,
  Query extends BaseQuery = BaseQuery
> = <
  ResponseBody,
  Status extends BaseStatus,
  ContentType extends BaseContentType,
  Output extends ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>
>(
  params?: Output
) => {
  handler: (
    callback?: ApiRouteHandler<
      Body,
      Query,
      ResponseBody,
      Status,
      ContentType,
      Output
    >
  ) => ApiRouteOperationDefinition;
} & (Middleware extends true
  ? {
      middleware: (
        callback?: ApiRouteHandler<
          unknown,
          BaseQuery,
          ResponseBody,
          Status,
          ContentType,
          Output
        >
      ) => {
        handler: (
          callback?: ApiRouteHandler<
            Body,
            Query,
            ResponseBody,
            Status,
            ContentType,
            Output
          >
        ) => ApiRouteOperationDefinition;
      };
    }
  : Record<string, unknown>);

type ApiRouteInput<Middleware extends boolean = false> = <
  Body,
  Query extends BaseQuery
>(
  params?: InputObject<Body, Query>
) => {
  output: ApiRouteOutput<Middleware, Body, Query>;
  handler: (
    callback?: ApiRouteHandler<Body, Query>
  ) => ApiRouteOperationDefinition;
} & (Middleware extends true
  ? {
      middleware: (callback?: ApiRouteHandler) => {
        output: ApiRouteOutput<false, Body, Query>;
        handler: (
          callback?: ApiRouteHandler<Body, Query>
        ) => ApiRouteOperationDefinition;
      };
    }
  : Record<string, unknown>);

export interface ApiRouteOperationDefinition {
  _meta: {
    openApiOperation?: OpenApiOperation;
    input?: InputObject;
    output?: readonly OutputObject[];
    middleware?: NextApiHandler;
    handler?: NextApiHandler;
  };
}

type ApiRouteOperation = (openApiOperation?: OpenApiOperation) => {
  input: ApiRouteInput<true>;
  output: ApiRouteOutput<true>;
  middleware: (middleware?: ApiRouteHandler) => {
    handler: (callback?: ApiRouteHandler) => ApiRouteOperationDefinition;
  };
  handler: (callback?: ApiRouteHandler) => ApiRouteOperationDefinition;
};

export const apiRouteOperation: ApiRouteOperation = (openApiOperation) => {
  const createConfig = <Middleware, Handler>(
    input: InputObject | undefined,
    output: readonly OutputObject[] | undefined,
    middleware: Middleware | undefined,
    handler: Handler | undefined
  ): ApiRouteOperationDefinition => ({
    _meta: {
      openApiOperation,
      input,
      output,
      middleware: middleware as NextApiHandler,
      handler: handler as NextApiHandler
    }
  });

  return {
    input: (input) => ({
      output: (output) => ({
        middleware: (middleware) => ({
          handler: (handler) => createConfig(input, output, middleware, handler)
        }),
        handler: (handler) => createConfig(input, output, undefined, handler)
      }),
      middleware: (middleware) => ({
        output: (output) => ({
          handler: (handler) => createConfig(input, output, middleware, handler)
        }),
        handler: (handler) =>
          createConfig(input, undefined, middleware, handler)
      }),
      handler: (handler) => createConfig(input, undefined, undefined, handler)
    }),
    output: (output) => ({
      middleware: (middleware) => ({
        handler: (handler) =>
          createConfig(undefined, output, middleware, handler)
      }),
      handler: (handler) => createConfig(undefined, output, undefined, handler)
    }),
    middleware: (middleware) => ({
      handler: (handler) =>
        createConfig(undefined, undefined, middleware, handler)
    }),
    handler: (handler) => createConfig(undefined, undefined, undefined, handler)
  };
};
