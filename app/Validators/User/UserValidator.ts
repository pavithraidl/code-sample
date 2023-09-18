import {rules, schema} from '@ioc:Adonis/Core/Validator';

/**
 * UPDATE
 * ---------------------------------------------------------------------------------------------------------------------
 */
const createUserModelSchema = schema.create({
  firstName: schema.string({}, [rules.maxLength(32)]),
  lastName: schema.string({}, [rules.maxLength(32)]),
  email: schema.string({}, [rules.email(), rules.maxLength(128)]),
  roleSlug: schema.string(),
  companyDid: schema.string.nullableAndOptional(),
  officeDid: schema.string.nullableAndOptional(),
});

export {
  createUserModelSchema,
};
