import {rules, schema} from '@ioc:Adonis/Core/Validator';

/**
 * UPDATE
 * ---------------------------------------------------------------------------------------------------------------------
 */
const updateProductPricingModelSchema = schema.create({
  productDid: schema.string({}, [rules.required()]),
  pricingModel: schema.object().members({
    guid: schema.string.optional(),
    mode: schema.enum.optional(['RETAIL', 'WHOLESALE'] as const),
    modelType: schema.enum.optional(['FIXED', 'VOLUME'] as const),
    price: schema.number.optional(),
    session: schema.object.optional().members({
      isEnabled: schema.boolean(),
      duration: schema.number.nullable(),
      shouldMultiplyWithVolume: schema.boolean(),
      isTimelyVolume: schema.boolean(),
      durationUnit: schema.enum(['minutes', 'hours', 'days', 'weeks', 'months', 'years'] as const),
    }),
    volume: schema.object.optional().members({
      measurement: schema.string(),
      isTimely: schema.boolean.optional(),
      input: schema.string(),
      inputLabel: schema.string(),
      inputOptions: schema.array.optional().members(
        schema.object().members({
          title: schema.string(),
          value: schema.number(),
        })
      ),
    }),
    isScheduled: schema.boolean.optional(),
    schedule: schema.object.optional().members({
      data: schema.array().members(schema.object().members({
        day: schema.number([
          rules.unsigned(),
          rules.range(1, 7), // If this represents a day of the week
        ]),
        timeFrom: schema.string({}, [
          rules.regex(/^\d{2}:\d{2}$/), // Check for HH:MM format
        ]),
        timeTo: schema.string({}, [
          rules.regex(/^\d{2}:\d{2}$/), // Check for HH:MM format
        ]),
        price: schema.number(),
      })),
    }),
    status: schema.enum.optional(['DRAFT' , 'ACTIVE', 'ARCHIVED'] as const),
    meta: schema.object.optional().anyMembers(),
    companyId: schema.number.optional(),
    createdBy: schema.number.optional(),
  }),
});

export {
  updateProductPricingModelSchema,
};
