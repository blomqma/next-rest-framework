import { generate } from 'next-rest-framework/dist/cli/generate';

generate({ configPath: '/api/v2' })
  .then(() => {
    console.log('Completed building OpenAPI schema from custom script.');
  })
  .catch(console.error);
