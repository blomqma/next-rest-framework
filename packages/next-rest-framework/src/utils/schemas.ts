import { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod';
import * as yup from 'yup';
import { BaseSchemaType } from '../types';

export const isZodSchema = (schema: unknown): schema is z.ZodSchema =>
  !!schema && typeof schema === 'object' && '_def' in schema;

const zodSchemaValidator = ({
  schema,
  body
}: {
  schema: z.ZodSchema;
  body: unknown;
}) => {
  const data = schema.safeParse(body);

  const errors = !data.success
    ? data.error.issues.map(({ message }) => message)
    : null;

  return {
    valid: data.success,
    errors
  };
};

export const convertZodSchema = (schema: z.ZodSchema) => {
  let jsonSchema = {};

  const isZodString = (schema: z.ZodSchema): schema is z.ZodString => {
    // @ts-expect-error
    return schema._def.typeName === 'ZodString';
  };

  const isZodNumber = (schema: z.ZodSchema): schema is z.ZodNumber => {
    // @ts-expect-error
    return schema._def.typeName === 'ZodNumber';
  };

  const isZodBoolean = (schema: z.ZodSchema): schema is z.ZodBoolean => {
    // @ts-expect-error
    return schema._def.typeName === 'ZodBoolean';
  };

  const isZodArray = (schema: z.ZodSchema): schema is z.ZodArray<any> => {
    // @ts-expect-error
    return schema._def.typeName === 'ZodArray';
  };

  const isZodObject = (schema: z.ZodSchema): schema is z.ZodObject<any> => {
    // @ts-expect-error
    return schema._def.typeName === 'ZodObject';
  };

  const convertZodShape = (shape: z.ZodRawShape) => {
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

  return jsonSchema;
};

const isYupSchema = (schema: unknown): schema is yup.AnySchema =>
  !!schema && typeof schema === 'object' && 'spec' in schema;

const yupSchemaValidator = async ({
  schema,
  body
}: {
  schema: yup.AnySchema;
  body: unknown;
}) => {
  let valid = true;
  let errors = null;

  try {
    await schema.validate(body);
  } catch (e) {
    valid = false;

    if (e instanceof yup.ValidationError) {
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

const convertYupSchema = (schema: yup.AnySchema) => {
  let jsonSchema = {};

  const isYupString = (schema: yup.AnySchema): schema is yup.StringSchema => {
    return schema.type === 'string';
  };

  const isYupNumber = (schema: yup.AnySchema): schema is yup.NumberSchema => {
    return schema.type === 'number';
  };

  const isYupBoolean = (schema: yup.AnySchema): schema is yup.BooleanSchema => {
    return schema.type === 'boolean';
  };

  const isYupArray = (
    schema: yup.AnySchema
  ): schema is yup.ArraySchema<any> => {
    return schema.type === 'array';
  };

  const isYupObject = (
    schema: yup.AnySchema
  ): schema is yup.ObjectSchema<any> => {
    return schema.type === 'object';
  };

  const convertYupFields = (fields: yup.ObjectSchema<any>) => {
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

export const validateRequestBody = async ({
  schema,
  body
}: {
  schema: BaseSchemaType;
  body: unknown;
}) => {
  if (isZodSchema(schema)) {
    return zodSchemaValidator({ schema, body });
  }

  if (isYupSchema(schema)) {
    return await yupSchemaValidator({ schema, body });
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
