const path = require('path');

module.exports = {
  root: true,
  extends: ['standard-with-typescript', 'prettier'],
  parserOptions: {
    project: [
      path.resolve(__dirname, './packages/next-rest-framework/tsconfig.json'),
      path.resolve(__dirname, './apps/example/tsconfig.json'),
      path.resolve(__dirname, './docs/tsconfig.json')
    ]
  },
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off'
  }
};
