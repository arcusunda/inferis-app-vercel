import winston from 'winston';
import 'winston-daily-rotate-file';

// Define the format of the logs
const logFormat = winston.format.printf(
  ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
);

// Configure the daily rotate file transport
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
});

// Initialize the logger
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    dailyRotateFileTransport,
  ],
});

export default logger;
