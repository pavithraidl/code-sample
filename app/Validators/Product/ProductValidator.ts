import {rules, schema} from '@ioc:Adonis/Core/Validator';

/**
 * CREATE
 * ---------------------------------------------------------------------------------------------------------------------
 */
const createProductModelSchema = schema.create({
  name: schema.string({}, [rules.required(), rules.maxLength(64)]),
  type: schema.enum.optional(['PRODUCT', 'SERVICE' , 'TOOL'] as const),
  companyDid: schema.string.nullableAndOptional(),
});

/**
 * UPDATE
 * ---------------------------------------------------------------------------------------------------------------------
 */
const updateProductModelSchema = schema.create({
  dids: schema.array().members(schema.string({}, [rules.required()])),
  data: schema.object().members({
    name: schema.string.optional(),
    quantity: schema.number.optional(),
    description: schema.string.optional(),
    heroImageUrl: schema.string.optional(),
    gallery: schema.object.optional().members({
      data: schema.array.optional().members(schema.object().members({
        caption: schema.string(),
        url: schema.string(),
        type: schema.string(),
      })),
    }),
    officeDids: schema.array.optional().members(schema.string()),
    type: schema.enum.optional(['PRODUCT', 'SERVICE']),
    status: schema.enum.optional(['DRAFT' , 'ACTIVE', 'ARCHIVED'] as const),
    meta: schema.object.optional().anyMembers(),
  }),
});

export {
  updateProductModelSchema,
  createProductModelSchema,
};
