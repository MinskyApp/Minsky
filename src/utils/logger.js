// Logger - Winston con rotacion
'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `[${timestamp}] ${level}: ${stack || message}`;
  if (Object.keys(metadata).length > 0) {
    // Metadatos adicionales
    const metaString = JSON.stringify(metadata);
    if (metaString !== '{}') {
      msg += ` ${metaString}`;
    }
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        errors({ stack: true }),
        timestamp({ format: 'HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
});

if (process.env.LOG_FILE !== 'false') {
  try {
    const DailyRotateFile = require('winston-daily-rotate-file');
    logger.add(new DailyRotateFile({
      filename: path.join(logDir, 'multistream-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
      format: combine(timestamp(), logFormat),
    }));
    logger.add(new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      format: combine(timestamp(), logFormat),
    }));
  } catch {}
}

module.exports = logger;
