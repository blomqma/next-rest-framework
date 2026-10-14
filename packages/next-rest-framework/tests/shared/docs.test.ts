import { getConfig, getHtmlForDocs } from '../../src/shared';

describe('shared/docs', () => {
  describe('getHtmlForDocs', () => {
    const getRedocHtml = (disableTelemetry?: boolean) =>
      getHtmlForDocs({
        config: getConfig({
          docsConfig: { provider: 'redoc', disableTelemetry }
        }),
        host: 'localhost:3000'
      });

    it('loads a pinned Redoc version as an ES module', () => {
      const html = getRedocHtml();

      expect(html).toContain('<script type="module">');
      expect(html).toMatch(
        /import { init } from "https:\/\/cdn\.redoc\.ly\/redoc\/v\d+\.\d+\.\d+\/bundles\/redoc\.standalone\.js";/
      );
      expect(html).not.toContain('Redoc.init');
    });

    it.each([
      [undefined, '{}'],
      [true, '{"disableTelemetry":true}']
    ])('passes disableTelemetry %s to Redoc', (disableTelemetry, options) => {
      expect(getRedocHtml(disableTelemetry)).toContain(
        `init(spec, ${options}, document.getElementById('redoc'));`
      );
    });
  });
});
