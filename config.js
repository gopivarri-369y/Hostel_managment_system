try {
  require('dotenv').config({ path: process.env.ENV_FILE || 'index.env' });
} catch (_) {}

const dbHost = (process.env.DB_HOST || '').trim();
const useSSL = process.env.NODE_ENV === 'production' || dbHost.includes('neon.tech');

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
  db: {
    user: (process.env.DB_USER || '').trim(),
    host: dbHost,
    database: (process.env.DB_NAME || '').trim(),
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
};
