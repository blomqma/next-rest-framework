import * as zod from 'zod';
import { DEFAULT_ERRORS, ValidMethod } from './constants';
import { DefineEndpointsParams, NextRestFrameworkConfig } from './types';
import { defineEndpoints } from './define-endpoints';
import { NextApiResponse } from 'next';

export const defineCatchAllHandler =
  <GlobalMiddlewareResponse>({
    config
  }: {
    config: NextRestFrameworkConfig<GlobalMiddlewareResponse>;
  }) =>
  (methodHandlers?: DefineEndpointsParams) => {
    return defineEndpoints({ config, _warnAboutReservedPaths: false })({
      GET: {
        responses: [
          {
            description: 'Response for 404 fallback.',
            status: 404,
            contentType: 'application/json',
            schema: zod.object({
              message: zod.string()
            })
          }
        ],
        handler: async ({ req, res }) => {
          const methodHandlerExists =
            methodHandlers &&
            Object.values(ValidMethod).some((method) =>
              Object.keys(methodHandlers).includes(method)
            );

          if (methodHandlerExists) {
            await defineEndpoints({ config })(methodHandlers)(
              req,
              res as NextApiResponse
            );
          } else {
            res.status(404).json({ message: DEFAULT_ERRORS.notFound });
          }
        }
      }
    });
  };
