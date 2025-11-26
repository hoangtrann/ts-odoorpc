import type { ConnectionConfig } from './types';
/**
 * JSON-RPC connector for communicating with Odoo server via HTTP.
 * Handles low-level request/response and session management.
 */
export declare class JsonRpcConnector {
    private axios;
    private sessionId?;
    private requestIdCounter;
    constructor(config: ConnectionConfig);
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
    call<T = any>(endpoint: string, params: any): Promise<T>;
    /**
     * Get the current session ID.
     *
     * @returns The session ID or undefined if not authenticated
     */
    getSessionId(): string | undefined;
    /**
     * Set the session ID (useful for restoring sessions).
     *
     * @param sessionId - The session ID to set
     */
    setSessionId(sessionId: string): void;
    /**
     * Clear the current session.
     */
    clearSession(): void;
    /**
     * Get the base URL for the Odoo server.
     *
     * @returns The base URL
     */
    getBaseUrl(): string;
    /**
     * Type guard to check if response is an error response.
     */
    private isErrorResponse;
    /**
     * Generate a unique request ID.
     */
    private generateRequestId;
}
//# sourceMappingURL=JsonRpcConnector.d.ts.map