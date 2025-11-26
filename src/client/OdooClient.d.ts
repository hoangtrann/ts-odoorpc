import { Environment } from '../env/Environment';
import type { ConnectionConfig } from '../rpc/types';
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
export declare class OdooClient {
  private connector?;
  private _env?;
  private _database?;
  private _uid?;
  private _password?;
  private _context?;
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
  connect(config: ConnectionConfig): Promise<void>;
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
  login(database: string, username: string, password: string): Promise<void>;
  /**
   * Log out and clear the session.
   *
   * @example
   * ```typescript
   * await odoo.logout();
   * ```
   */
  logout(): Promise<void>;
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
  executeKw(model: string, method: string, args?: any[], kwargs?: any): Promise<any>;
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
  call(endpoint: string, params: any): Promise<any>;
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
  get env(): Environment;
  /**
   * Get the database service (for database management operations).
   *
   * @example
   * ```typescript
   * const databases = await odoo.db.list();
   * ```
   */
  get db(): any;
  /**
   * Get the report service (for generating reports).
   *
   * @example
   * ```typescript
   * const pdf = await odoo.report.download('sale.order', [1, 2, 3]);
   * ```
   */
  get report(): any;
  /**
   * Get the current session ID.
   *
   * @returns Session ID or undefined if not authenticated
   */
  getSessionId(): string | undefined;
  /**
   * Get the server URL.
   *
   * @returns Server base URL or undefined if not connected
   */
  getServerUrl(): string | undefined;
  /**
   * Check if connected to a server.
   *
   * @returns true if connected
   */
  isConnected(): boolean;
  /**
   * Check if authenticated.
   *
   * @returns true if authenticated
   */
  isAuthenticated(): boolean;
  /**
   * Ensure the client is connected.
   *
   * @throws {Error} If not connected
   * @internal
   */
  private ensureConnected;
  /**
   * Ensure the client is authenticated.
   *
   * @throws {Error} If not authenticated
   * @internal
   */
  private ensureAuthenticated;
  /**
   * Clear session data.
   *
   * @internal
   */
  private clearSession;
}
//# sourceMappingURL=OdooClient.d.ts.map
