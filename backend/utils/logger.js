// utils/logger.js
import winston from 'winston';
import path from 'path';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} | ${level.toUpperCase()} | ${message}`)
  ),
  transports: [
    new winston.transports.File({ filename: path.join('logs', 'signed-urls.log') }),
  ],
});

export default logger;
