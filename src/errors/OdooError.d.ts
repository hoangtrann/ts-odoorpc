/**
 * Error classes for the ts-odoorpc library.
 *
 * This module provides a hierarchy of error classes for handling various
 * error conditions when communicating with Odoo servers.
 */
/**
 * Base error class for all Odoo-related errors.
 *
 * @example
 * ```typescript
 * try {
 *   await odoo.login('mydb', 'admin', 'password');
 * } catch (error) {
 *   if (error instanceof OdooError) {
 *     console.error('Odoo error:', error.message);
 *   }
 * }
 * ```
 */
export declare class OdooError extends Error {
    /**
     * Creates a new OdooError.
     *
     * @param message - Error message
     */
    constructor(message: string);
}
/**
 * Error thrown when a JSON-RPC call to Odoo fails.
 *
 * This error includes additional information from the Odoo server response,
 * such as error codes and debug information.
 *
 * @example
 * ```typescript
 * try {
 *   await Partner.create({ name: '' }); // Validation error
 * } catch (error) {
 *   if (error instanceof OdooRpcError) {
 *     console.error('RPC Error:', error.message);
 *     console.error('Error code:', error.code);
 *     console.error('Error data:', error.data);
 *   }
 * }
 * ```
 */
export declare class OdooRpcError extends OdooError {
    readonly code?: number | undefined;
    readonly data?: any | undefined;
    /**
     * Creates a new OdooRpcError.
     *
     * @param message - Error message
     * @param code - Error code (from JSON-RPC error object)
     * @param data - Additional error data (from JSON-RPC error object)
     */
    constructor(message: string, code?: number | undefined, data?: any | undefined);
    /**
     * Gets the exception name from the error data.
     * Common Odoo exceptions include:
     * - ValidationError
     * - AccessError
     * - UserError
     * - MissingError
     *
     * @returns The exception name, or undefined if not available
     */
    get exceptionName(): string | undefined;
    /**
     * Gets the debug information from the error data.
     * This typically includes a Python traceback.
     *
     * @returns The debug information, or undefined if not available
     */
    get debugInfo(): string | undefined;
    /**
     * Creates an OdooRpcError from a JSON-RPC error object.
     *
     * @param error - The JSON-RPC error object
     * @returns A new OdooRpcError instance
     */
    static fromJsonRpcError(error: {
        code: number;
        message: string;
        data?: any;
    }): OdooRpcError;
}
/**
 * Error thrown when authentication fails.
 *
 * This error is thrown when login credentials are invalid or when
 * authentication is required but not provided.
 *
 * @example
 * ```typescript
 * try {
 *   await odoo.login('mydb', 'admin', 'wrong-password');
 * } catch (error) {
 *   if (error instanceof OdooAuthError) {
 *     console.error('Authentication failed:', error.message);
 *   }
 * }
 * ```
 */
export declare class OdooAuthError extends OdooError {
    /**
     * Creates a new OdooAuthError.
     *
     * @param message - Error message
     */
    constructor(message: string);
}
/**
 * Error thrown when a network request fails.
 *
 * This error wraps network-level failures such as connection timeouts,
 * DNS resolution failures, or unreachable servers.
 *
 * @example
 * ```typescript
 * try {
 *   await odoo.connect({ host: 'invalid-host', port: 8069 });
 * } catch (error) {
 *   if (error instanceof OdooNetworkError) {
 *     console.error('Network error:', error.message);
 *     console.error('Original error:', error.cause);
 *   }
 * }
 * ```
 */
export declare class OdooNetworkError extends OdooError {
    readonly cause?: Error | undefined;
    /**
     * Creates a new OdooNetworkError.
     *
     * @param message - Error message
     * @param cause - The underlying error that caused this error
     */
    constructor(message: string, cause?: Error | undefined);
}
/**
 * Error thrown when an operation is attempted before authentication.
 *
 * @example
 * ```typescript
 * const odoo = new OdooClient();
 * await odoo.connect({ host: 'localhost', port: 8069 });
 * // Forgot to login!
 * try {
 *   const Partner = odoo.env.model('res.partner'); // Will throw
 * } catch (error) {
 *   if (error instanceof OdooSessionError) {
 *     console.error('Not authenticated:', error.message);
 *   }
 * }
 * ```
 */
export declare class OdooSessionError extends OdooError {
    /**
     * Creates a new OdooSessionError.
     *
     * @param message - Error message
     */
    constructor(message: string);
}
//# sourceMappingURL=OdooError.d.ts.map