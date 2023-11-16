import { type OpenAPIV3_1 } from 'openapi-types';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { type AnyZodObject, type ZodSchema } from 'zod';

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
    errors
  };
};

export const validateSchema = async ({
  schema,
  obj
}: {
  schema: ZodSchema;
  obj: unknown;
}) => {
  if (isZodSchema(schema)) {
    return zodSchemaValidator({ schema, obj });
  }

  throw Error('Invalid schema.');
};

export const getJsonSchema = ({
  schema
}: {
  schema: ZodSchema;
}): OpenAPIV3_1.SchemaObject => {
  if (isZodSchema(schema)) {
    return zodToJsonSchema(schema, {
      target: 'openApi3'
    });
  }

  throw Error('Invalid schema.');
};

export const getSchemaKeys = ({ schema }: { schema: ZodSchema }) => {
  if (isZodObjectSchema(schema)) {
    return Object.keys(schema._def.shape());
  }

  throw Error('Invalid schema.');
};
