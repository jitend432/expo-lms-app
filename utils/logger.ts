import { Platform } from 'react-native';
import { IS_DEV } from '@/constants/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  context?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enabled = true;
  private minLevel: LogLevel = IS_DEV ? 'debug' : 'info';

  constructor() {
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    if (typeof ErrorUtils !== 'undefined') {
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        this.error('Unhandled error', {
          error: error.message,
          stack: error.stack,
          isFatal,
        });
        originalHandler(error, isFatal);
      });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `[${timestamp}] ${level.toUpperCase()} ${contextStr} ${message}`;
  }

  private addToHistory(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      context,
    };

    this.addToHistory(entry);

    const formattedMessage = this.formatMessage(level, message, context, data);
    const consoleData = data ? { data } : undefined;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, consoleData);
        break;
      case 'info':
        console.info(formattedMessage, consoleData);
        break;
      case 'warn':
        console.warn(formattedMessage, consoleData);
        break;
      case 'error':
        console.error(formattedMessage, consoleData);
        break;
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data);
  }

  // Log API request
  logRequest(method: string, url: string, data?: any): void {
    this.debug(`${method} ${url}`, 'API', { request: data });
  }

  // Log API response
  logResponse(method: string, url: string, status: number, data?: any): void {
    const level = status >= 400 ? 'error' : 'debug';
    this[level](`${method} ${url} - ${status}`, 'API', { response: data });
  }

  // Log API error
  logApiError(method: string, url: string, error: any): void {
    this.error(`${method} ${url} failed`, 'API', {
      error: error.message,
      status: error.status,
      data: error.data,
    });
  }

  // Log navigation
  logNavigation(from: string, to: string, params?: any): void {
    this.debug(`Navigation: ${from} -> ${to}`, 'Navigation', { params });
  }

  // Log user action
  logUserAction(action: string, data?: any): void {
    this.info(`User action: ${action}`, 'UserAction', data);
  }

  // Log performance
  logPerformance(label: string, duration: number): void {
    const level = duration > 1000 ? 'warn' : 'debug';
    this[level](`Performance: ${label} took ${duration}ms`, 'Performance');
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  // Get logs by context
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter((log) => log.context === context);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Enable/disable logging
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Set minimum log level
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Measure performance of async function
  async measurePerformance<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - start;
      this.logPerformance(label, duration);
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Performance decorator
export function logPerformance(label?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const methodLabel = label || `${target.constructor.name}.${propertyKey}`;
      return logger.measurePerformance(methodLabel, () => originalMethod.apply(this, args));
    };
    
    return descriptor;
  };
}