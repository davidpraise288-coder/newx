import { OpenChatError, OpenChatErrorCode } from '../types/openchat.types.js';

/**
 * Centralized error handling for OpenChat plugin
 */
export class OpenChatErrorHandler {
  private errorCallbacks: Map<OpenChatErrorCode, ((error: OpenChatError) => void)[]> = new Map();
  private globalErrorCallback: ((error: OpenChatError) => void) | null = null;

  /**
   * Register an error callback for a specific error code
   */
  onError(code: OpenChatErrorCode, callback: (error: OpenChatError) => void): void {
    if (!this.errorCallbacks.has(code)) {
      this.errorCallbacks.set(code, []);
    }
    this.errorCallbacks.get(code)!.push(callback);
  }

  /**
   * Register a global error callback for all errors
   */
  onAnyError(callback: (error: OpenChatError) => void): void {
    this.globalErrorCallback = callback;
  }

  /**
   * Handle an error
   */
  handleError(error: OpenChatError): void {
    console.error(`OpenChat Error [${error.code}]:`, error.message, error.details);

    // Call specific error callbacks
    const callbacks = this.errorCallbacks.get(error.code as OpenChatErrorCode);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(error);
        } catch (callbackError) {
          console.error('Error in error callback:', callbackError);
        }
      });
    }

    // Call global error callback
    if (this.globalErrorCallback) {
      try {
        this.globalErrorCallback(error);
      } catch (callbackError) {
        console.error('Error in global error callback:', callbackError);
      }
    }
  }

  /**
   * Create a standardized error
   */
  createError(
    code: OpenChatErrorCode,
    message: string,
    details?: any,
    originalError?: Error
  ): OpenChatError {
    return {
      code,
      message,
      details: {
        ...details,
        originalError: originalError?.message,
        stack: originalError?.stack,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Wrap a function with error handling
   */
  wrapWithErrorHandling<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    errorCode: OpenChatErrorCode,
    errorMessage: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        const ocError = this.createError(
          errorCode,
          errorMessage,
          { args },
          error instanceof Error ? error : new Error(String(error))
        );
        this.handleError(ocError);
        throw ocError;
      }
    };
  }

  /**
   * Clear all error callbacks
   */
  clearCallbacks(): void {
    this.errorCallbacks.clear();
    this.globalErrorCallback = null;
  }
}

/**
 * Error recovery strategies
 */
export class ErrorRecoveryManager {
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(maxRetries = 3, retryDelay = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Execute a function with automatic retry on failure
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    recoverableErrors: OpenChatErrorCode[] = [
      OpenChatErrorCode.NETWORK_ERROR,
      OpenChatErrorCode.CANISTER_ERROR,
    ]
  ): Promise<T> {
    const currentAttempts = this.retryAttempts.get(operationId) || 0;

    try {
      const result = await operation();
      // Reset retry count on success
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      const ocError = error as OpenChatError;
      
      // Check if error is recoverable and we haven't exceeded max retries
      if (
        currentAttempts < this.maxRetries &&
        recoverableErrors.includes(ocError.code as OpenChatErrorCode)
      ) {
        console.log(
          `Retrying operation ${operationId} (attempt ${currentAttempts + 1}/${this.maxRetries})`
        );
        
        this.retryAttempts.set(operationId, currentAttempts + 1);
        
        // Wait before retrying with exponential backoff
        const delay = this.retryDelay * Math.pow(2, currentAttempts);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.executeWithRetry(operation, operationId, recoverableErrors);
      } else {
        // Reset retry count and throw error
        this.retryAttempts.delete(operationId);
        throw error;
      }
    }
  }

  /**
   * Reset retry count for an operation
   */
  resetRetryCount(operationId: string): void {
    this.retryAttempts.delete(operationId);
  }

  /**
   * Get current retry count for an operation
   */
  getRetryCount(operationId: string): number {
    return this.retryAttempts.get(operationId) || 0;
  }
}

/**
 * Error reporting and monitoring
 */
export class ErrorReporter {
  private errors: OpenChatError[] = [];
  private maxErrors = 100;

  /**
   * Report an error
   */
  reportError(error: OpenChatError): void {
    this.errors.push({
      ...error,
      details: {
        ...error.details,
        reportedAt: new Date().toISOString(),
      },
    });

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log error for monitoring
    this.logError(error);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCode: Record<string, number>;
    recent: OpenChatError[];
    mostCommon: string;
  } {
    const byCode: Record<string, number> = {};
    
    this.errors.forEach(error => {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
    });

    const mostCommon = Object.entries(byCode)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    return {
      total: this.errors.length,
      byCode,
      recent: this.errors.slice(-10),
      mostCommon,
    };
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Export errors for analysis
   */
  exportErrors(): OpenChatError[] {
    return [...this.errors];
  }

  /**
   * Log error for monitoring systems
   */
  private logError(error: OpenChatError): void {
    // This could be extended to send to monitoring services
    console.error('OpenChat Error Reported:', {
      code: error.code,
      message: error.message,
      timestamp: error.details?.timestamp,
    });
  }
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private maxFailures = 5,
    private timeout = 60000 // 1 minute
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        console.log('Circuit breaker moving to half-open state');
      } else {
        throw new Error('Circuit breaker is open - operation blocked');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'half-open') {
        this.reset();
        console.log('Circuit breaker reset to closed state');
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record a failure
   */
  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.maxFailures) {
      this.state = 'open';
      console.log('Circuit breaker opened due to failures');
    }
  }

  /**
   * Reset the circuit breaker
   */
  private reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }

  /**
   * Get current state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
}

/**
 * Global error handling utilities
 */
export const ErrorUtils = {
  /**
   * Check if an error is retryable
   */
  isRetryable(error: OpenChatError): boolean {
    const retryableCodes = [
      OpenChatErrorCode.NETWORK_ERROR,
      OpenChatErrorCode.CANISTER_ERROR,
      OpenChatErrorCode.RATE_LIMITED,
    ];
    return retryableCodes.includes(error.code as OpenChatErrorCode);
  },

  /**
   * Check if an error is critical
   */
  isCritical(error: OpenChatError): boolean {
    const criticalCodes = [
      OpenChatErrorCode.AUTHENTICATION_FAILED,
      OpenChatErrorCode.PERMISSION_DENIED,
    ];
    return criticalCodes.includes(error.code as OpenChatErrorCode);
  },

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: OpenChatError): string {
    switch (error.code) {
      case OpenChatErrorCode.AUTHENTICATION_FAILED:
        return 'Authentication failed. Please check your identity configuration.';
      case OpenChatErrorCode.NETWORK_ERROR:
        return 'Network error occurred. Please check your connection and try again.';
      case OpenChatErrorCode.CANISTER_ERROR:
        return 'OpenChat service error. Please try again later.';
      case OpenChatErrorCode.INVALID_MESSAGE:
        return 'Invalid message format. Please check your message content.';
      case OpenChatErrorCode.CHAT_NOT_FOUND:
        return 'Chat not found. Please check the chat ID.';
      case OpenChatErrorCode.USER_NOT_IN_CHAT:
        return 'You are not a member of this chat.';
      case OpenChatErrorCode.PERMISSION_DENIED:
        return 'Permission denied. You do not have access to perform this action.';
      case OpenChatErrorCode.RATE_LIMITED:
        return 'Rate limited. Please wait before trying again.';
      default:
        return `An error occurred: ${error.message}`;
    }
  },

  /**
   * Convert any error to OpenChatError
   */
  toOpenChatError(error: any, code = OpenChatErrorCode.UNKNOWN_ERROR): OpenChatError {
    if (error && typeof error === 'object' && 'code' in error) {
      return error as OpenChatError;
    }

    return {
      code,
      message: error?.message || String(error),
      details: {
        originalError: error,
        timestamp: new Date().toISOString(),
      },
    };
  },
};

// Create global instances
export const globalErrorHandler = new OpenChatErrorHandler();
export const globalRecoveryManager = new ErrorRecoveryManager();
export const globalErrorReporter = new ErrorReporter();
export const globalCircuitBreaker = new CircuitBreaker();