import { TypedNextResponse, route, routeOperation } from 'next-rest-framework';
import { JSDOM } from 'jsdom';
import { z } from 'zod';

export const { GET } = route({
  routeWithExternalDep: routeOperation({
    method: 'GET'
  })
    .outputs([
      {
        contentType: 'text/html',
        status: 200,
        body: z.string()
      }
    ])
    .handler(() => {
      const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>');

      return new TypedNextResponse(dom.serialize(), {
        headers: { 'Content-Type': 'text/html' }
      });
    })
});
