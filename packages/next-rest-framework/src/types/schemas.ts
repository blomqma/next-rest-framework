import { z } from 'zod';
import * as yup from 'yup';

export type BaseSchemaType = z.ZodSchema | yup.AnySchema;

export type SchemaReturnType<T extends BaseSchemaType> = T extends z.ZodSchema
  ? z.infer<T>
  : T extends yup.AnySchema
  ? yup.InferType<T>
  : never;
