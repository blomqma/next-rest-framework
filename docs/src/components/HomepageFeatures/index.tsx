import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import TypeSafe from '@site/static/img/type-safe.svg';
import SelfDocumenting from '@site/static/img/self-documenting.svg';
import Lightweight from '@site/static/img/lightweight.svg';
import EasyToUse from '@site/static/img/easy-to-use.svg';
import Reuse from '@site/static/img/reuse.svg';
import Extendable from '@site/static/img/extendable.svg';

interface FeatureItem {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
}

const FEATURE_LIST: FeatureItem[] = [
  {
    title: 'Type-safe',
    Svg: TypeSafe,
    description: (
      <>
        No more untyped API calls. The automatic type-inference from
        object-schemas provide a type-safe API and all the benefits of
        TypeScript.
      </>
    )
  },
  {
    title: 'Self-documenting',
    Svg: SelfDocumenting,
    description: (
      <>
        The auto-generated OpenAPI documentation provides a self-documenting API
        and a great developer experience. No more endless JSDoc-annotations or
        manual API specification.
      </>
    )
  },
  {
    title: 'Lightweight',
    Svg: Lightweight,
    description: (
      <>
        Next REST Framework ships with minimal dependencies and is designed to
        be lightweight and performant.
      </>
    )
  },
  {
    title: 'Easy to use',
    Svg: EasyToUse,
    description: (
      <>
        You can get started with a very minimal configuration while still
        enjoying all the benefits of Next REST Framework.
      </>
    )
  },
  {
    title: 'Reuse validation logic',
    Svg: Reuse,
    description: (
      <>
        With Next REST Framework you can reuse your validation logic in your API
        and in your frontend. Simply plug in your object-schemas and you are
        good to go.
      </>
    )
  },
  {
    title: 'Extendable',
    Svg: Extendable,
    description: (
      <>
        Next REST Framework won't break any of your existing API routes. The API
        is designed to be customizable and extendable.
      </>
    )
  }
];

const Feature = ({ title, Svg, description }: FeatureItem) => (
  <div className={clsx('col col--4')}>
    <div className="text--center">
      <Svg className={styles.featureSvg} role="img" />
    </div>
    <div className="text--center padding--md">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </div>
);

export const HomepageFeatures = () => (
  <section className={styles.features}>
    <div className="container">
      <div className="row">
        {FEATURE_LIST.map((props, idx) => (
          <Feature key={idx} {...props} />
        ))}
      </div>
    </div>
  </section>
);
