import { NextRestFramework } from 'next-rest-framework';

export const { defineCatchAllHandler, defineEndpoints } = NextRestFramework({
  apiRoutesPath: 'src/pages/api',
  middleware: () => ({ foo: 'foo', bar: 'bar', baz: 'baz' })
});
