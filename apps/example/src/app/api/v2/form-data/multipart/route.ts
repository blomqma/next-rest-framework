import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { multipartFormSchema } from '@/utils';
import { z } from 'zod';

export const runtime = 'edge';

export const { POST } = route({
  multipartFormData: routeOperation({
    method: 'POST'
  })
    .input({
      contentType: 'multipart/form-data',
      body: multipartFormSchema, // A zod-form-data schema is required.
      // The binary file cannot described with a Zod schema so we define it by hand for the OpenAPI spec.
      bodySchema: {
        description: 'Test form description.',
        type: 'object',
        properties: {
          text: {
            type: 'string'
          },
          file: {
            type: 'string',
            format: 'binary'
          }
        }
      }
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/octet-stream',
        body: z.custom<File>(),
        // The binary file cannot described with a Zod schema so we define it by hand for the OpenAPI spec.
        bodySchema: {
          description: 'File response.',
          type: 'string',
          format: 'binary'
        }
      }
    ])
    .handler(async (req) => {
      // const json = await req.json(); // Form can also be parsed as JSON.
      const formData = await req.formData();
      const file = formData.get('file');

      return new TypedNextResponse(file, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${file.name}"`
        }
      });
    })
});
