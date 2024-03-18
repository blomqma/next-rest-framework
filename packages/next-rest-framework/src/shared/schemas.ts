import { type OpenAPIV3_1 } from 'openapi-types';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { type AnyZodObject, type ZodSchema } from 'zod';
import { type zfd } from 'zod-form-data';
import chalk from 'chalk';

const isZodSchema = (schema: unknown): schema is ZodSchema =>
  !!schema && typeof schema === 'object' && '_def' in schema;

const isZodObjectSchema = (schema: unknown): schema is AnyZodObject =>
  isZodSchema(schema) && 'shape' in schema;

const zodSchemaValidator = ({
  schema,
  obj
}: {
  schema: ZodSchema;
  obj: unknown;
}) => {
  const data = schema.safeParse(obj);
  const errors = !data.success ? data.error.issues : null;

  return {
    valid: data.success,
    errors,
    data: data.success ? data.data : null
  };
};

export const validateSchema = ({
  schema,
  obj
}: {
  schema: ZodSchema | typeof zfd.formData;
  obj: unknown;
}) => {
  if (isZodSchema(schema)) {
    return zodSchemaValidator({ schema, obj });
  }

  throw Error('Invalid schema.');
};

type SchemaType = 'input-body' | 'input-query' | 'output-body';

export const getJsonSchema = ({
  schema,
  operationId,
  type
}: {
  schema: ZodSchema;
  operationId: string;
  type: SchemaType;
}): OpenAPIV3_1.SchemaObject => {
  if (isZodSchema(schema)) {
    try {
      return zodToJsonSchema(schema, {
        $refStrategy: 'none',
        target: 'openApi3'
      });
    } catch (error) {
      const solutions: Record<SchemaType, string> = {
        'input-body': 'bodySchema',
        'input-query': 'querySchema',
        'output-body': 'bodySchema'
      };

      console.warn(
        chalk.yellowBright(
          `
Warning: ${type} schema for operation ${operationId} could not be converted to a JSON schema. The OpenAPI spec may not be accurate.
This is most likely related to an issue with the \`zod-to-json-schema\`: https://github.com/StefanTerdell/zod-to-json-schema?tab=readme-ov-file#known-issues
Please consider using the ${solutions[type]} property in addition to the Zod schema.`
        )
      );

      return {};
    }
  }

  throw Error('Invalid schema.');
};

export const getSchemaKeys = ({ schema }: { schema: ZodSchema }) => {
  if (isZodObjectSchema(schema)) {
    return Object.keys(schema._def.shape());
  }

  throw Error('Invalid schema.');
};
