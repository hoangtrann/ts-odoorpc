import { JsonRpcConnector } from '../rpc/JsonRpcConnector';
import { Environment } from '../env/Environment';
import { OdooAuthError, OdooRpcError, OdooSessionError } from '../errors/OdooError';
import type { ConnectionConfig, LoginResponse } from '../rpc/types';

/**
 * Main entry point for interacting with Odoo servers.
 *
 * OdooClient manages the connection, authentication, and provides access to
 * the environment for model operations.
 *
 * @example
 * ```typescript
 * const odoo = new OdooClient();
 * await odoo.connect({ host: 'localhost', port: 8069 });
 * await odoo.login('mydb', 'admin', 'password');
 *
 * const Partner = odoo.env.model<ResPartner>('res.partner');
 * const partners = await Partner.search([['customer', '=', true]]);
 * ```
 */
export class OdooClient {
  private connector?: JsonRpcConnector;
  private _env?: Environment;
  private _database?: string;
  private _uid?: number;
  private _password?: string;
  private _context?: Record<string, any>;

  /**
   * Connect to an Odoo server.
   *
   * Initializes the JSON-RPC connector with the provided configuration.
   *
   * @param config - Connection configuration
   *
   * @example
   * ```typescript
   * await odoo.connect({
   *   host: 'localhost',
   *   port: 8069,
   *   protocol: 'http'
   * });
   * ```
   */
  async connect(config: ConnectionConfig): Promise<void> {
    this.connector = new JsonRpcConnector(config);
  }

  /**
   * Authenticate with the Odoo server.
   *
   * After successful login, the environment becomes available via the `env` getter.
   *
   * @param database - Database name
   * @param username - Username (login)
   * @param password - Password
   * @throws {OdooAuthError} If authentication fails
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * await odoo.login('mydb', 'admin', 'password');
   * console.log('Logged in as user ID:', odoo.env.userId);
   * ```
   */
  async login(
    database: string,
    username: string,
    password: string
  ): Promise<void> {
    this.ensureConnected();

    try {
      const result = await this.connector!.call<LoginResponse>(
        '/web/session/authenticate',
        {
          db: database,
          login: username,
          password: password,
        }
      );

      // Check if authentication was successful
      if (!result.uid) {
        throw new OdooAuthError('Authentication failed: Invalid credentials');
      }

      // Store session information
      this._database = database;
      this._uid = result.uid as number;
      this._password = password;
      this._context = result.user_context || {};

      // Create environment
      this._env = new Environment(this, database, result.uid as number, this._context);
    } catch (error) {
      if (error instanceof OdooAuthError || error instanceof OdooRpcError) {
        throw error;
      }
      throw new OdooAuthError(
        `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Log out and clear the session.
   *
   * @example
   * ```typescript
   * await odoo.logout();
   * ```
   */
  async logout(): Promise<void> {
    this.ensureConnected();

    try {
      await this.connector!.call('/web/session/destroy', {});
    } catch (error) {
      // Ignore errors during logout
    } finally {
      this.clearSession();
    }
  }

  /**
   * Execute a method on an Odoo model using the execute_kw endpoint.
   *
   * This is a low-level method for calling Odoo model methods directly.
   * Consider using the Model class methods instead for type safety.
   *
   * @param model - Model name (e.g., 'res.partner')
   * @param method - Method name (e.g., 'search', 'read', 'create')
   * @param args - Positional arguments
   * @param kwargs - Keyword arguments
   * @returns Promise resolving to the method result
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * const ids = await odoo.executeKw('res.partner', 'search', [[['customer', '=', true]]], { limit: 5 });
   * ```
   */
  async executeKw(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: any = {}
  ): Promise<any> {
    this.ensureAuthenticated();

    return this.connector!.call('/web/dataset/call_kw', {
      model,
      method,
      args,
      kwargs: {
        context: { ...this._context, ...kwargs.context },
        ...kwargs,
      },
    });
  }

  /**
   * Make a generic JSON-RPC call to the Odoo server.
   *
   * This is the lowest-level method for making custom RPC calls.
   *
   * @param endpoint - RPC endpoint path
   * @param params - Request parameters
   * @returns Promise resolving to the result
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * const result = await odoo.call('/web/dataset/call', {
   *   model: 'res.partner',
   *   method: 'search',
   *   args: [[]]
   * });
   * ```
   */
  async call(endpoint: string, params: any): Promise<any> {
    this.ensureConnected();
    return this.connector!.call(endpoint, params);
  }

  /**
   * Get the environment (available after login).
   *
   * The environment provides access to models and context management.
   *
   * @throws {Error} If not authenticated
   *
   * @example
   * ```typescript
   * const Partner = odoo.env.model<ResPartner>('res.partner');
   * ```
   */
  get env(): Environment {
    if (!this._env) {
      throw new OdooSessionError('Not authenticated. Call login() first.');
    }
    return this._env;
  }

  /**
   * Get the database service (for database management operations).
   *
   * @example
   * ```typescript
   * const databases = await odoo.db.list();
   * ```
   */
  get db(): any {
    // TODO: Will return DatabaseService once implemented
    throw new Error('DatabaseService not implemented yet');
  }

  /**
   * Get the report service (for generating reports).
   *
   * @example
   * ```typescript
   * const pdf = await odoo.report.download('sale.order', [1, 2, 3]);
   * ```
   */
  get report(): any {
    // TODO: Will return ReportService once implemented
    throw new Error('ReportService not implemented yet');
  }

  /**
   * Get the current session ID.
   *
   * @returns Session ID or undefined if not authenticated
   */
  getSessionId(): string | undefined {
    return this.connector?.getSessionId();
  }

  /**
   * Get the server URL.
   *
   * @returns Server base URL or undefined if not connected
   */
  getServerUrl(): string | undefined {
    return this.connector?.getBaseUrl();
  }

  /**
   * Check if connected to a server.
   *
   * @returns true if connected
   */
  isConnected(): boolean {
    return this.connector !== undefined;
  }

  /**
   * Check if authenticated.
   *
   * @returns true if authenticated
   */
  isAuthenticated(): boolean {
    return this._env !== undefined;
  }

  /**
   * Ensure the client is connected.
   *
   * @throws {Error} If not connected
   * @internal
   */
  private ensureConnected(): void {
    if (!this.connector) {
      throw new Error('Not connected. Call connect() first.');
    }
  }

  /**
   * Ensure the client is authenticated.
   *
   * @throws {Error} If not authenticated
   * @internal
   */
  private ensureAuthenticated(): void {
    this.ensureConnected();
    if (!this._env) {
      throw new Error('Not authenticated. Call login() first.');
    }
  }

  /**
   * Clear session data.
   *
   * @internal
   */
  private clearSession(): void {
    this._env = undefined;
    this._database = undefined;
    this._uid = undefined;
    this._password = undefined;
    this._context = undefined;
    this.connector?.clearSession();
  }
}
