import {
  compileEndpoints,
  syncOpenApiSpecFromBuild,
  clearTmpFolder
} from 'next-rest-framework/generate';

async function main() {
  try {
    await compileEndpoints({
      buildOptions: {
        external: ['jsdom']
      }
    });

    console.info('Generating OpenAPI spec...');

    await syncOpenApiSpecFromBuild({});
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  await clearTmpFolder();
}

main()
  .then(() => {
    console.log('Completed building OpenAPI schema from custom script');
  })
  .catch(console.error);
