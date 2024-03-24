import { formSchema } from '@/utils';
import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';

export const runtime = 'edge';

export const { POST } = route({
  urlEncodedFormData: routeOperation({
    method: 'POST'
  })
    .input({
      contentType: 'application/x-www-form-urlencoded',
      body: formSchema // A zod-form-data schema is required.
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/octet-stream',
        body: formSchema
      }
    ])
    .handler(async (req) => {
      const { text } = await req.json();
      // const formData = await req.formData(); // Form can also be parsed as form data.

      // Type-checked response.
      return TypedNextResponse.json({
        text
      });
    })
});
