import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default(
    'development',
  ),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().allow('').required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().optional(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  FRONTEND_URL: Joi.string().uri().optional(),
  /** Base URL del API (redirects Stripe Checkout → deep link Medly) */
  APP_PUBLIC_URL: Joi.string().optional(),
});
