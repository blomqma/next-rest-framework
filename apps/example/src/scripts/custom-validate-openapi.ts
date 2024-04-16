import { validate } from 'next-rest-framework/dist/cli/validate';

validate({ configPath: '/api/v2' })
  .then(() => {
    console.log('Completed validating OpenAPI schema from custom script.');
  })
  .catch(console.error);
