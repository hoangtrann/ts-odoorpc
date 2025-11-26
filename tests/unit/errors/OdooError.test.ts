/**
 * Unit tests for OdooError classes
 */

import {
  OdooError,
  OdooRpcError,
  OdooAuthError,
  OdooNetworkError,
  OdooSessionError,
} from '../../../src/errors/OdooError';

describe('OdooError', () => {
  describe('constructor', () => {
    it('should create an error with the given message', () => {
      const error = new OdooError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OdooError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('OdooError');
    });

    it('should maintain proper prototype chain', () => {
      const error = new OdooError('Test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof OdooError).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new OdooError('Test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('OdooError');
    });
  });
});

describe('OdooRpcError', () => {
  describe('constructor', () => {
    it('should create an RPC error with message only', () => {
      const error = new OdooRpcError('RPC failed');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OdooError);
      expect(error).toBeInstanceOf(OdooRpcError);
      expect(error.message).toBe('RPC failed');
      expect(error.name).toBe('OdooRpcError');
      expect(error.code).toBeUndefined();
      expect(error.data).toBeUndefined();
    });

    it('should create an RPC error with code and data', () => {
      const errorData = {
        name: 'ValidationError',
        message: 'Invalid value',
        debug: 'Traceback...',
      };
      const error = new OdooRpcError('Validation failed', 100, errorData);

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe(100);
      expect(error.data).toEqual(errorData);
    });

    it('should maintain proper prototype chain', () => {
      const error = new OdooRpcError('Test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof OdooError).toBe(true);
      expect(error instanceof OdooRpcError).toBe(true);
    });
  });

  describe('exceptionName', () => {
    it('should return exception name from data', () => {
      const error = new OdooRpcError('Error', 100, {
        name: 'ValidationError',
      });

      expect(error.exceptionName).toBe('ValidationError');
    });

    it('should return undefined when data has no name', () => {
      const error = new OdooRpcError('Error', 100, {});

      expect(error.exceptionName).toBeUndefined();
    });

    it('should return undefined when data is undefined', () => {
      const error = new OdooRpcError('Error');

      expect(error.exceptionName).toBeUndefined();
    });
  });

  describe('debugInfo', () => {
    it('should return debug info from data', () => {
      const debugTrace = 'Traceback (most recent call last):\n...';
      const error = new OdooRpcError('Error', 100, {
        debug: debugTrace,
      });

      expect(error.debugInfo).toBe(debugTrace);
    });

    it('should return undefined when data has no debug', () => {
      const error = new OdooRpcError('Error', 100, {});

      expect(error.debugInfo).toBeUndefined();
    });

    it('should return undefined when data is undefined', () => {
      const error = new OdooRpcError('Error');

      expect(error.debugInfo).toBeUndefined();
    });
  });

  describe('fromJsonRpcError', () => {
    it('should create error from JSON-RPC error object with data message', () => {
      const jsonRpcError = {
        code: 200,
        message: 'Generic error',
        data: {
          message: 'Specific validation error',
          name: 'ValidationError',
        },
      };

      const error = OdooRpcError.fromJsonRpcError(jsonRpcError);

      expect(error).toBeInstanceOf(OdooRpcError);
      expect(error.message).toBe('Specific validation error');
      expect(error.code).toBe(200);
      expect(error.data).toEqual(jsonRpcError.data);
    });

    it('should use generic message when data.message is not available', () => {
      const jsonRpcError = {
        code: 200,
        message: 'Generic error',
      };

      const error = OdooRpcError.fromJsonRpcError(jsonRpcError);

      expect(error.message).toBe('Generic error');
    });

    it('should use default message when both messages are missing', () => {
      const jsonRpcError = {
        code: 200,
        message: '',
      };

      const error = OdooRpcError.fromJsonRpcError(jsonRpcError);

      expect(error.message).toBe('Unknown RPC error');
    });

    it('should preserve error data', () => {
      const errorData = {
        name: 'AccessError',
        message: 'Access denied',
        debug: 'Traceback...',
        arguments: ['test'],
      };
      const jsonRpcError = {
        code: 403,
        message: 'Forbidden',
        data: errorData,
      };

      const error = OdooRpcError.fromJsonRpcError(jsonRpcError);

      expect(error.data).toEqual(errorData);
      expect(error.exceptionName).toBe('AccessError');
      expect(error.debugInfo).toBe('Traceback...');
    });
  });
});

describe('OdooAuthError', () => {
  describe('constructor', () => {
    it('should create an authentication error', () => {
      const error = new OdooAuthError('Invalid credentials');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OdooError);
      expect(error).toBeInstanceOf(OdooAuthError);
      expect(error.message).toBe('Invalid credentials');
      expect(error.name).toBe('OdooAuthError');
    });

    it('should maintain proper prototype chain', () => {
      const error = new OdooAuthError('Test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof OdooError).toBe(true);
      expect(error instanceof OdooAuthError).toBe(true);
      expect(error instanceof OdooRpcError).toBe(false);
    });
  });
});

describe('OdooNetworkError', () => {
  describe('constructor', () => {
    it('should create a network error with message only', () => {
      const error = new OdooNetworkError('Connection failed');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OdooError);
      expect(error).toBeInstanceOf(OdooNetworkError);
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('OdooNetworkError');
      expect(error.cause).toBeUndefined();
    });

    it('should create a network error with cause', () => {
      const cause = new Error('ECONNREFUSED');
      const error = new OdooNetworkError('Failed to connect', cause);

      expect(error.message).toBe('Failed to connect');
      expect(error.cause).toBe(cause);
    });

    it('should maintain proper prototype chain', () => {
      const error = new OdooNetworkError('Test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof OdooError).toBe(true);
      expect(error instanceof OdooNetworkError).toBe(true);
    });
  });
});

describe('OdooSessionError', () => {
  describe('constructor', () => {
    it('should create a session error', () => {
      const error = new OdooSessionError('Not authenticated');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OdooError);
      expect(error).toBeInstanceOf(OdooSessionError);
      expect(error.message).toBe('Not authenticated');
      expect(error.name).toBe('OdooSessionError');
    });

    it('should maintain proper prototype chain', () => {
      const error = new OdooSessionError('Test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof OdooError).toBe(true);
      expect(error instanceof OdooSessionError).toBe(true);
    });
  });
});

describe('Error hierarchy', () => {
  it('should allow catching all Odoo errors with OdooError', () => {
    const errors = [
      new OdooError('Generic'),
      new OdooRpcError('RPC'),
      new OdooAuthError('Auth'),
      new OdooNetworkError('Network'),
      new OdooSessionError('Session'),
    ];

    errors.forEach((error) => {
      expect(error instanceof OdooError).toBe(true);
    });
  });

  it('should allow catching specific error types', () => {
    const rpcError = new OdooRpcError('RPC');
    const authError = new OdooAuthError('Auth');

    expect(rpcError instanceof OdooRpcError).toBe(true);
    expect(rpcError instanceof OdooAuthError).toBe(false);
    expect(authError instanceof OdooAuthError).toBe(true);
    expect(authError instanceof OdooRpcError).toBe(false);
  });
});
