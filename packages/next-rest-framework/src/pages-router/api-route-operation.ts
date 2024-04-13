/* eslint-disable @typescript-eslint/no-invalid-void-type */

import { type OpenAPIV3_1 } from 'openapi-types';
import { type ValidMethod } from '../constants';
import {
  type OutputObject,
  type Modify,
  type AnyCase,
  type BaseQuery,
  type BaseStatus,
  type BaseContentType,
  type OpenApiOperation,
  type BaseOptions,
  type TypedFormData,
  type ZodFormSchema,
  type ContentTypesThatSupportInputValidation,
  type FormDataContentType,
  type BaseParams
} from '../types';
import { type NextApiRequest, type NextApiResponse } from 'next/types';
import { type ZodSchema, type z } from 'zod';

export type TypedNextApiRequest<
  Method = keyof typeof ValidMethod,
  ContentType = BaseContentType,
  Body = unknown,
  QueryAndParams = BaseQuery & BaseParams
> = Modify<
  NextApiRequest,
  {
    /*!
     * For GET requests, attempting to parse a JSON body gives a type error.
     * application/json requests are typed with a strongly-typed JSON body.
     * application/x-www-form-urlencoded and multipart/form-data requests are
     * typed with a strongly-typed form data object.
     */
    body: Method extends 'GET'
      ? never
      : ContentType extends FormDataContentType
      ? TypedFormData<Body>
      : never;
    query: QueryAndParams;
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
  Method extends keyof typeof ValidMethod = keyof typeof ValidMethod,
  ContentType extends BaseContentType = BaseContentType,
  Body = unknown,
  Query extends BaseQuery = BaseQuery,
  Params extends BaseParams = BaseParams,
  Options extends BaseOptions = BaseOptions,
  ResponseBody = unknown,
  Status extends BaseStatus = BaseStatus,
  ResponseContentType extends BaseContentType = BaseContentType,
  Outputs extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ResponseContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ResponseContentType>>
> = (
  req: TypedNextApiRequest<Method, ContentType, Body, Query & Params>,
  res: TypedNextApiResponse<
    z.infer<Outputs[number]['body']>,
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
  ResponseContentType extends BaseContentType = BaseContentType,
  Outputs extends ReadonlyArray<
    OutputObject<ResponseBody, Status, ResponseContentType>
  > = ReadonlyArray<OutputObject<ResponseBody, Status, ResponseContentType>>
> = (
  req: NextApiRequest,
  res: TypedNextApiResponse<
    z.infer<Outputs[number]['body']>,
    Outputs[number]['status'],
    Outputs[number]['contentType']
  >,
  options: InputOptions
) => Promise<void> | void | Promise<OutputOptions> | OutputOptions;

interface InputObject<
  ContentType = BaseContentType,
  Body = unknown,
  Query = BaseQuery,
  Params = BaseParams
> {
  contentType?: ContentType;
  /*!
   * Body schema is supported only for certain content types that support input validation.
   * multipart/form-data validation is also supported with app router.
   */
  body?: ContentType extends ContentTypesThatSupportInputValidation
    ? ContentType extends FormDataContentType
      ? ZodFormSchema<Body>
      : ZodSchema<Body>
    : never;
  /*! If defined, this will override the body schema for the OpenAPI spec. */
  bodySchema?: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
  query?: ZodSchema<Query>;
  /*! If defined, this will override the query schema for the OpenAPI spec. */
  querySchema?: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
  params?: ZodSchema<Params>;
  /*! If defined, this will override the params schema for the OpenAPI spec. */
  paramsSchema?: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
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

// Build function chain for an API route operation.
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
    handler?: TypedApiRouteHandler<any, any, any, any, any, any>;
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
    input: <
      ContentType extends BaseContentType,
      Body,
      Query extends BaseQuery,
      Params extends BaseParams
    >(
      input: InputObject<ContentType, Body, Query, Params>
    ) => ({
      outputs: <
        ResponseBody,
        Status extends BaseStatus,
        ResponseContentType extends BaseContentType,
        Outputs extends ReadonlyArray<
          OutputObject<ResponseBody, Status, ResponseContentType>
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
            ResponseContentType,
            Outputs
          >
        ) => ({
          middleware: <Options2 extends BaseOptions>(
            middleware2: ApiRouteMiddleware<
              Options1,
              Options2,
              ResponseBody,
              Status,
              ResponseContentType,
              Outputs
            >
          ) => ({
            middleware: <Options3 extends BaseOptions>(
              middleware3: ApiRouteMiddleware<
                Options2,
                Options3,
                ResponseBody,
                Status,
                ResponseContentType,
                Outputs
              >
            ) => ({
              handler: (
                handler: TypedApiRouteHandler<
                  Method,
                  ContentType,
                  Body,
                  Query,
                  Params,
                  Options3,
                  ResponseBody,
                  Status,
                  ResponseContentType,
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
                Method,
                ContentType,
                Body,
                Query,
                Params,
                Options2,
                ResponseBody,
                Status,
                ResponseContentType,
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
              Method,
              ContentType,
              Body,
              Query,
              Params,
              Options1,
              ResponseBody,
              Status,
              ResponseContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware1, handler })
        }),
        handler: (
          handler: TypedApiRouteHandler<
            Method,
            ContentType,
            Body,
            Query,
            Params,
            BaseOptions,
            ResponseBody,
            Status,
            ResponseContentType,
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
              ResponseContentType extends BaseContentType,
              Outputs extends ReadonlyArray<
                OutputObject<ResponseBody, Status, ResponseContentType>
              >
            >(
              outputs: Outputs
            ) => ({
              handler: (
                handler: TypedApiRouteHandler<
                  Method,
                  ContentType,
                  Body,
                  Query,
                  Params,
                  Options3,
                  ResponseBody,
                  Status,
                  ResponseContentType,
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
                Method,
                ContentType,
                Body,
                Query,
                Params,
                Options3
              >
            ) =>
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
            ResponseContentType extends BaseContentType,
            Outputs extends ReadonlyArray<
              OutputObject<ResponseBody, Status, ResponseContentType>
            >
          >(
            outputs: Outputs
          ) => ({
            handler: (
              handler: TypedApiRouteHandler<
                Method,
                ContentType,
                Body,
                Query,
                Params,
                Options2,
                ResponseBody,
                Status,
                ResponseContentType,
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
              Method,
              ContentType,
              Body,
              Query,
              Params,
              Options2
            >
          ) => createOperation({ input, middleware1, middleware2, handler })
        }),
        outputs: <
          ResponseBody,
          Status extends BaseStatus,
          ResponseContentType extends BaseContentType,
          Outputs extends ReadonlyArray<
            OutputObject<ResponseBody, Status, ResponseContentType>
          >
        >(
          outputs: Outputs
        ) => ({
          handler: (
            handler: TypedApiRouteHandler<
              Method,
              ContentType,
              Body,
              Query,
              Params,
              Options1,
              ResponseBody,
              Status,
              ResponseContentType,
              Outputs
            >
          ) => createOperation({ input, outputs, middleware1, handler })
        }),
        handler: (
          handler: TypedApiRouteHandler<
            Method,
            ContentType,
            Body,
            Query,
            Params,
            Options1
          >
        ) => createOperation({ input, middleware1, handler })
      }),
      handler: (
        handler: TypedApiRouteHandler<Method, ContentType, Body, Query>
      ) => createOperation({ input, handler })
    }),
    outputs: <
      ResponseBody,
      Status extends BaseStatus,
      ResponseContentType extends BaseContentType,
      Outputs extends ReadonlyArray<
        OutputObject<ResponseBody, Status, ResponseContentType>
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
                Method,
                BaseContentType,
                unknown,
                BaseQuery,
                BaseParams,
                Options3,
                ResponseBody,
                Status,
                ResponseContentType,
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
              Method,
              BaseContentType,
              unknown,
              BaseQuery,
              BaseParams,
              Options2,
              ResponseBody,
              Status,
              ResponseContentType,
              Outputs
            >
          ) => createOperation({ outputs, middleware1, middleware2, handler })
        }),
        handler: (
          handler: TypedApiRouteHandler<
            Method,
            BaseContentType,
            unknown,
            BaseQuery,
            BaseParams,
            Options1,
            ResponseBody,
            Status,
            ResponseContentType,
            Outputs
          >
        ) => createOperation({ outputs, middleware1, handler })
      }),
      handler: (
        handler: TypedApiRouteHandler<
          Method,
          BaseContentType,
          unknown,
          BaseQuery,
          BaseParams,
          BaseOptions,
          ResponseBody,
          Status,
          ResponseContentType,
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
            handler: TypedApiRouteHandler<
              Method,
              BaseContentType,
              unknown,
              BaseQuery,
              BaseParams,
              Options3
            >
          ) =>
            createOperation({ middleware1, middleware2, middleware3, handler })
        }),
        handler: (
          handler: TypedApiRouteHandler<
            Method,
            BaseContentType,
            unknown,
            BaseQuery,
            BaseParams,
            Options2
          >
        ) => createOperation({ middleware1, middleware2, handler })
      }),
      handler: (
        handler: TypedApiRouteHandler<
          Method,
          BaseContentType,
          unknown,
          BaseQuery,
          BaseParams,
          Options1
        >
      ) => createOperation({ middleware1, handler })
    }),
    handler: (handler: TypedApiRouteHandler) => createOperation({ handler })
  };
};
