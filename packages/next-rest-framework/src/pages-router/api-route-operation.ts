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
  Outputs extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>
> = (
  req: TypedNextApiRequest<Body, Query>,
  res: TypedNextApiResponse<
    z.infer<Outputs[number]['schema']>,
    Outputs[number]['status'],
    Outputs[number]['contentType']
  >
) => Promise<void> | void;

type ApiRouteOutputs<
  Middleware extends boolean = false,
  Body = unknown,
  Query extends BaseQuery = BaseQuery
> = <
  ResponseBody,
  Status extends BaseStatus,
  ContentType extends BaseContentType,
  Outputs extends ReadonlyArray<OutputObject<ResponseBody, Status, ContentType>>
>(
  params?: Outputs
) => {
  handler: (
    callback?: ApiRouteHandler<
      Body,
      Query,
      ResponseBody,
      Status,
      ContentType,
      Outputs
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
          Outputs
        >
      ) => {
        handler: (
          callback?: ApiRouteHandler<
            Body,
            Query,
            ResponseBody,
            Status,
            ContentType,
            Outputs
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
  outputs: ApiRouteOutputs<Middleware, Body, Query>;
  handler: (
    callback?: ApiRouteHandler<Body, Query>
  ) => ApiRouteOperationDefinition;
} & (Middleware extends true
  ? {
      middleware: (callback?: ApiRouteHandler) => {
        outputs: ApiRouteOutputs<false, Body, Query>;
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
    outputs?: readonly OutputObject[];
    middleware?: NextApiHandler;
    handler?: NextApiHandler;
  };
}

type ApiRouteOperation = (openApiOperation?: OpenApiOperation) => {
  input: ApiRouteInput<true>;
  outputs: ApiRouteOutputs<true>;
  middleware: (middleware?: ApiRouteHandler) => {
    handler: (callback?: ApiRouteHandler) => ApiRouteOperationDefinition;
  };
  handler: (callback?: ApiRouteHandler) => ApiRouteOperationDefinition;
};

export const apiRouteOperation: ApiRouteOperation = (openApiOperation) => {
  const createConfig = <Middleware, Handler>(
    input: InputObject | undefined,
    outputs: readonly OutputObject[] | undefined,
    middleware: Middleware | undefined,
    handler: Handler | undefined
  ): ApiRouteOperationDefinition => ({
    _meta: {
      openApiOperation,
      input,
      outputs,
      middleware: middleware as NextApiHandler,
      handler: handler as NextApiHandler
    }
  });

  return {
    input: (input) => ({
      outputs: (outputs) => ({
        middleware: (middleware) => ({
          handler: (handler) =>
            createConfig(input, outputs, middleware, handler)
        }),
        handler: (handler) => createConfig(input, outputs, undefined, handler)
      }),
      middleware: (middleware) => ({
        outputs: (outputs) => ({
          handler: (handler) =>
            createConfig(input, outputs, middleware, handler)
        }),
        handler: (handler) =>
          createConfig(input, undefined, middleware, handler)
      }),
      handler: (handler) => createConfig(input, undefined, undefined, handler)
    }),
    outputs: (outputs) => ({
      middleware: (middleware) => ({
        handler: (handler) =>
          createConfig(undefined, outputs, middleware, handler)
      }),
      handler: (handler) => createConfig(undefined, outputs, undefined, handler)
    }),
    middleware: (middleware) => ({
      handler: (handler) =>
        createConfig(undefined, undefined, middleware, handler)
    }),
    handler: (handler) => createConfig(undefined, undefined, undefined, handler)
  };
};
