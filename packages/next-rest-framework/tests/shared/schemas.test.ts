import { z } from 'zod';
import { getJsonSchema, validateSchema } from '../../src/shared';

describe('shared/schemas', () => {
  describe('validateSchema', () => {
    it('returns parsed data for valid objects', () => {
      const schema = z.object({
        foo: z.string(),
        count: z.number().int()
      });

      const result = validateSchema({
        schema,
        obj: { foo: 'bar', count: 3 }
      });

      expect(result).toEqual({
        valid: true,
        errors: null,
        data: { foo: 'bar', count: 3 }
      });
    });

    it('collects issues for invalid data', () => {
      const schema = z.object({
        foo: z.string(),
        count: z.number()
      });

      const result = validateSchema({
        schema,
        obj: { foo: 123 }
      });

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['foo'] }),
          expect.objectContaining({ path: ['count'] })
        ])
      );
    });
  });

  describe('getJsonSchema', () => {
    it('preserves nested descriptions for objects and arrays', () => {
      const schema = z.object({
        foo: z.string().describe('Foo description'),
        items: z
          .array(
            z
              .object({
                id: z.string().describe('Item id'),
                tags: z
                  .array(z.string().describe('Tag value'))
                  .describe('Tag list')
              })
              .describe('Item object')
          )
          .describe('Items list')
      });

      const jsonSchema = getJsonSchema({
        schema,
        operationId: 'TestOperation',
        type: 'output-body'
      });

      const properties = jsonSchema.properties as any;
      expect(properties.foo.description).toBe('Foo description');

      const itemsSchema = properties.items;
      expect(itemsSchema.description).toBe('Items list');
      expect(itemsSchema.items.description).toBe('Item object');
      expect(itemsSchema.items.properties.id.description).toBe('Item id');
      expect(itemsSchema.items.properties.tags.description).toBe('Tag list');
      expect(itemsSchema.items.properties.tags.items.description).toBe(
        'Tag value'
      );
    });
  });
});
