require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production.');
}

module.exports = {
  jwtSecret: JWT_SECRET || 'dev_co_curricular_fallback_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10
};
