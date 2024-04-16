import { apiRoute, apiRouteOperation } from 'next-rest-framework';
import { JSDOM } from 'jsdom';
import { z } from 'zod';

export default apiRoute({
  routeWithExternalDep: apiRouteOperation({
    method: 'GET'
  })
    .outputs([
      {
        contentType: 'text/html',
        status: 200,
        body: z.string()
      }
    ])
    .handler((_req, res) => {
      const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>');
      res.setHeader('Content-Type', 'text/html');
      res.send(dom.serialize());
    })
});
