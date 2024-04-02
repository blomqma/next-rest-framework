import { formSchema } from '@/utils';
import { apiRoute, apiRouteOperation } from 'next-rest-framework';

export default apiRoute({
  urlEncodedFormData: apiRouteOperation({
    method: 'POST'
  })
    .input({
      contentType: 'application/x-www-form-urlencoded',
      body: formSchema.describe('Test form description.') // A zod-form-data schema is required.
    })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: formSchema.describe('Test form response.')
      }
    ])
    .handler((req, res) => {
      const formData = req.body;

      res.json({
        text: formData.get('text')
      });
    })
});
