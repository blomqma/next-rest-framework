import { NextRestFramework } from 'next-rest-framework';

export const { defineCatchAllHandler, defineEndpoints } = NextRestFramework({
  middleware: () => ({ foo: 'foo', bar: 'bar', baz: 'baz' })
});
