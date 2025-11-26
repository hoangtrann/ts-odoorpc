/**
 * ts-odoorpc - TypeScript library for Odoo RPC with type safety
 *
 * Main entry point for the library. Exports all public APIs.
 *
 * @example
 * ```typescript
 * import { OdooClient } from 'ts-odoorpc';
 *
 * const odoo = new OdooClient();
 * await odoo.connect({ host: 'localhost', port: 8069 });
 * await odoo.login('mydb', 'admin', 'password');
 *
 * const Partner = odoo.env.model('res.partner');
 * const partners = await Partner.search([['customer', '=', true]]);
 * ```
 */

// Core client
export { OdooClient } from './client/OdooClient';

// Environment and models
export { Environment } from './env/Environment';
export { Model } from './models/Model';
export { RecordSet } from './models/RecordSet';

// Services
export { DatabaseService } from './services/DatabaseService';
export { ReportService } from './services/ReportService';

// RPC layer (for advanced usage)
export { JsonRpcConnector } from './rpc/JsonRpcConnector';

// Error classes
export {
  OdooError,
  OdooRpcError,
  OdooAuthError,
} from './errors/OdooError';

// Type exports - Common types
export type {
  Domain,
  DomainLeaf,
  DomainOperator,
  DomainConnector,
  SearchOptions,
  FieldDefinition,
  FieldsGetResult,
  Many2OneValue,
  One2ManyValue,
  Many2ManyValue,
  DateValue,
  DateTimeValue,
  SelectionValue,
} from './types/common';

// Type exports - RPC types
export type {
  ConnectionConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  JsonRpcErrorData,
  LoginResponse,
} from './rpc/types';

// Type exports - Model types
export type { ModelOptions } from './models/types';

// Type exports - Service types
export type { DatabaseInfo } from './services/DatabaseService';
export type { ReportInfo } from './services/ReportService';
