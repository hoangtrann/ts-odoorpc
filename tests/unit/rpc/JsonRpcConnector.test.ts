/**
 * Unit tests for JsonRpcConnector
 */

import axios from 'axios';
import { JsonRpcConnector } from '../../../src/rpc/JsonRpcConnector';
import { OdooRpcError } from '../../../src/errors/OdooError';

jest.mock('axios');
jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn((instance) => instance),
}));
jest.mock('tough-cookie', () => ({
  CookieJar: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JsonRpcConnector', () => {
  let connector: JsonRpcConnector;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      post: jest.fn(),
      defaults: {
        baseURL: 'http://localhost:8069',
      },
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
  });

  describe('constructor', () => {
    it('should create connector with default HTTP protocol and port', () => {
      connector = new JsonRpcConnector({
        host: 'localhost',
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:8069',
          timeout: 120000,
        })
      );
    });

    it('should create connector with HTTPS protocol', () => {
      connector = new JsonRpcConnector({
        host: 'example.com',
        protocol: 'https',
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://example.com:443',
        })
      );
    });

    it('should create connector with custom port', () => {
      connector = new JsonRpcConnector({
        host: 'localhost',
        port: 8080,
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:8080',
        })
      );
    });

    it('should create connector with custom timeout', () => {
      connector = new JsonRpcConnector({
        host: 'localhost',
        timeout: 60000,
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });

    it('should set proper headers', () => {
      connector = new JsonRpcConnector({
        host: 'localhost',
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        })
      );
    });
  });

  describe('call', () => {
    beforeEach(() => {
      connector = new JsonRpcConnector({
        host: 'localhost',
      });
    });

    it('should make a successful RPC call', async () => {
      const mockResult = { uid: 2, user_context: {} };
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          id: 1,
          result: mockResult,
        },
        headers: {},
      });

      const result = await connector.call('/web/session/authenticate', {
        db: 'test',
        login: 'admin',
        password: 'admin',
      });

      expect(result).toEqual(mockResult);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/web/session/authenticate',
        expect.objectContaining({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            db: 'test',
            login: 'admin',
            password: 'admin',
          },
        }),
        expect.any(Object)
      );
    });

    it('should increment request ID for each call', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { jsonrpc: '2.0', id: 1, result: {} },
        headers: {},
      });

      await connector.call('/endpoint1', {});
      await connector.call('/endpoint2', {});

      const calls = mockAxiosInstance.post.mock.calls;
      expect(calls[0]![1].id).toBe(1);
      expect(calls[1]![1].id).toBe(2);
    });

    it('should extract session ID from result', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          id: 1,
          result: { session_id: 'session123', uid: 2 },
        },
        headers: {},
      });

      await connector.call('/web/session/authenticate', {});

      expect(connector.getSessionId()).toBe('session123');
    });

    it('should extract session ID from cookies', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          id: 1,
          result: {},
        },
        headers: {
          'set-cookie': ['session_id=cookie456; Path=/; HttpOnly', 'other_cookie=value'],
        },
      });

      await connector.call('/web/session/authenticate', {});

      expect(connector.getSessionId()).toBe('cookie456');
    });

    it('should include session cookie in subsequent requests', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: {
            jsonrpc: '2.0',
            id: 1,
            result: {},
          },
          headers: {
            'set-cookie': ['session_id=session789; Path=/'],
          },
        })
        .mockResolvedValueOnce({
          data: {
            jsonrpc: '2.0',
            id: 2,
            result: { count: 10 },
          },
          headers: {},
        });

      await connector.call('/web/session/authenticate', {});
      await connector.call('/web/dataset/call_kw', {});

      const secondCall = mockAxiosInstance.post.mock.calls[1];
      expect(secondCall?.[2]?.headers?.Cookie).toBe('session_id=session789; Path=/');
    });

    it('should throw OdooRpcError on server error', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: 200,
            message: 'Odoo Server Error',
            data: {
              message: 'Access denied',
              name: 'AccessError',
            },
          },
        },
        headers: {},
      });

      await expect(connector.call('/endpoint', {})).rejects.toThrow(OdooRpcError);

      await expect(connector.call('/endpoint', {})).rejects.toThrow('Access denied');
    });

    it('should throw OdooRpcError on network error', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).isAxiosError = true;
      mockAxiosInstance.post.mockRejectedValue(networkError);

      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

      await expect(connector.call('/endpoint', {})).rejects.toThrow(OdooRpcError);
    });

    it('should throw OdooRpcError with status code on HTTP error', async () => {
      const httpError: any = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            error: {
              data: {
                message: 'Not found',
              },
            },
          },
        },
        message: 'Request failed with status code 404',
      };

      mockAxiosInstance.post.mockRejectedValue(httpError);
      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

      await expect(connector.call('/endpoint', {})).rejects.toThrow(OdooRpcError);
    });

    it('should handle generic errors', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Unexpected error'));
      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(false);

      await expect(connector.call('/endpoint', {})).rejects.toThrow(OdooRpcError);

      await expect(connector.call('/endpoint', {})).rejects.toThrow('Unexpected error');
    });

    it('should handle non-Error exceptions', async () => {
      mockAxiosInstance.post.mockRejectedValue('String error');
      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(false);

      await expect(connector.call('/endpoint', {})).rejects.toThrow('Unknown error occurred');
    });
  });

  describe('getSessionId', () => {
    beforeEach(() => {
      connector = new JsonRpcConnector({
        host: 'localhost',
      });
    });

    it('should return undefined when no session exists', () => {
      expect(connector.getSessionId()).toBeUndefined();
    });

    it('should return session ID after successful authentication', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          id: 1,
          result: { session_id: 'test123' },
        },
        headers: {},
      });

      await connector.call('/web/session/authenticate', {});

      expect(connector.getSessionId()).toBe('test123');
    });
  });

  describe('setSessionId', () => {
    beforeEach(() => {
      connector = new JsonRpcConnector({
        host: 'localhost',
      });
    });

    it('should set session ID', () => {
      connector.setSessionId('manual-session-id');

      expect(connector.getSessionId()).toBe('manual-session-id');
    });

    it('should allow overwriting existing session ID', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          id: 1,
          result: { session_id: 'original' },
        },
        headers: {},
      });

      await connector.call('/web/session/authenticate', {});
      expect(connector.getSessionId()).toBe('original');

      connector.setSessionId('new-session');
      expect(connector.getSessionId()).toBe('new-session');
    });
  });

  describe('clearSession', () => {
    beforeEach(() => {
      connector = new JsonRpcConnector({
        host: 'localhost',
      });
    });

    it('should clear session ID', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          id: 1,
          result: { session_id: 'test' },
        },
        headers: {},
      });

      await connector.call('/web/session/authenticate', {});
      expect(connector.getSessionId()).toBe('test');

      connector.clearSession();
      expect(connector.getSessionId()).toBeUndefined();
    });
  });

  describe('getBaseUrl', () => {
    it('should return the base URL', () => {
      // Create a fresh mock for this specific test
      const testAxiosInstance = {
        post: jest.fn(),
        defaults: {
          baseURL: 'https://example.com:9000',
        },
      };

      mockedAxios.create = jest.fn().mockReturnValue(testAxiosInstance);

      const testConnector = new JsonRpcConnector({
        host: 'example.com',
        port: 9000,
        protocol: 'https',
      });

      expect(testConnector.getBaseUrl()).toBe('https://example.com:9000');
    });
  });
});
