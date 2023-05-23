import { OpenAPIV3_1 } from 'openapi-types';
import {
  AnyZodObject,
  ZodArray,
  ZodBoolean,
  ZodDate,
  ZodEnum,
  ZodIntersection,
  ZodNullable,
  ZodNumber,
  ZodOptional,
  ZodRawShape,
  ZodSchema,
  ZodString,
  ZodTypeAny
} from 'zod';
import { BaseObjectSchemaType, BaseSchemaType } from '../types';

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

const isZodString = (schema: ZodTypeAny): schema is ZodString => {
  return schema._def.typeName === 'ZodString';
};

const isZodNumber = (schema: ZodTypeAny): schema is ZodNumber => {
  return schema._def.typeName === 'ZodNumber';
};

const isZodBoolean = (schema: ZodTypeAny): schema is ZodBoolean => {
  return schema._def.typeName === 'ZodBoolean';
};

const isZodArray = (schema: ZodTypeAny): schema is ZodArray<any> => {
  return schema._def.typeName === 'ZodArray';
};

const isZodObject = (schema: ZodTypeAny): schema is AnyZodObject => {
  return schema._def.typeName === 'ZodObject';
};

const isZodEnum = (schema: ZodTypeAny): schema is ZodEnum<any> => {
  return schema._def.typeName === 'ZodEnum';
};

const isZodNullable = (schema: ZodTypeAny): schema is ZodNullable<any> => {
  return schema._def.typeName === 'ZodNullable';
};

const isZodIntersection = (
  schema: ZodTypeAny
): schema is ZodIntersection<any, any> => {
  return schema._def.typeName === 'ZodIntersection';
};

const isZodDate = (schema: ZodTypeAny): schema is ZodDate => {
  return (
    schema._def.typeName === 'ZodDate' ||
    (schema._def.typeName === 'ZodString' &&
      schema._def.checks.filter((check: any) => check.kind === 'datetime')
        .length > 0)
  );
};

const isZodOptional = (schema: ZodTypeAny): schema is ZodOptional<any> => {
  return schema._def.typeName === 'ZodOptional';
};

export const convertZodSchema = (schema: ZodSchema) => {
  let jsonSchema = {};

  const convertZodShape = (shape: ZodRawShape) => {
    const jsonSchema: OpenAPIV3_1.SchemaObject = {};

    Object.entries(shape).forEach(([key, value]) => {
      if (isZodString(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'string'
        };
      }

      if (isZodNumber(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'number'
        };
      }

      if (isZodBoolean(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'boolean'
        };
      }

      if (isZodArray(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'array',
          items: convertZodSchema(value._def.type)
        };
      }

      if (isZodObject(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'object',
          properties: convertZodShape(value._def.shape())
        };
      }

      if (isZodEnum(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'array',
          items: {
            type: 'string',
            enum: value._def.values
          }
        };
      }

      if (isZodIntersection(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'array',
          items: {
            ...convertZodSchema(value._def.left),
            ...convertZodSchema(value._def.right)
          }
        };
      }

      if (isZodNullable(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = convertZodSchema(
          value._def.innerType
        );
      }

      if (isZodDate(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'string',
          format: 'date-time'
        };
      }

      if (isZodOptional(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = convertZodSchema(
          value._def.innerType
        );
      }
    });

    return jsonSchema;
  };

  if (isZodString(schema)) {
    jsonSchema = {
      type: 'string'
    };
  }

  if (isZodNumber(schema)) {
    jsonSchema = {
      type: 'number'
    };
  }

  if (isZodBoolean(schema)) {
    jsonSchema = {
      type: 'boolean'
    };
  }

  if (isZodArray(schema)) {
    jsonSchema = {
      type: 'array',
      items: convertZodSchema(schema._def.type)
    };
  }

  if (isZodObject(schema)) {
    jsonSchema = {
      type: 'object',
      properties: convertZodShape(schema._def.shape())
    };
  }

  if (isZodEnum(schema)) {
    jsonSchema = {
      type: 'string',
      enum: convertZodShape(schema._def.values)
    };
  }

  if (isZodIntersection(schema)) {
    jsonSchema = {
      type: 'array',
      items: {
        ...convertZodSchema(schema._def.left),
        ...convertZodSchema(schema._def.right)
      }
    };
  }

  if (isZodNullable(schema)) {
    jsonSchema = convertZodSchema(schema._def.innerType);
  }

  return jsonSchema;
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
