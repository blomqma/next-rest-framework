import { type OpenAPIV3_1 } from 'openapi-types';
import { z, type ZodType, type ZodTypeAny } from 'zod';
import { type zfd } from 'zod-form-data';
import chalk from 'chalk';

const isZodSchema = (schema: unknown): schema is ZodTypeAny =>
  !!schema && typeof schema === 'object' && '_def' in schema;

const isZodObjectSchema = (schema: unknown): schema is z.ZodObject<any> =>
  schema instanceof z.ZodObject;

const isZodArraySchema = (
  schema: ZodTypeAny
): schema is z.ZodArray<ZodTypeAny> => schema instanceof z.ZodArray;

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

// Helper function to register descriptions in a local Zod registry
const registerDescriptions = (
  schema: ZodTypeAny,
  registry: z.core.$ZodRegistry<{ description?: string }>
): void => {
  // Register description for the schema itself
  if (schema.description) {
    registry.add(schema, { description: schema.description });
  }

  // For object schemas, register descriptions for each property
  if (isZodObjectSchema(schema)) {
    Object.values(schema.shape as Record<string, ZodTypeAny>).forEach(
      (propSchema) => {
        registerDescriptions(propSchema, registry);
      }
    );
  }

  // For array schemas, register description for the element type
  if (isZodArraySchema(schema)) {
    registerDescriptions(schema.element, registry);
  }
};

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
      // Create a local registry to avoid global registry conflicts (see: https://github.com/colinhacks/zod/issues/4145)
      const localRegistry = z.core.registry<{ description?: string }>();

      // Register descriptions in the local registry so toJSONSchema can access them
      registerDescriptions(schema, localRegistry);

      // For input schemas, use 'input' to get what the API accepts (before transformations)
      // For output schemas, use 'output' to get what the API returns (after transformations)
      const io = type === 'output-body' ? 'output' : 'input';

      return z.toJSONSchema(schema, {
        target: 'openapi-3.0',
        unrepresentable: 'any', // Allow unrepresentable types (date, bigint, etc.) to be converted to {}
        io,
        metadata: localRegistry
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
