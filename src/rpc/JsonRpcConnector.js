"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRpcConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const OdooError_1 = require("../errors/OdooError");
/**
 * JSON-RPC connector for communicating with Odoo server via HTTP.
 * Handles low-level request/response and session management.
 */
class JsonRpcConnector {
    constructor(config) {
        this.requestIdCounter = 0;
        const protocol = config.protocol || 'http';
        const port = config.port || (protocol === 'https' ? 443 : 8069);
        const baseURL = `${protocol}://${config.host}:${port}`;
        this.axios = axios_1.default.create({
            baseURL,
            timeout: config.timeout || 120000,
            withCredentials: true, // Enable cookie handling for session persistence
            headers: {
                'Content-Type': 'application/json',
            },
        });
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
    async call(endpoint, params) {
        const request = {
            jsonrpc: '2.0',
            method: 'call',
            params,
            id: this.generateRequestId(),
        };
        try {
            const response = await this.axios.post(endpoint, request);
            if (this.isErrorResponse(response.data)) {
                throw new OdooError_1.OdooRpcError(response.data.error.data?.message || response.data.error.message, response.data.error.code, response.data.error.data);
            }
            // Extract and store session ID from response if present
            if (response.data.result && typeof response.data.result === 'object') {
                const result = response.data.result;
                if (result.session_id) {
                    this.sessionId = result.session_id;
                }
            }
            return response.data.result;
        }
        catch (error) {
            if (error instanceof OdooError_1.OdooRpcError) {
                throw error;
            }
            // Handle axios errors
            if (axios_1.default.isAxiosError(error)) {
                const message = error.response?.data?.error?.data?.message ||
                    error.message ||
                    'Network request failed';
                throw new OdooError_1.OdooRpcError(message, error.response?.status);
            }
            throw new OdooError_1.OdooRpcError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
    /**
     * Get the current session ID.
     *
     * @returns The session ID or undefined if not authenticated
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Set the session ID (useful for restoring sessions).
     *
     * @param sessionId - The session ID to set
     */
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    /**
     * Clear the current session.
     */
    clearSession() {
        this.sessionId = undefined;
    }
    /**
     * Get the base URL for the Odoo server.
     *
     * @returns The base URL
     */
    getBaseUrl() {
        return this.axios.defaults.baseURL || '';
    }
    /**
     * Type guard to check if response is an error response.
     */
    isErrorResponse(response) {
        return 'error' in response;
    }
    /**
     * Generate a unique request ID.
     */
    generateRequestId() {
        return ++this.requestIdCounter;
    }
}
exports.JsonRpcConnector = JsonRpcConnector;
//# sourceMappingURL=JsonRpcConnector.js.map