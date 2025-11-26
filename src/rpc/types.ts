/**
 * JSON-RPC 2.0 types for communication with Odoo.
 *
 * This module defines the request and response types for the JSON-RPC 2.0 protocol
 * used by Odoo's web API.
 *
 * @see https://www.jsonrpc.org/specification
 * @see https://www.odoo.com/documentation/16.0/developer/reference/external_api.html
 */

// Re-export ConnectionConfig from common types
export type { ConnectionConfig } from '../types/common';

/**
 * JSON-RPC 2.0 request object.
 *
 * @template P - The type of the params object
 */
export interface JsonRpcRequest<P = any> {
  /** JSON-RPC version (always "2.0") */
  jsonrpc: '2.0';

  /** Request method (always "call" for Odoo) */
  method: 'call';

  /** Request parameters */
  params: P;

  /** Request ID (used to match responses to requests) */
  id: number | string;
}

/**
 * JSON-RPC 2.0 successful response object.
 *
 * @template R - The type of the result
 */
export interface JsonRpcSuccessResponse<R = any> {
  /** JSON-RPC version (always "2.0") */
  jsonrpc: '2.0';

  /** Result of the successful call */
  result: R;

  /** Request ID that this response corresponds to */
  id: number | string;
}

/**
 * JSON-RPC 2.0 error object.
 */
export interface JsonRpcErrorObject {
  /** Error code */
  code: number;

  /** Human-readable error message */
  message: string;

  /** Additional error data (Odoo-specific) */
  data?: {
    /** Exception type/name */
    name?: string;

    /** Debug information */
    debug?: string;

    /** Additional context */
    message?: string;

    /** Exception arguments */
    arguments?: any[];

    /** Exception context */
    context?: Record<string, any>;
  };
}

/**
 * JSON-RPC 2.0 error response object.
 */
export interface JsonRpcErrorResponse {
  /** JSON-RPC version (always "2.0") */
  jsonrpc: '2.0';

  /** Error object */
  error: JsonRpcErrorObject;

  /** Request ID that this response corresponds to */
  id: number | string | null;
}

/**
 * JSON-RPC 2.0 response (either success or error).
 */
export type JsonRpcResponse<R = any> = JsonRpcSuccessResponse<R> | JsonRpcErrorResponse;

/**
 * Parameters for the /web/session/authenticate endpoint.
 */
export interface AuthenticateParams {
  /** Database name */
  db: string;

  /** Username */
  login: string;

  /** Password */
  password: string;

  /** Additional context (optional) */
  context?: Record<string, any>;
}

/**
 * Parameters for the /web/dataset/call_kw endpoint.
 */
export interface CallKwParams {
  /** Model name (e.g., 'res.partner') */
  model: string;

  /** Method name (e.g., 'search', 'read', 'create') */
  method: string;

  /** Positional arguments for the method */
  args: any[];

  /** Keyword arguments for the method */
  kwargs: Record<string, any>;
}

/**
 * Parameters for execute_kw RPC calls.
 */
export interface ExecuteKwParams {
  /** Service name (usually 'object') */
  service: string;

  /** Method name (always 'execute_kw' for ORM operations) */
  method: string;

  /** Arguments array containing: [database, uid, password, model, method, args, kwargs] */
  args: [string, number, string, string, string, any[], Record<string, any>?];
}

/**
 * Standard Odoo RPC endpoints.
 */
export enum OdooEndpoint {
  /** Authentication endpoint */
  AUTHENTICATE = '/web/session/authenticate',

  /** Dataset call endpoint (for call_kw) */
  CALL_KW = '/web/dataset/call_kw',

  /** Session information endpoint */
  SESSION_INFO = '/web/session/get_session_info',

  /** Session destruction endpoint */
  DESTROY = '/web/session/destroy',

  /** Database list endpoint */
  DB_LIST = '/web/database/list',

  /** Version info endpoint */
  VERSION_INFO = '/web/webclient/version_info',
}

/**
 * Response from authentication endpoint.
 */
export interface LoginResponse {
  /** User ID (false if authentication failed) */
  uid: number | false;

  /** User's default context */
  user_context?: Record<string, any>;

  /** Company ID */
  company_id?: number;

  /** Username */
  username?: string;

  /** Session ID */
  session_id?: string;

  /** Partner ID */
  partner_id?: number;

  /** List of allowed company IDs */
  allowed_company_ids?: number[];
}

/**
 * Error data from JSON-RPC error response.
 */
export type JsonRpcErrorData = JsonRpcErrorObject['data'];
