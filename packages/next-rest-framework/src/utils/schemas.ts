import { type OpenAPIV3_1 } from 'openapi-types';
import {
  type ZodAny,
  type ZodArray,
  type ZodBigInt,
  type ZodBoolean,
  type ZodDate,
  type ZodEnum,
  type ZodIntersection,
  type ZodLiteral,
  type ZodMap,
  type ZodNaN,
  type ZodNativeEnum,
  type ZodNull,
  type ZodNullable,
  type ZodNumber,
  type ZodOptional,
  type ZodRecord,
  type ZodSchema,
  type ZodSet,
  type ZodString,
  type ZodSymbol,
  type ZodTuple,
  type ZodUndefined,
  type ZodUnion,
  type ZodUnknown,
  type ZodVoid,
  type ZodObject,
  type ZodNever,
  type ZodTypeAny
} from 'zod';
import { type BaseObjectSchemaType, type BaseSchemaType } from '../types';
import chalk from 'chalk';

export const isZodSchema = (schema: unknown): schema is ZodSchema =>
  !!schema && typeof schema === 'object' && '_def' in schema;

const zodSchemaValidator = ({
  schema,
  obj
}: {
  schema: ZodSchema;
  obj: unknown;
}) => {
  const data = schema.safeParse(obj);

  const errors = !data.success
    ? data.error.issues.map(({ message }) => message)
    : null;

  return {
    valid: data.success,
    errors
  };
};

const zodTypeGuards = {
  string: (schema: ZodTypeAny): schema is ZodString =>
    schema._def.typeName === 'ZodString',
  symbol: (schema: ZodTypeAny): schema is ZodSymbol =>
    schema._def.typeName === 'ZodSymbol',
  date: (schema: ZodTypeAny): schema is ZodDate =>
    schema._def.typeName === 'ZodDate',
  number: (schema: ZodTypeAny): schema is ZodNumber =>
    schema._def.typeName === 'ZodNumber',
  bigint: (schema: ZodTypeAny): schema is ZodBigInt =>
    schema._def.typeName === 'ZodBigInt',
  boolean: (schema: ZodTypeAny): schema is ZodBoolean =>
    schema._def.typeName === 'ZodBoolean',
  undefined: (schema: ZodTypeAny): schema is ZodUndefined =>
    schema._def.typeName === 'ZodUndefined',
  null: (schema: ZodTypeAny): schema is ZodNull =>
    schema._def.typeName === 'ZodNull',
  void: (schema: ZodTypeAny): schema is ZodVoid =>
    schema._def.typeName === 'ZodVoid',
  nan: (schema: ZodTypeAny): schema is ZodNaN =>
    schema._def.typeName === 'ZodNaN',
  never: (schema: ZodTypeAny): schema is ZodNever =>
    schema._def.typeName === 'ZodNever',
  any: (schema: ZodTypeAny): schema is ZodAny =>
    schema._def.typeName === 'ZodAny',
  unknown: (schema: ZodTypeAny): schema is ZodUnknown =>
    schema._def.typeName === 'ZodUnknown',
  literal: (schema: ZodTypeAny): schema is ZodLiteral<any> =>
    schema._def.typeName === 'ZodLiteral',
  enum: (schema: ZodTypeAny): schema is ZodEnum<any> =>
    schema._def.typeName === 'ZodEnum',
  nativeEnum: (schema: ZodTypeAny): schema is ZodNativeEnum<any> =>
    schema._def.typeName === 'ZodNativeEnum',
  optional: (schema: ZodTypeAny): schema is ZodOptional<any> =>
    schema._def.typeName === 'ZodOptional',
  nullable: (schema: ZodTypeAny): schema is ZodNullable<any> =>
    schema._def.typeName === 'ZodNullable',
  array: (schema: ZodTypeAny): schema is ZodArray<any> =>
    schema._def.typeName === 'ZodArray',
  object: (schema: ZodTypeAny): schema is ZodObject<any> =>
    schema._def.typeName === 'ZodObject',
  union: (schema: ZodTypeAny): schema is ZodUnion<any> =>
    schema._def.typeName === 'ZodUnion',
  discriminatedUnion: (schema: ZodTypeAny): schema is ZodUnion<any> =>
    schema._def.typeName === 'ZodDiscriminatedUnion',
  intersection: (schema: ZodTypeAny): schema is ZodIntersection<any, any> =>
    schema._def.typeName === 'ZodIntersection',
  tuple: (schema: ZodTypeAny): schema is ZodTuple<any> =>
    schema._def.typeName === 'ZodTuple',
  record: (schema: ZodTypeAny): schema is ZodRecord<any> =>
    schema._def.typeName === 'ZodRecord',
  map: (schema: ZodTypeAny): schema is ZodMap<any> =>
    schema._def.typeName === 'ZodMap',
  set: (schema: ZodTypeAny): schema is ZodSet<any> =>
    schema._def.typeName === 'ZodSet'
};

export const convertZodSchema = (
  schema: ZodSchema
): Record<string, unknown> => {
  if (zodTypeGuards.string(schema) || zodTypeGuards.symbol(schema)) {
    return {
      type: 'string'
    };
  }

  if (zodTypeGuards.date(schema)) {
    return {
      type: 'string',
      format: 'date-time'
    };
  }

  if (zodTypeGuards.number(schema) || zodTypeGuards.bigint(schema)) {
    return {
      type: 'number'
    };
  }

  if (zodTypeGuards.boolean(schema)) {
    return {
      type: 'boolean'
    };
  }

  if (
    zodTypeGuards.undefined(schema) ||
    zodTypeGuards.null(schema) ||
    zodTypeGuards.void(schema) ||
    zodTypeGuards.nan(schema) ||
    zodTypeGuards.never(schema)
  ) {
    return {
      type: 'null'
    };
  }

  if (zodTypeGuards.any(schema) || zodTypeGuards.unknown(schema)) {
    return {};
  }

  if (zodTypeGuards.literal(schema)) {
    return {
      type: 'string',
      enum: [schema._def.value]
    };
  }

  if (zodTypeGuards.enum(schema)) {
    return {
      enum: schema._def.values
    };
  }

  if (zodTypeGuards.nativeEnum(schema)) {
    return {
      enum: Object.values(schema._def.values)
    };
  }

  if (zodTypeGuards.optional(schema) || zodTypeGuards.nullable(schema)) {
    return {
      type: [convertZodSchema(schema._def.innerType).type, 'null']
    };
  }

  if (zodTypeGuards.object(schema)) {
    const jsonSchema: {
      type: 'object';
      properties: Record<string, unknown>;
      additionalProperties?: Record<string, unknown>;
    } = {
      type: 'object',
      properties: Object.entries(schema._def.shape()).reduce(
        (properties: Record<string, any>, [key, val]) => ({
          ...properties,
          [key]: convertZodSchema(val as ZodSchema)
        }),
        {}
      )
    };

    const hasAdditionalProperties =
      schema._def.catchall._def.typeName === 'ZodNever';

    if (!hasAdditionalProperties) {
      jsonSchema.additionalProperties = convertZodSchema(schema._def.catchall);
    }

    return jsonSchema;
  }

  if (zodTypeGuards.array(schema)) {
    return {
      type: 'array',
      items: convertZodSchema(schema._def.type)
    };
  }

  if (zodTypeGuards.tuple(schema)) {
    return {
      type: 'array',
      items: schema._def.items.map((val: ZodSchema) => convertZodSchema(val))
    };
  }

  if (zodTypeGuards.union(schema)) {
    return {
      anyOf: schema._def.options.map((option: ZodSchema) =>
        convertZodSchema(option)
      )
    };
  }

  if (zodTypeGuards.discriminatedUnion(schema)) {
    return {
      oneOf: schema._def.options.map((option: ZodSchema) =>
        convertZodSchema(option)
      )
    };
  }

  if (zodTypeGuards.record(schema) || zodTypeGuards.map(schema)) {
    return {
      type: 'object',
      additionalProperties: convertZodSchema(schema._def.valueType)
    };
  }

  if (zodTypeGuards.set(schema)) {
    return {
      type: 'array',
      items: convertZodSchema(schema._def.valueType),
      uniqueItems: true
    };
  }

  if (zodTypeGuards.intersection(schema)) {
    return {
      allOf: [
        convertZodSchema(schema._def.left),
        convertZodSchema(schema._def.right)
      ]
    };
  }

  if (process.env.NODE_ENV !== 'production' && 'typeName' in schema._def) {
    console.warn(
      chalk.yellowBright(
        `Warning: Next REST Framework detected an unsupported schema type for schema: ${schema._def.typeName}

If you think this schema type should be supported, please open an issue at: https://github.com/blomqma/next-rest-framework/issues`
      )
    );
  }

  return {};
};

export const validateSchema = async ({
  schema,
  obj
}: {
  schema: BaseSchemaType;
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
  schema: BaseSchemaType;
}): OpenAPIV3_1.SchemaObject => {
  if (isZodSchema(schema)) {
    return convertZodSchema(schema);
  }

  throw Error('Invalid schema.');
};

export const getSchemaKeys = ({ schema }: { schema: BaseObjectSchemaType }) => {
  if (isZodSchema(schema)) {
    return Object.keys(schema._def.shape());
  }

  throw Error('Invalid schema.');
};
