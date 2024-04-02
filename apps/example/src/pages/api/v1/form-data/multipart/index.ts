import { multipartFormSchema } from '@/utils';
import { z } from 'zod';
import { apiRoute, apiRouteOperation } from 'next-rest-framework';

// Body parser must be disabled when parsing multipart/form-data requests with pages router.
export const config = {
  api: {
    bodyParser: false
  }
};

export default apiRoute({
  multipartFormData: apiRouteOperation({
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
    .handler(async (req, res) => {
      const formData = req.body;
      const file = formData.get('file');
      const reader = file.stream().getReader();
      res.setHeader('Content-Type', 'application/octet-stream');

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.name}"`
      );

      const pump = async () => {
        await reader.read().then(async ({ done, value }) => {
          if (done) {
            res.end();
            return;
          }

          res.write(value);
          await pump();
        });
      };

      await pump();
    })
});
