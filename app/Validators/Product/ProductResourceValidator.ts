import {rules, schema} from '@ioc:Adonis/Core/Validator';

/**
 * UPDATE
 * ---------------------------------------------------------------------------------------------------------------------
 */
const updateProductResourceModelSchema = schema.create({
  productDid: schema.string({}, [rules.required()]),
  resource: schema.object().members({
    guid: schema.string.optional(),
    name: schema.string.nullableAndOptional(),
    type: schema.enum.optional(['TOOL', 'PERSONNEL', 'CONSUMABLE'] as const),
    preparationTime: schema.number.optional(),
    finalizingTime: schema.number.optional(),
    toolDid: schema.string.optional(),
    consumableDid: schema.string.optional(),
    requiredQuantity: schema.number.optional(),
    personnelDids: schema.array.optional().members(schema.string()),
    status: schema.enum.optional(['DRAFT' , 'ACTIVE', 'ARCHIVED'] as const),
    companyId: schema.number.optional(),
  }),
});

export {
  updateProductResourceModelSchema,
};
