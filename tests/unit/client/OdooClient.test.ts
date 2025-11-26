/**
 * Unit tests for OdooClient class
 */

// Mock axios and related modules before importing OdooClient
jest.mock('axios');
jest.mock('tough-cookie');
jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn((axiosInstance) => axiosInstance),
}));

import { OdooClient } from '../../../src/client/OdooClient';
import { JsonRpcConnector } from '../../../src/rpc/JsonRpcConnector';
import { OdooAuthError, OdooRpcError, OdooSessionError } from '../../../src/errors/OdooError';
import { Environment } from '../../../src/env/Environment';

jest.mock('../../../src/rpc/JsonRpcConnector');

describe('OdooClient', () => {
  let client: OdooClient;
  let mockConnector: jest.Mocked<JsonRpcConnector>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new OdooClient();

    mockConnector = {
      call: jest.fn(),
      getSessionId: jest.fn(),
      setSessionId: jest.fn(),
      clearSession: jest.fn(),
      getBaseUrl: jest.fn().mockReturnValue('http://localhost:8069'),
    } as any;

    (JsonRpcConnector as jest.MockedClass<typeof JsonRpcConnector>).mockImplementation(
      () => mockConnector
    );
  });

  describe('connect', () => {
    it('should initialize connector with config', () => {
      const config = {
        host: 'localhost',
        port: 8069,
        protocol: 'http' as const,
      };

      client.connect(config);

      expect(JsonRpcConnector).toHaveBeenCalledWith(config);
      expect(client.isConnected()).toBe(true);
    });

    it('should create connector with custom config', () => {
      const config = {
        host: 'example.com',
        port: 443,
        protocol: 'https' as const,
      };

      client.connect(config);

      expect(JsonRpcConnector).toHaveBeenCalledWith(config);
    });

    it('should allow reconnecting', () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });
      client.connect({ host: 'other.com', port: 8069, protocol: 'http' });

      expect(JsonRpcConnector).toHaveBeenCalledTimes(2);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });
    });

    it('should authenticate successfully', async () => {
      const loginResponse = {
        uid: 2,
        user_context: { lang: 'en_US', tz: 'UTC' },
        session_id: 'test-session-123',
        db: 'testdb',
        username: 'admin',
      };
      mockConnector.call.mockResolvedValue(loginResponse);

      await client.login('testdb', 'admin', 'password');

      expect(mockConnector.call).toHaveBeenCalledWith('/web/session/authenticate', {
        db: 'testdb',
        login: 'admin',
        password: 'password',
      });
      expect(client.isAuthenticated()).toBe(true);
      expect(client.env).toBeInstanceOf(Environment);
    });

    it('should throw OdooAuthError when uid is missing', async () => {
      mockConnector.call.mockResolvedValue({ uid: false });

      await expect(client.login('testdb', 'admin', 'wrong')).rejects.toThrow(OdooAuthError);
      await expect(client.login('testdb', 'admin', 'wrong')).rejects.toThrow(
        'Authentication failed: Invalid credentials'
      );
    });

    it('should throw OdooAuthError when uid is null', async () => {
      mockConnector.call.mockResolvedValue({ uid: null });

      await expect(client.login('testdb', 'admin', 'wrong')).rejects.toThrow(OdooAuthError);
    });

    it('should throw OdooAuthError when uid is 0', async () => {
      mockConnector.call.mockResolvedValue({ uid: 0 });

      await expect(client.login('testdb', 'admin', 'wrong')).rejects.toThrow(OdooAuthError);
    });

    it('should throw error if not connected', async () => {
      const disconnectedClient = new OdooClient();

      await expect(disconnectedClient.login('testdb', 'admin', 'password')).rejects.toThrow(
        'Not connected. Call connect() first.'
      );
    });

    it('should create environment with context', async () => {
      const loginResponse = {
        uid: 2,
        user_context: { lang: 'fr_FR', tz: 'Europe/Paris' },
      };
      mockConnector.call.mockResolvedValue(loginResponse);

      await client.login('testdb', 'admin', 'password');

      expect(client.env.context).toEqual({ lang: 'fr_FR', tz: 'Europe/Paris' });
    });

    it('should handle empty user_context', async () => {
      const loginResponse = {
        uid: 2,
        user_context: undefined,
      };
      mockConnector.call.mockResolvedValue(loginResponse);

      await client.login('testdb', 'admin', 'password');

      expect(client.env.context).toEqual({});
    });

    it('should propagate OdooRpcError', async () => {
      const rpcError = new OdooRpcError('Network error');
      mockConnector.call.mockRejectedValue(rpcError);

      await expect(client.login('testdb', 'admin', 'password')).rejects.toThrow(OdooRpcError);
    });

    it('should wrap unknown errors in OdooAuthError', async () => {
      mockConnector.call.mockRejectedValue(new Error('Unknown error'));

      await expect(client.login('testdb', 'admin', 'password')).rejects.toThrow(OdooAuthError);
      await expect(client.login('testdb', 'admin', 'password')).rejects.toThrow(
        'Authentication failed: Unknown error'
      );
    });

    it('should handle non-Error rejections', async () => {
      mockConnector.call.mockRejectedValue('String error');

      await expect(client.login('testdb', 'admin', 'password')).rejects.toThrow(OdooAuthError);
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });
      mockConnector.call.mockResolvedValue({
        uid: 2,
        user_context: { lang: 'en_US' },
      });
      await client.login('testdb', 'admin', 'password');
    });

    it('should call session destroy endpoint', async () => {
      mockConnector.call.mockResolvedValue({});

      await client.logout();

      expect(mockConnector.call).toHaveBeenCalledWith('/web/session/destroy', {});
    });

    it('should clear session data', async () => {
      mockConnector.call.mockResolvedValue({});

      await client.logout();

      expect(mockConnector.clearSession).toHaveBeenCalled();
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should clear session even if logout fails', async () => {
      mockConnector.call.mockRejectedValue(new Error('Network error'));

      await client.logout();

      expect(mockConnector.clearSession).toHaveBeenCalled();
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should throw error if not connected', async () => {
      const disconnectedClient = new OdooClient();

      await expect(disconnectedClient.logout()).rejects.toThrow(
        'Not connected. Call connect() first.'
      );
    });
  });

  describe('executeKw', () => {
    beforeEach(async () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });
      mockConnector.call.mockResolvedValue({
        uid: 2,
        user_context: { lang: 'en_US', tz: 'UTC' },
      });
      await client.login('testdb', 'admin', 'password');
    });

    it('should execute model method with args', async () => {
      mockConnector.call.mockResolvedValue([1, 2, 3]);

      const result = await client.executeKw('res.partner', 'search', [[['customer', '=', true]]]);

      expect(mockConnector.call).toHaveBeenCalledWith('/web/dataset/call_kw', {
        model: 'res.partner',
        method: 'search',
        args: [[['customer', '=', true]]],
        kwargs: {
          context: { lang: 'en_US', tz: 'UTC' },
        },
      });
      expect(result).toEqual([1, 2, 3]);
    });

    it('should execute method with kwargs', async () => {
      mockConnector.call.mockResolvedValue([1, 2]);

      await client.executeKw('res.partner', 'search', [[]], { limit: 5, offset: 10 });

      expect(mockConnector.call).toHaveBeenCalledWith('/web/dataset/call_kw', {
        model: 'res.partner',
        method: 'search',
        args: [[]],
        kwargs: {
          context: { lang: 'en_US', tz: 'UTC' },
          limit: 5,
          offset: 10,
        },
      });
    });

    it('should merge context from kwargs', async () => {
      mockConnector.call.mockResolvedValue([]);

      await client.executeKw('res.partner', 'search', [[]], { context: { active_test: false } });

      // Get the last call
      const lastCall = mockConnector.call.mock.calls[mockConnector.call.mock.calls.length - 1];
      const callParams = lastCall?.[1];

      expect(lastCall?.[0]).toBe('/web/dataset/call_kw');
      expect(callParams).toBeDefined();
      // Should include context from kwargs
      expect(callParams.kwargs.context).toBeDefined();
      expect(callParams.kwargs.context.active_test).toBe(false);
    });

    it('should execute method with empty args and kwargs', async () => {
      mockConnector.call.mockResolvedValue({});

      await client.executeKw('res.partner', 'my_method');

      expect(mockConnector.call).toHaveBeenCalledWith('/web/dataset/call_kw', {
        model: 'res.partner',
        method: 'my_method',
        args: [],
        kwargs: {
          context: { lang: 'en_US', tz: 'UTC' },
        },
      });
    });

    it('should throw error if not authenticated', async () => {
      const unauthClient = new OdooClient();
      unauthClient.connect({ host: 'localhost', port: 8069, protocol: 'http' });

      await expect(unauthClient.executeKw('res.partner', 'search', [[]])).rejects.toThrow(
        'Not authenticated. Call login() first.'
      );
    });

    it('should throw error if not connected', async () => {
      const disconnectedClient = new OdooClient();

      await expect(disconnectedClient.executeKw('res.partner', 'search', [[]])).rejects.toThrow(
        'Not connected. Call connect() first.'
      );
    });
  });

  describe('call', () => {
    beforeEach(() => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });
    });

    it('should make generic RPC call', async () => {
      mockConnector.call.mockResolvedValue({ success: true });

      const result = await client.call('/web/dataset/call', {
        model: 'res.partner',
        method: 'search',
        args: [[]],
      });

      expect(mockConnector.call).toHaveBeenCalledWith('/web/dataset/call', {
        model: 'res.partner',
        method: 'search',
        args: [[]],
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw error if not connected', async () => {
      const disconnectedClient = new OdooClient();

      await expect(disconnectedClient.call('/web/test', {})).rejects.toThrow(
        'Not connected. Call connect() first.'
      );
    });
  });

  describe('env getter', () => {
    it('should return environment after login', async () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });
      mockConnector.call.mockResolvedValue({
        uid: 2,
        user_context: { lang: 'en_US' },
      });
      await client.login('testdb', 'admin', 'password');

      const env = client.env;

      expect(env).toBeInstanceOf(Environment);
      expect(env.userId).toBe(2);
    });

    it('should throw OdooSessionError if not authenticated', () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });

      expect(() => client.env).toThrow(OdooSessionError);
      expect(() => client.env).toThrow('Not authenticated. Call login() first.');
    });
  });

  describe('db getter', () => {
    it('should throw not implemented error', () => {
      expect(() => client.db).toThrow('DatabaseService not implemented yet');
    });
  });

  describe('report getter', () => {
    it('should throw not implemented error', () => {
      expect(() => client.report).toThrow('ReportService not implemented yet');
    });
  });

  describe('getSessionId', () => {
    it('should return session id from connector', () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });
      mockConnector.getSessionId.mockReturnValue('test-session-123');

      const sessionId = client.getSessionId();

      expect(sessionId).toBe('test-session-123');
      expect(mockConnector.getSessionId).toHaveBeenCalled();
    });

    it('should return undefined if not connected', () => {
      const result = client.getSessionId();

      expect(result).toBeUndefined();
    });
  });

  describe('getServerUrl', () => {
    it('should return base URL from connector', () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });

      const url = client.getServerUrl();

      expect(url).toBe('http://localhost:8069');
      expect(mockConnector.getBaseUrl).toHaveBeenCalled();
    });

    it('should return undefined if not connected', () => {
      const result = client.getServerUrl();

      expect(result).toBeUndefined();
    });
  });

  describe('isConnected', () => {
    it('should return false initially', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('should return true after connect', () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });

      expect(client.isConnected()).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false initially', () => {
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return false after connect but before login', () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });

      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return true after login', async () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });
      mockConnector.call.mockResolvedValue({
        uid: 2,
        user_context: { lang: 'en_US' },
      });
      await client.login('testdb', 'admin', 'password');

      expect(client.isAuthenticated()).toBe(true);
    });

    it('should return false after logout', async () => {
      client.connect({ host: 'localhost', port: 8069, protocol: 'http' });
      mockConnector.call.mockResolvedValue({
        uid: 2,
        user_context: { lang: 'en_US' },
      });
      await client.login('testdb', 'admin', 'password');
      mockConnector.call.mockResolvedValue({});
      await client.logout();

      expect(client.isAuthenticated()).toBe(false);
    });
  });
});
