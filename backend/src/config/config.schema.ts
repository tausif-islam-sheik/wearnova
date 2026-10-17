import * as Joi from 'joi';

export const ConfigSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_ADMIN_EXPIRES_IN: Joi.string().default('2h'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_FILE_SIZE: Joi.number().default(5 * 1024 * 1024), // 5MB
  BCRYPT_SALT_ROUNDS: Joi.number().default(12),
  STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  PLATFORM_FEE_PERCENT_DEFAULT: Joi.number().min(0).max(50).default(8),
  ESCROW_AUTO_CONFIRM_DAYS: Joi.number().min(0).default(7),
  SMS_PROVIDER: Joi.string().valid('console', 'twilio', 'africastalking').default('console'),
  TWILIO_ACCOUNT_SID: Joi.string().optional().allow(''),
  TWILIO_AUTH_TOKEN: Joi.string().optional().allow(''),
  TWILIO_FROM_NUMBER: Joi.string().optional().allow(''),
  AFRICAS_TALKING_USERNAME: Joi.string().optional().allow(''),
  AFRICAS_TALKING_API_KEY: Joi.string().optional().allow(''),
  AFRICAS_TALKING_FROM: Joi.string().optional().allow(''),
  OTP_TTL_MINUTES: Joi.number().min(1).default(10),
  OTP_MAX_ATTEMPTS: Joi.number().min(1).default(5),
});
