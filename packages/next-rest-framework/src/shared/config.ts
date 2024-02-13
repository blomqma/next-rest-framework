import { merge } from 'lodash';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_FAVICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_OG_TYPE,
  DEFAULT_TITLE,
  HOMEPAGE,
  VERSION
} from '../constants';
import { type NextRestFrameworkConfig } from '../types';

export const DEFAULT_CONFIG: Required<NextRestFrameworkConfig> = {
  deniedPaths: [],
  allowedPaths: ['**'],
  openApiObject: {
    info: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      version: `v${VERSION}`
    }
  },
  openApiJsonPath: '/openapi.json',
  docsConfig: {
    provider: 'redoc',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    faviconUrl: DEFAULT_FAVICON_URL,
    logoUrl: DEFAULT_LOGO_URL,
    ogConfig: {
      title: DEFAULT_TITLE,
      type: DEFAULT_OG_TYPE,
      url: HOMEPAGE,
      imageUrl: DEFAULT_LOGO_URL
    }
  },
  suppressInfo: false
};

export const getConfig = (config?: NextRestFrameworkConfig) =>
  merge({}, DEFAULT_CONFIG, config);
