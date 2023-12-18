import {
  DEFAULT_DESCRIPTION,
  DEFAULT_FAVICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_TITLE
} from '../constants';
import { type NextRestFrameworkConfig } from '../types';

export const getHtmlForDocs = ({
  config: {
    openApiJsonPath,
    openApiObject,
    docsConfig: {
      provider,
      title = openApiObject?.info?.title ?? DEFAULT_TITLE,
      description = openApiObject?.info?.description ?? DEFAULT_DESCRIPTION,
      faviconUrl = DEFAULT_FAVICON_URL,
      logoUrl = DEFAULT_LOGO_URL
    }
  },
  host
}: {
  config: Required<NextRestFrameworkConfig>;
  host: string;
}) => {
  const url = `//${host}${openApiJsonPath}`; // Use protocol-relative URL to avoid mixed content warnings.

  const redocHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta
      name="description"
      content="${description}"
    />
    <link rel="icon" type="image/x-icon" href="${faviconUrl}">
    <link
      href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="redoc"></div>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script>
      window.onload = () => {
        fetch('${url}')
          .then(res => res.json())
          .then(spec => {
            spec.info['title'] = "${title}";
            spec.info['description'] = "${description}";
            spec.info['x-logo'] = { url: "${logoUrl}" };
            Redoc.init(spec, {}, document.getElementById('redoc'));
          });
      };
    </script>
  </body>
</html>`;

  const swaggerUiHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta
      name="description"
      content="${description}"
    />
    <link rel="icon" type="image/x-icon" href="${faviconUrl}">
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
    <style>
      .topbar-wrapper img {
        content:url('${logoUrl}');
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.onload = () => {
        fetch('${url}')
          .then(res => res.json())
          .then(spec => {
            spec.info['title'] = "${title}";
            spec.info['description'] = "${description}";

            window.ui = SwaggerUIBundle({
              spec,
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: 'StandaloneLayout',
              deepLinking: true,
              displayOperationId: true,
              displayRequestDuration: true,
              filter: true
            });
          });
      };
    </script>
  </body>
</html>`;

  if (provider === 'swagger-ui') {
    return swaggerUiHtml;
  }

  return redocHtml;
};
