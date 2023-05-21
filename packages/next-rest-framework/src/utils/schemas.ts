import { OpenAPIV3_1 } from 'openapi-types';
import {
  AnySchema,
  ArraySchema,
  BooleanSchema,
  NumberSchema,
  ObjectSchema,
  StringSchema,
  ValidationError
} from 'yup';
import {
  AnyZodObject,
  ZodArray,
  ZodBoolean,
  ZodDate,
  ZodEnum,
  ZodIntersection,
  ZodNativeEnum,
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

const isZodNativeEnum = (schema: ZodTypeAny): schema is ZodNativeEnum<any> => {
  return schema._def.typeName === 'ZodNativeEnum';
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
            type: 'string',
            enum: value._def.values
        };
          }

      if (isZodNativeEnum(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'string',
          enum: value._def.values
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

const isYupSchema = (schema: unknown): schema is AnySchema =>
  !!schema && typeof schema === 'object' && 'spec' in schema;

const isYupValidationError = (error: unknown): error is ValidationError =>
  error instanceof Error && 'inner' in error;

const yupSchemaValidator = async ({
  schema,
  obj
}: {
  schema: AnySchema;
  obj: unknown;
}) => {
  let valid = true;
  let errors = null;

  try {
    await schema.validate(obj);
  } catch (e) {
    valid = false;

    if (isYupValidationError(e)) {
      errors = e.errors;
    } else {
      errors = ['Unexpected error.'];
    }
  }

  return {
    valid,
    errors
  };
};

const isYupString = (schema: AnySchema): schema is StringSchema => {
  return schema.type === 'string';
};

const isYupNumber = (schema: AnySchema): schema is NumberSchema => {
  return schema.type === 'number';
};

const isYupBoolean = (schema: AnySchema): schema is BooleanSchema => {
  return schema.type === 'boolean';
};

const isYupArray = (schema: AnySchema): schema is ArraySchema<any> => {
  return schema.type === 'array';
};

const isYupObject = (schema: AnySchema): schema is ObjectSchema<any> => {
  return schema.type === 'object';
};

const convertYupSchema = (schema: AnySchema) => {
  let jsonSchema = {};

  const convertYupFields = (fields: ObjectSchema<any>) => {
    const jsonSchema: OpenAPIV3_1.SchemaObject = {};

    Object.entries(fields).forEach(([key, value]) => {
      if (isYupString(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'string'
        };
      }

      if (isYupNumber(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'number'
        };
      }

      if (isYupBoolean(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'boolean'
        };
      }

      if (isYupArray(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'array',
          items: convertYupSchema(value.innerType)
        };
      }

      if (isYupObject(value)) {
        jsonSchema[key as keyof typeof jsonSchema] = {
          type: 'object',
          properties: convertYupFields(value.fields)
        };
      }
    });

    return jsonSchema;
  };

  if (isYupString(schema)) {
    jsonSchema = {
      type: 'string'
    };
  }

  if (isYupNumber(schema)) {
    jsonSchema = {
      type: 'number'
    };
  }

  if (isYupBoolean(schema)) {
    jsonSchema = {
      type: 'boolean'
    };
  }

  if (isYupArray(schema)) {
    jsonSchema = {
      type: 'array',
      items: convertYupSchema(schema.innerType)
    };
  }

  if (isYupObject(schema)) {
    jsonSchema = {
      type: 'object',
      properties: convertYupFields(schema.fields)
    };
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

  if (isYupSchema(schema)) {
    return await yupSchemaValidator({ schema, obj });
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

  if (isYupSchema(schema)) {
    return convertYupSchema(schema);
  }

  throw Error('Invalid schema.');
};

export const getSchemaKeys = ({ schema }: { schema: BaseObjectSchemaType }) => {
  if (isZodSchema(schema)) {
    return Object.keys(schema._def.shape());
  }

  if (isYupSchema(schema)) {
    return Object.keys(schema.fields);
  }

  throw Error('Invalid schema.');
};
