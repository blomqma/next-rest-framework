import { type ValidMethod } from '../constants';
import {
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
import { type ZodSchema, type z } from 'zod';

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

type TypedApiRouteHandler<
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

interface InputObject<Body = unknown, Query = BaseQuery> {
  contentType?: BaseContentType;
  body?: ZodSchema<Body>;
  query?: ZodSchema<Query>;
}

export interface ApiRouteOperationDefinition {
  openApiOperation?: OpenApiOperation;
  method: keyof typeof ValidMethod;
  input?: InputObject;
  outputs?: readonly OutputObject[];
  middleware?: NextApiHandler;
  handler?: NextApiHandler;
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
    middleware: _middleware,
    handler: _handler
  }: {
    input?: InputObject;
    outputs?: readonly OutputObject[];
    middleware?: TypedApiRouteHandler<any, any, any>;
    handler?: TypedApiRouteHandler<any, any, any>;
  }): ApiRouteOperationDefinition => {
    const middleware = _middleware as NextApiHandler;
    const handler = _handler as NextApiHandler;

    return {
      openApiOperation,
      method,
      input,
      outputs,
      middleware,
      handler
    };
  };

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
        middleware: (
          middleware: TypedApiRouteHandler<
            unknown,
            BaseQuery,
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
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware, handler })
        }),
        handler: (
          handler: TypedApiRouteHandler<
            Body,
            Query,
            ResponseBody,
            Status,
            ContentType,
            Outputs
          >
        ) => createOperation({ input, outputs, handler })
      }),
      middleware: (middleware: TypedApiRouteHandler) => ({
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
              ResponseBody,
              Status,
              ContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware, handler })
        }),
        handler: (handler: TypedApiRouteHandler<Body, Query>) =>
          createOperation({ input, middleware, handler })
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
      middleware: (
        middleware: TypedApiRouteHandler<
          unknown,
          BaseQuery,
          ResponseBody,
          Status,
          ContentType,
          Outputs
        >
      ) => ({
        handler: (
          handler: TypedApiRouteHandler<
            unknown,
            BaseQuery,
            ResponseBody,
            Status,
            ContentType,
            Outputs
          >
        ) => createOperation({ outputs, middleware, handler })
      }),
      handler: (
        handler: TypedApiRouteHandler<
          unknown,
          BaseQuery,
          ResponseBody,
          Status,
          ContentType,
          Outputs
        >
      ) => createOperation({ outputs, handler })
    }),
    middleware: (middleware: TypedApiRouteHandler) => ({
      handler: (handler: TypedApiRouteHandler) =>
        createOperation({ middleware, handler })
    }),
    handler: (handler: TypedApiRouteHandler) => createOperation({ handler })
  };
};
