import {
  DEFAULT_DESCRIPTION,
  DEFAULT_FAVICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_OG_TYPE,
  DEFAULT_TITLE,
  HOMEPAGE
} from '../constants';
import { type NextRestFrameworkConfig } from '../types';

// Return HTML for Redoc or Swagger UI.
export const getHtmlForDocs = ({
  config: {
    openApiJsonPath,
    openApiObject,
    docsConfig: {
      provider,
      title = openApiObject?.info?.title ?? DEFAULT_TITLE,
      description = openApiObject?.info?.description ?? DEFAULT_DESCRIPTION,
      faviconUrl = DEFAULT_FAVICON_URL,
      logoUrl = DEFAULT_LOGO_URL,
      disableTelemetry,
      ogConfig: {
        title: ogTitle = title,
        type: ogType = DEFAULT_OG_TYPE,
        url: orgUrl = HOMEPAGE,
        imageUrl: ogImageUrl = DEFAULT_LOGO_URL
      } = {
        title: DEFAULT_TITLE,
        type: 'website',
        url: HOMEPAGE,
        imageUrl: DEFAULT_LOGO_URL
      }
    }
  },
  host
}: {
  config: Required<NextRestFrameworkConfig>;
  host: string;
}) => {
  const url = `//${host}${openApiJsonPath}`; // Use protocol-relative URL to avoid mixed content warnings.

  const htmlMetaTags = `<meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta
      name="description"
      content="${description}"
    />
    <link rel="icon" type="image/x-icon" href="${faviconUrl}">
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${orgUrl}" />
    <meta property="og:image" content="${ogImageUrl}" />`;

  const redocOptions = JSON.stringify({ disableTelemetry });

  const redocHtml = `<!DOCTYPE html>
<html>
  <head>
    ${htmlMetaTags}
  </head>
  <body>
    <div id="redoc"></div>
    <script type="module">
      import { init } from "https://cdn.redoc.ly/redoc/v3.0.1/bundles/redoc.standalone.js";
      const spec = await fetch('${url}').then(res => res.json());
      spec.info['title'] = "${title}";
      spec.info['description'] = "${description}";
      spec.info['x-logo'] = { url: "${logoUrl}" };
      init(spec, ${redocOptions}, document.getElementById('redoc'));
    </script>
  </body>
</html>`;

  const swaggerUiHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    ${htmlMetaTags}
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
