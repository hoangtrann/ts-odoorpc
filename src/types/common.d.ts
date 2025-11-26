/**
 * Common types and interfaces used throughout the ts-odoorpc library.
 *
 * This module defines fundamental types for:
 * - Connection configuration
 * - Domain filters (Odoo's search criteria)
 * - Field value types (Many2one, One2many, etc.)
 * - Search options
 * - Context management
 * - Field metadata
 */
/**
 * Configuration for connecting to an Odoo server.
 */
export interface ConnectionConfig {
  /** Hostname or IP address of the Odoo server */
  host: string;
  /** Port number (default: 8069) */
  port?: number;
  /** Protocol to use (default: 'http') */
  protocol?: 'http' | 'https';
  /** Request timeout in milliseconds (default: 120000) */
  timeout?: number;
}
/**
 * Odoo domain operators for filtering records.
 *
 * @see https://www.odoo.com/documentation/16.0/developer/reference/backend/orm.html#reference-orm-domains
 */
export type DomainOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'like'
  | 'ilike'
  | 'in'
  | 'not in'
  | '=like'
  | '=ilike'
  | 'not like'
  | 'not ilike';
/**
 * A domain leaf is a tuple of [field, operator, value].
 *
 * @example
 * ```typescript
 * ['name', '=', 'John Doe']
 * ['age', '>', 18]
 * ['state', 'in', ['draft', 'confirmed']]
 * ```
 */
export type DomainLeaf = [string, DomainOperator, any];
/**
 * Domain connectors for combining domain leaves.
 * - '&': AND operator (default)
 * - '|': OR operator
 * - '!': NOT operator
 */
export type DomainConnector = '&' | '|' | '!';
/**
 * A domain is an array of domain leaves and connectors.
 * Domains use prefix notation (Polish notation) for logical operators.
 *
 * @example
 * ```typescript
 * // Simple domain: [('name', '=', 'John')]
 * [['name', '=', 'John']]
 *
 * // AND domain (default): [('name', '=', 'John'), ('age', '>', 18)]
 * [['name', '=', 'John'], ['age', '>', 18]]
 *
 * // OR domain: [('name', '=', 'John'), '|', ('age', '>', 18)]
 * ['|', ['name', '=', 'John'], ['age', '>', 18]]
 *
 * // Complex: [('name', '=', 'John'), '|', ('age', '>', 18), ('active', '=', true)]
 * ['&', ['name', '=', 'John'], '|', ['age', '>', 18], ['active', '=', true]]
 * ```
 */
export type Domain = Array<DomainLeaf | DomainConnector>;
/**
 * Many2one field value - represents a reference to a single related record.
 * Odoo returns Many2one fields as [id, "Display Name"], but we store just the ID.
 * false indicates no relation set.
 */
export type Many2OneValue<T = any> = number | false;
/**
 * One2many field value - represents a list of related records.
 * Returns an array of record IDs.
 */
export type One2ManyValue = number[];
/**
 * Many2many field value - represents a list of related records.
 * Returns an array of record IDs.
 */
export type Many2ManyValue = number[];
/**
 * Selection field value - represents a choice from predefined options.
 * The generic parameter T allows type-safe selection values.
 *
 * @example
 * ```typescript
 * type OrderState = 'draft' | 'sent' | 'sale' | 'done' | 'cancel';
 * const state: SelectionValue<OrderState> = 'draft';
 * ```
 */
export type SelectionValue<T extends string = string> = T | false;
/**
 * Date field value - ISO date string (YYYY-MM-DD).
 * false indicates no date set.
 */
export type DateValue = string | false;
/**
 * DateTime field value - ISO datetime string (YYYY-MM-DD HH:mm:ss).
 * false indicates no datetime set.
 */
export type DateTimeValue = string | false;
/**
 * Options for search operations.
 */
export interface SearchOptions {
  /** Maximum number of records to return */
  limit?: number;
  /** Number of records to skip (for pagination) */
  offset?: number;
  /** Sort order, e.g., "name ASC, create_date DESC" */
  order?: string;
}
/**
 * Options for read operations.
 */
export interface ReadOptions {
  /** List of fields to read. If not specified, all fields are read. */
  fields?: string[];
}
/**
 * Context object for Odoo operations.
 * Context can contain various keys that affect behavior:
 * - lang: Language code (e.g., 'en_US', 'fr_FR')
 * - tz: Timezone (e.g., 'Europe/Paris')
 * - uid: User ID (set automatically on login)
 * - active_test: Whether to filter out archived records (default: true)
 * - And many other application-specific keys
 */
export type Context = Record<string, any>;
/**
 * Field type information returned by fields_get.
 */
export interface FieldDefinition {
  /** Field type (e.g., 'char', 'integer', 'many2one', 'selection') */
  type: string;
  /** Human-readable field label */
  string: string;
  /** Whether this field is required */
  required: boolean;
  /** Whether this field is readonly */
  readonly: boolean;
  /** Help text for the field */
  help?: string;
  /** For relational fields, the name of the related model */
  relation?: string;
  /** For selection fields, the list of available values */
  selection?: Array<[string, string]>;
  /** For char/text fields, the maximum size */
  size?: number;
  /** Whether the field is searchable */
  searchable?: boolean;
  /** Whether the field is sortable */
  sortable?: boolean;
  /** Whether the field is stored in the database */
  store?: boolean;
  /** Additional field-specific attributes */
  [key: string]: any;
}
/**
 * Result of a fields_get call - maps field names to their metadata.
 */
export type FieldsGetResult = Record<string, FieldDefinition>;
/**
 * Authentication response from Odoo login.
 */
export interface AuthResult {
  /** User ID of the authenticated user */
  uid: number;
  /** User's default context (language, timezone, etc.) */
  user_context: Context;
  /** Company ID of the user */
  company_id?: number;
  /** List of company IDs the user has access to */
  allowed_company_ids?: number[];
  /** Username */
  username?: string;
  /** Partner ID associated with the user */
  partner_id?: number;
}
/**
 * Session information for persistence.
 */
export interface SessionInfo {
  /** Connection configuration */
  config: ConnectionConfig;
  /** Database name */
  database: string;
  /** User ID */
  uid: number;
  /** Username */
  username: string;
  /** User context */
  context: Context;
  /** Session ID (cookie) */
  sessionId?: string;
}
//# sourceMappingURL=common.d.ts.map
