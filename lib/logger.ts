// Centralized logging service
// In production, logs are sent to error tracking service (Sentry)

import { errorTracking } from './error-tracking';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    } else {
      errorTracking.captureMessage(message, 'info', context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context));
    } else {
      errorTracking.captureMessage(message, 'warning', context);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error ? {
        errorMessage: error.message,
        errorStack: error.stack,
      } : { error }),
    };

    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, errorContext));
    } else {
      if (error instanceof Error) {
        errorTracking.captureException(error, errorContext);
      } else {
        errorTracking.captureMessage(message, 'error', errorContext);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new Logger();
