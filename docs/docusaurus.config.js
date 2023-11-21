// @ts-check

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const EDIT_URL =
  'https://github.com/blomqma/next-rest-framework/tree/main/docs';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Next REST Framework',
  tagline: 'Type-safe, self-documenting APIs for Next.js',
  url: 'https://next-rest-framework.vercel.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'blomqma',
  projectName: 'next-rest-framework',
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: EDIT_URL
        },
        blog: {
          showReadingTime: true,
          editUrl: EDIT_URL
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        }
      })
    ]
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false
      },
      navbar: {
        style: 'dark',
        title: 'Next REST Framework',
        logo: {
          alt: 'Next REST Framework logo',
          src: 'img/logo.svg'
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Docs'
          },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://next-rest-framework-demo.vercel.app',
            label: 'Live demo',
            position: 'left'
          },
          {
            href: 'https://github.com/blomqma/next-rest-framework',
            label: 'GitHub',
            position: 'right'
          }
        ]
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Intro',
                to: '/docs/intro'
              },
              {
                label: 'Getting started',
                to: '/docs/getting-started'
              }
            ]
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog'
              },
              {
                label: 'GitHub',
                href: 'https://github.com/blomqma/next-rest-framework'
              }
            ]
          }
        ],
        copyright: `Next REST Framework © ${new Date().getFullYear()}`
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme
      }
    })
};

module.exports = config;
