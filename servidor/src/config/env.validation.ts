import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().optional(),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().optional(),
  DB_USER: Joi.string().optional(),
  DB_PASS: Joi.string().allow('').optional(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().optional(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  FRONTEND_URL: Joi.string().uri().optional(),
  /** Base URL del API (redirects Stripe Checkout → deep link Medly) */
  APP_PUBLIC_URL: Joi.string().optional(),
  /** AES-256-GCM para campos clínicos cifrados en reposo */
  DATA_ENCRYPTION_KEY: Joi.string()
    .length(64)
    .hex()
    .required()
    .messages({
      'string.length':
        'DATA_ENCRYPTION_KEY debe ser una cadena hex de 64 caracteres (32 bytes)',
      'string.hex': 'DATA_ENCRYPTION_KEY solo puede contener caracteres hex (0-9, a-f)',
    }),
});
