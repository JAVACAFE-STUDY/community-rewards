var Joi = require('joi');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test', 'provision'])
    .default('development'),
  SERVER_PORT: Joi.number()
    .default(4040),
  DOMAIN: Joi.required()
    .default('localhost:8080'),
  MONGOOSE_DEBUG: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.string().equal('development'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    }),
  JWT_SECRET: Joi.string().required()
    .description('JWT Secret required to sign'),
  SMTP_USER: Joi.string().email().required()
  .description('SMTP user required to send gmail'),
  SMTP_PASSWORD: Joi.required()
    .description('SMTP password required to send gmail'),
  MONGO_HOST: Joi.string().required()
    .description('Mongo DB host url'),
  MONGO_PORT: Joi.number()
    .default(27017)
}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.SERVER_PORT,
  domain: envVars.DOMAIN,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  jwtSecret: envVars.JWT_SECRET,
  mongo: {
    host: envVars.MONGO_HOST,
    port: envVars.MONGO_PORT
  },
  smtp: {
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASSWORD
  },
  web3Provider: envVars.WEB3_PROVIDER
};

module.exports = config;