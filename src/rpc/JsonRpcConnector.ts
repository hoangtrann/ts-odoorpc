import axios, { AxiosInstance } from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { OdooRpcError } from '../errors/OdooError';
import type {
  ConnectionConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcErrorResponse,
} from './types';

/**
 * JSON-RPC connector for communicating with Odoo server via HTTP.
 * Handles low-level request/response and session management.
 */
export class JsonRpcConnector {
  private axios: AxiosInstance;
  private sessionId?: string;
  private sessionCookie?: string;
  private requestIdCounter = 0;
  private cookieJar: CookieJar;

  constructor(config: ConnectionConfig) {
    const protocol = config.protocol || 'http';
    const port = config.port || (protocol === 'https' ? 443 : 8069);
    const baseURL = `${protocol}://${config.host}:${port}`;

    this.cookieJar = new CookieJar();
    const client = wrapper(axios.create({
      baseURL,
      timeout: config.timeout || 120000,
      jar: this.cookieJar, // Use cookie jar for proper cookie handling
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    }));

    this.axios = client;
  }

  /**
   * Make a JSON-RPC call to the Odoo server.
   *
   * @param endpoint - The RPC endpoint (e.g., '/web/session/authenticate', '/web/dataset/call_kw')
   * @param params - Request parameters
   * @returns The result from the Odoo server
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * const result = await connector.call('/web/session/authenticate', {
   *   db: 'mydb',
   *   login: 'admin',
   *   password: 'password'
   * });
   * ```
   */
  async call<T = any>(endpoint: string, params: any): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'call',
      params,
      id: this.generateRequestId(),
    };

    try {
      // Add session cookie if available
      const headers: any = {};
      if (this.sessionCookie) {
        headers.Cookie = this.sessionCookie;
      }

      const response = await this.axios.post<JsonRpcResponse<T>>(
        endpoint,
        request,
        { headers }
      );

      if (this.isErrorResponse(response.data)) {
        throw new OdooRpcError(
          response.data.error.data?.message || response.data.error.message,
          response.data.error.code,
          response.data.error.data
        );
      }

      // Extract and store session ID from response if present
      if (response.data.result && typeof response.data.result === 'object') {
        const result = response.data.result as any;
        if (result.session_id) {
          this.sessionId = result.session_id;
        }
      }

      // Store session ID from cookies if available
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const sessionCookie = setCookie.find((cookie: string) => cookie.includes('session_id'));
        if (sessionCookie) {
          this.sessionCookie = sessionCookie;
          const match = sessionCookie.match(/session_id=([^;]+)/);
          if (match) {
            this.sessionId = match[1];
          }
        }
      }

      return response.data.result;
    } catch (error) {
      if (error instanceof OdooRpcError) {
        throw error;
      }

      // Handle axios errors
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.error?.data?.message ||
          error.message ||
          'Network request failed';
        throw new OdooRpcError(message, error.response?.status);
      }

      throw new OdooRpcError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Get the current session ID.
   *
   * @returns The session ID or undefined if not authenticated
   */
  getSessionId(): string | undefined {
    return this.sessionId;
  }

  /**
   * Set the session ID (useful for restoring sessions).
   *
   * @param sessionId - The session ID to set
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Clear the current session.
   */
  clearSession(): void {
    this.sessionId = undefined;
  }

  /**
   * Get the base URL for the Odoo server.
   *
   * @returns The base URL
   */
  getBaseUrl(): string {
    return this.axios.defaults.baseURL || '';
  }

  /**
   * Type guard to check if response is an error response.
   */
  private isErrorResponse(
    response: JsonRpcResponse
  ): response is JsonRpcErrorResponse {
    return 'error' in response;
  }

  /**
   * Generate a unique request ID.
   */
  private generateRequestId(): number {
    return ++this.requestIdCounter;
  }
}
