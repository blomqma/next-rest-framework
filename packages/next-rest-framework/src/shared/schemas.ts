import { type OpenAPIV3_1 } from 'openapi-types';
import { z, type ZodType, type ZodTypeAny } from 'zod';
import { type zfd } from 'zod-form-data';
import chalk from 'chalk';

const isZodSchema = (schema: unknown): schema is ZodTypeAny =>
  !!schema && typeof schema === 'object' && '_def' in schema;

const isZodObjectSchema = (schema: unknown): schema is z.ZodObject<any> =>
  schema instanceof z.ZodObject;

const zodSchemaValidator = <T>({
  schema,
  obj
}: {
  schema: ZodType<T>;
  obj: unknown;
}):
  | { valid: true; errors: null; data: T }
  | { valid: false; errors: z.ZodIssue[]; data: null } => {
  const result = schema.safeParse(obj);

  if (result.success) {
    return {
      valid: true,
      errors: null,
      data: result.data
    };
  }

  return {
    valid: false,
    errors: result.error.issues,
    data: null
  };
};

export const validateSchema = <T>({
  schema,
  obj
}: {
  schema: ZodType<T> | typeof zfd.formData;
  obj: unknown;
}):
  | { valid: true; errors: null; data: T }
  | { valid: false; errors: z.ZodIssue[]; data: null } => {
  if (isZodSchema(schema)) {
    return zodSchemaValidator({ schema, obj });
  }

  throw Error('Invalid schema.');
};

type SchemaType = 'input-params' | 'input-query' | 'input-body' | 'output-body';

export const getJsonSchema = ({
  schema,
  operationId,
  type
}: {
  schema: ZodType;
  operationId: string;
  type: SchemaType;
}): OpenAPIV3_1.SchemaObject => {
  if (isZodSchema(schema)) {
    try {
      // For input schemas, use 'input' to get what the API accepts (before transformations)
      // For output schemas, use 'output' to get what the API returns (after transformations)
      const io = type === 'output-body' ? 'output' : 'input';

      // Descriptions are deliberately NOT routed through a local registry.
      //
      // This used to build a local registry via a `registerDescriptions` walk and pass it as
      // `metadata`, citing https://github.com/colinhacks/zod/issues/4145. That issue is about
      // `.meta({ id })` collisions ("ID x already exists in the registry"), which are thrown by
      // `registry.add` in *user* code -- a local registry in here cannot prevent them. Meanwhile
      // the option did real damage: `metadata` REPLACES the registry `toJSONSchema` reads, so any
      // description the walk missed was dropped, and `.describe()` writes to `z.globalRegistry`.
      //
      // The walk only descended `ZodObject.shape` and `ZodArray.element`, so it stopped dead at
      // every wrapper -- `.default()`, `.optional()`, `.nullish()`, unions, records. A field like
      // `z.array(z.object({ data: nodeData.nullish() })).default([])` lost every nested
      // description, silently, while the properties themselves came through: the spec looked
      // complete and was not.
      //
      // Omitting `metadata` lets zod read its global registry, which is exactly where
      // `.describe()` puts things.
      return z.toJSONSchema(schema, {
        target: 'openapi-3.0',
        unrepresentable: 'any', // Allow unrepresentable types (date, bigint, etc.) to be converted to {}
        io
      }) as OpenAPIV3_1.SchemaObject;
    } catch (error) {
      const solutions: Record<SchemaType, string> = {
        'input-params': 'paramsSchema',
        'input-query': 'querySchema',
        'input-body': 'bodySchema',
        'output-body': 'bodySchema'
      };

      console.warn(
        chalk.yellowBright(
          `
Warning: ${type} schema for operation ${operationId} could not be converted to a JSON schema. The OpenAPI spec may not be accurate.
Error: ${error instanceof Error ? error.message : String(error)}
This is most likely related to Zod v4's toJSONSchema() limitations or an issue with the schema structure.
Please consider using the ${
            solutions[type]
          } property in addition to the Zod schema.`
        )
      );

      return {};
    }
  }

  throw Error('Invalid schema.');
};

export const getSchemaKeys = ({ schema }: { schema: ZodType }) => {
  if (isZodObjectSchema(schema)) {
    return Object.keys(schema.shape);
  }

  throw Error('Invalid schema.');
};
