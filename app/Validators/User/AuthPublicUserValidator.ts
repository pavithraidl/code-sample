import {rules, schema} from '@ioc:Adonis/Core/Validator';

/**
 * Register public auth user validator
 * ---------------------------------------------------------------------------------------------------------------------
 */
const registerPublicAuthUser = schema.create({
  firstName: schema.string({}, [
    rules.minLength(2),
    rules.maxLength(32),
  ]),
  lastName: schema.string({}, [
    rules.minLength(2),
    rules.maxLength(32),
  ]),
  token: schema.string({}, [rules.required()]),
  email: schema.string({}, [
    rules.email(),
    rules.maxLength(128),
  ]),
  password: schema.string.optional({}, [
    rules.minLength(6),
    rules.maxLength(128),
  ]),
  socialLoginData: schema.object.optional().members({
    provider: schema.string(),
    token: schema.string(),
  }),
  clientIp: schema.string.optional(),
  avatarUrl: schema.string.optional({}, [
    rules.maxLength(255),
  ]),
});

/**
 * Login public auth user validator
 * ---------------------------------------------------------------------------------------------------------------------
 */
const loginPublicAuthUser = schema.create({
  email: schema.string({}, [
    rules.email(),
    rules.maxLength(128),
  ]),
  password: schema.string.optional({}, [
    rules.minLength(6),
    rules.maxLength(128),
  ]),
  token: schema.string({}, [rules.required()]),
  socialLoginData: schema.object.optional().members({
    provider: schema.string(),
    token: schema.string(),
  }),
  clientIp: schema.string.optional(),
  rememberMe: schema.boolean.optional(),
});

/**
 * Update public auth user validator
 * ---------------------------------------------------------------------------------------------------------------------
 */
const updatePublicAuthUser = schema.create({
  firstName: schema.string({}, [
    rules.minLength(2),
    rules.maxLength(32),
  ]),
  lastName: schema.string({}, [
    rules.minLength(2),
    rules.maxLength(32),
  ]),
  avatarUrl: schema.string.optional({}, [
    rules.maxLength(255),
  ]),
  phoneNumber: schema.string.optional({}, [rules.minLength(8), rules.maxLength(14)]),
});

export {
  registerPublicAuthUser,
  loginPublicAuthUser,
  updatePublicAuthUser,
};
