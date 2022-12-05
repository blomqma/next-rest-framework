import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { HomepageFeatures } from '@site/src/components/HomepageFeatures';
import styles from './index.module.css';

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={siteConfig.title}
      description="Type-safe, self-documenting REST APIs for Next.js"
    >
      <header className="hero hero--dark">
        <div className="container">
          <div className={clsx(styles.textCenter, 'row')}>
            <div className="col col-6">
              <img
                src="img/logo.svg"
                alt="Next REST Framework logo"
                className={clsx(styles.heroLogo)}
              />
              <h1 className="hero__title">{siteConfig.title}</h1>
              <p className="hero__subtitle">{siteConfig.tagline}</p>
              <div className={styles.buttons}>
                <Link
                  className="button button--primary button--lg"
                  to="/docs/intro"
                >
                  Get started
                </Link>
                <Link
                  className="button button--secondary button--lg"
                  to="https://github.com/blomqma/next-rest-framework"
                  target="_blank"
                >
                  See GitHub
                </Link>
              </div>
            </div>
            <div className="col col-6">
              <img
                src="next-rest-framework-demo.gif"
                alt="Next REST Framework demo"
                className={clsx(styles.heroDemo, 'margin-vert--lg')}
              />
            </div>
          </div>
        </div>
      </header>
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
