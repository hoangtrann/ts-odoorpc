/**
 * Model-specific types for the ts-odoorpc library.
 *
 * This module defines types used by the Model and RecordSet classes.
 */

/**
 * Options for creating a Model instance.
 * These options support future extensibility, particularly for runtime validation.
 *
 * @template T - The TypeScript interface representing the model's fields
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ModelOptions<T = any> {
  /**
   * Optional schema for runtime validation (future feature).
   * When provided, the Model will validate all data returned from Odoo
   * against this schema. This is useful for catching data integrity issues
   * and ensuring type safety at runtime.
   *
   * @example
   * ```typescript
   * import { object, number, string } from 'superstruct';
   *
   * const PartnerSchema = object({
   *   id: number(),
   *   name: string(),
   *   email: string()
   * });
   *
   * const Partner = odoo.env.model<ResPartner>('res.partner', {
   *   schema: PartnerSchema,
   *   validate: true
   * });
   * ```
   */
  schema?: any;

  /**
   * Whether to enable runtime validation (default: false).
   * Only has effect if schema is provided.
   */
  validate?: boolean;

  /**
   * Whether to cache field metadata after first retrieval (default: true).
   * Field metadata from fields_get() can be cached to reduce network calls.
   */
  cacheFieldMetadata?: boolean;
}
