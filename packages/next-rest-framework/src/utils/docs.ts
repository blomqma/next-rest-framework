import { type NextRestFrameworkConfig } from '../types';

export const getHtmlForDocs = ({
  config: {
    openApiJsonPath,
    docsConfig: { title, description, faviconUrl, logoUrl } = {}
  },
  baseUrl
}: {
  config: NextRestFrameworkConfig;
  baseUrl: string;
}) => {
  const url = `${baseUrl}${openApiJsonPath}`;

  return `<!DOCTYPE html>
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
      <style>
        body {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <redoc spec-url="${url}"></redoc>
      <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    </body>
  </html>`;
};
