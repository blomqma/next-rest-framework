import { defineRoute } from './define-route';
import { type NextRestFrameworkConfig } from './types';
import { getConfig } from './utils';
import { defineApiRoute } from './define-api-route';
import { defineCatchAllRoute } from './define-catch-all-route';
import { defineCatchAllApiRoute } from './define-catch-all-api-route';

export const NextRestFramework = (_config?: NextRestFrameworkConfig) => {
  const config = getConfig(_config);

  return {
    defineCatchAllRoute: defineCatchAllRoute({ config }),
    defineCatchAllApiRoute: defineCatchAllApiRoute({ config }),
    defineRoute: defineRoute({ config }),
    defineApiRoute: defineApiRoute({ config })
  };
};
