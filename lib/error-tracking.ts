// Production error tracking service
// Supports Sentry and can be extended for other services

interface ErrorContext {
  [key: string]: unknown;
}

interface ErrorTrackingConfig {
  dsn?: string;
  environment?: string;
  enabled: boolean;
}

// Helper to safely import Sentry only if it exists
async function loadSentry() {
  try {
    // Use dynamic module name to prevent webpack from bundling
    const moduleName = '@sentry/nextjs';
    return await import(/* webpackIgnore: true */ moduleName);
  } catch {
    return null;
  }
}

class ErrorTracking {
  private config: ErrorTrackingConfig;
  private sentryInitialized = false;

  constructor() {
    this.config = {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      enabled: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    };

    if (this.config.enabled && typeof window !== 'undefined') {
      this.initializeSentry();
    }
  }

  private async initializeSentry(): Promise<void> {
    if (this.sentryInitialized || !this.config.dsn) return;

    try {
      const Sentry = await loadSentry();
      if (!Sentry) {
        console.warn('Sentry is not installed. Error tracking will use console fallback.');
        return;
      }

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        tracesSampleRate: 0.1,
        beforeSend(event: any, hint: any) {
          if (event.exception) {
            console.error('[Sentry]', hint.originalException || hint.syntheticException);
          }
          return event;
        },
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
        ],
      });

      this.sentryInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  captureException(error: Error, context?: ErrorContext): void {
    if (!this.config.enabled) {
      if (process.env.NODE_ENV === 'development') {
        console.error('ErrorTracking (dev mode):', error, context);
      }
      return;
    }

    loadSentry().then((Sentry) => {
      if (!Sentry) {
        console.error('Sentry not available:', error, context);
        return;
      }
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          Sentry.setContext(key, value as Record<string, unknown>);
        });
      }
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (!this.config.enabled) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`ErrorTracking (dev mode) [${level}]:`, message, context);
      }
      return;
    }

    loadSentry().then((Sentry) => {
      if (!Sentry) {
        console.log(`Sentry not available [${level}]:`, message, context);
        return;
      }
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          Sentry.setContext(key, value as Record<string, unknown>);
        });
      }
      Sentry.captureMessage(message, level);
    });
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.config.enabled) return;

    loadSentry().then((Sentry) => {
      if (Sentry) {
        Sentry.setUser(user);
      }
    });
  }

  clearUser(): void {
    if (!this.config.enabled) return;

    loadSentry().then((Sentry) => {
      if (Sentry) {
        Sentry.setUser(null);
      }
    });
  }

  addBreadcrumb(message: string, category?: string, data?: ErrorContext): void {
    if (!this.config.enabled) return;

    loadSentry().then((Sentry) => {
      if (Sentry) {
        Sentry.addBreadcrumb({
          message,
          category,
          data: data as Record<string, unknown>,
          timestamp: Date.now() / 1000,
        });
      }
    });
  }
}

export const errorTracking = new ErrorTracking();
