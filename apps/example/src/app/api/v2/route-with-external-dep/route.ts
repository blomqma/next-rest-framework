import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { z } from 'zod';
import { JSDOM } from 'jsdom';

export const runtime = 'edge';

export const { GET } = route({
  getDomInfo: routeOperation({
    method: 'GET'
  })
    .outputs([
      {
        status: 200,
        contentType: 'application/json',
        body: z.object({ html: z.string() })
      }
    ])
    .handler(() => {
      const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>');

      return TypedNextResponse.json({
        html: dom.serialize()
      });
    })
});
