import { type z } from 'zod';

export type BaseSchemaType = z.ZodSchema;
export type BaseObjectSchemaType = z.AnyZodObject;

export type SchemaReturnType<T extends BaseSchemaType> = T extends z.ZodSchema
  ? z.infer<T>
  : Partial<Record<string, string | string[]>>;
