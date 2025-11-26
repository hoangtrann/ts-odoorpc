/**
 * RecordSet class - represents one or more Odoo records
 *
 * Provides lazy loading, Proxy-based field access, and iteration support.
 * Records must be explicitly loaded via read() before accessing fields.
 */
import type { Model } from './Model';
/**
 * RecordSet class representing one or more Odoo model records.
 *
 * @template T - The type of the model records
 *
 * @example
 * ```typescript
 * // Create recordset and load data
 * const partners = Partner.browse([1, 2, 3]);
 * await partners.read(['name', 'email']);
 *
 * // Access fields synchronously after loading
 * for (const partner of partners) {
 *   console.log(partner.name, partner.email);
 * }
 * ```
 */
export declare class RecordSet<T = any> {
    private model;
    private _ids;
    private loaded;
    private cache;
    /**
     * Creates a new RecordSet instance.
     *
     * @param model - The Model instance this recordset belongs to
     * @param _ids - Array of record IDs
     */
    constructor(model: Model<T>, _ids: number[]);
    /**
     * Get the ID of a single record, or false for empty recordset.
     *
     * @throws {Error} If recordset contains multiple records
     * @returns The record ID or false
     */
    get id(): number | false;
    /**
     * Get all record IDs in this recordset.
     *
     * @returns Array of record IDs
     */
    get ids(): number[];
    /**
     * Get the number of records in this recordset.
     *
     * @returns Number of records
     */
    get length(): number;
    /**
     * Check if the recordset data has been loaded.
     *
     * @returns True if data has been loaded via read()
     */
    get isLoaded(): boolean;
    /**
     * Read and load field values for all records in this recordset.
     *
     * @param fields - Array of field names to load (optional, loads all if omitted)
     * @returns This recordset with loaded data
     * @throws {Error} If the read operation fails
     *
     * @example
     * ```typescript
     * const partners = Partner.browse([1, 2, 3]);
     * await partners.read(['name', 'email', 'phone']);
     *
     * // Now fields can be accessed synchronously
     * console.log(partners[0].name);
     * ```
     */
    read(fields?: string[]): Promise<RecordSet<T>>;
    /**
     * Update field values for all records in this recordset.
     *
     * @param values - Object containing field names and new values
     * @returns True if update was successful
     * @throws {Error} If the write operation fails
     *
     * @example
     * ```typescript
     * const partners = Partner.browse([1, 2, 3]);
     * await partners.write({ active: false, color: 1 });
     * ```
     */
    write(values: Partial<T>): Promise<boolean>;
    /**
     * Delete all records in this recordset.
     *
     * @returns True if deletion was successful
     * @throws {Error} If the unlink operation fails
     *
     * @example
     * ```typescript
     * const oldPartners = await Partner.search([['active', '=', false]]);
     * await oldPartners.unlink();
     * ```
     */
    unlink(): Promise<boolean>;
    /**
     * Create a new recordset with modified context.
     *
     * @param ctx - Context dictionary to merge with current context
     * @returns New RecordSet instance with updated context
     *
     * @example
     * ```typescript
     * const products = Product.browse([1, 2, 3])
     *   .withContext({ lang: 'fr_FR' });
     * await products.read(['name']); // Names in French
     * ```
     */
    withContext(ctx: Record<string, any>): RecordSet<T>;
    /**
     * Get field metadata for the model.
     *
     * @param fields - Optional array of field names (gets all fields if omitted)
     * @returns Field definitions from Odoo
     *
     * @example
     * ```typescript
     * const partner = Partner.browse(1);
     * const fields = await partner.fieldsGet(['name', 'email']);
     * console.log(fields.name.type); // 'char'
     * ```
     */
    fieldsGet(fields?: string[]): Promise<Record<string, any>>;
    /**
     * Iterate over individual records in this recordset.
     * Each iteration yields a single-record RecordSet with the same loaded state.
     *
     * @yields Single-record RecordSet instances
     *
     * @example
     * ```typescript
     * const partners = await Partner.searchRead([['customer', '=', true]], ['name', 'email']);
     *
     * for (const partner of partners) {
     *   console.log(partner.name, partner.email); // Synchronous access
     * }
     * ```
     */
    [Symbol.iterator](): Iterator<RecordSet<T>>;
    /**
     * Create a Proxy for field access.
     *
     * @private
     * @returns Proxied RecordSet instance
     */
    private createProxy;
}
//# sourceMappingURL=RecordSet.d.ts.map