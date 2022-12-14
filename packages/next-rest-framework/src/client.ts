import { defineEndpoints } from './define-endpoints';
import { NextRestFrameworkConfig } from './types';
import merge from 'lodash.merge';
import { getDefaultConfig, logInitInfo } from './utils';

export const NextRestFramework = <GlobalMiddlewareResponse>(
  _config?: NextRestFrameworkConfig<GlobalMiddlewareResponse>
) => {
  const config = merge(getDefaultConfig({ config: _config }), _config);

  if (!config.suppressInfo) {
    logInitInfo({ config });
  }

  return {
    config,
    defineCatchAllHandler: defineEndpoints({
      config,
      _warnAboutReservedPaths: false,
      _returnNotFoundForMissingHandler: true
    }),
    defineEndpoints: defineEndpoints({ config })
  };
};
