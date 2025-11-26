"use strict";
/**
 * RecordSet class - represents one or more Odoo records
 *
 * Provides lazy loading, Proxy-based field access, and iteration support.
 * Records must be explicitly loaded via read() before accessing fields.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordSet = void 0;
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
class RecordSet {
    /**
     * Creates a new RecordSet instance.
     *
     * @param model - The Model instance this recordset belongs to
     * @param _ids - Array of record IDs
     */
    constructor(model, _ids) {
        this.model = model;
        this._ids = _ids;
        this.loaded = false;
        this.cache = new Map();
        // Return a Proxy to enable field access
        return this.createProxy();
    }
    /**
     * Get the ID of a single record, or false for empty recordset.
     *
     * @throws {Error} If recordset contains multiple records
     * @returns The record ID or false
     */
    get id() {
        if (this._ids.length === 0) {
            return false;
        }
        if (this._ids.length > 1) {
            throw new Error('Cannot access id on multi-record RecordSet. Use ids property or iterate.');
        }
        return this._ids[0];
    }
    /**
     * Get all record IDs in this recordset.
     *
     * @returns Array of record IDs
     */
    get ids() {
        return [...this._ids];
    }
    /**
     * Get the number of records in this recordset.
     *
     * @returns Number of records
     */
    get length() {
        return this._ids.length;
    }
    /**
     * Check if the recordset data has been loaded.
     *
     * @returns True if data has been loaded via read()
     */
    get isLoaded() {
        return this.loaded;
    }
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
    async read(fields) {
        if (this._ids.length === 0) {
            this.loaded = true;
            return this;
        }
        const data = await this.model.read(this._ids, fields);
        // Store in cache by ID
        for (const record of data) {
            if (record && typeof record === 'object' && 'id' in record) {
                this.cache.set(record.id, record);
            }
        }
        this.loaded = true;
        return this;
    }
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
    async write(values) {
        if (this._ids.length === 0) {
            return true;
        }
        const result = await this.model.write(this._ids, values);
        // Invalidate cache after write
        if (result) {
            this.loaded = false;
            this.cache.clear();
        }
        return result;
    }
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
    async unlink() {
        if (this._ids.length === 0) {
            return true;
        }
        const result = await this.model.unlink(this._ids);
        // Clear cache after unlink
        if (result) {
            this.loaded = false;
            this.cache.clear();
            this._ids = [];
        }
        return result;
    }
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
    withContext(ctx) {
        const newModel = this.model.withContext(ctx);
        const recordset = new RecordSet(newModel, this._ids);
        // Copy loaded state and cache if available
        if (this.loaded) {
            recordset.loaded = true;
            recordset.cache = new Map(this.cache);
        }
        return recordset;
    }
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
    async fieldsGet(fields) {
        return this.model.fieldsGet(fields);
    }
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
    *[Symbol.iterator]() {
        for (const id of this._ids) {
            const single = this.model.browse(id);
            // Transfer loaded state and cached data
            if (this.loaded && this.cache.has(id)) {
                single.loaded = true;
                const record = this.cache.get(id);
                if (record) {
                    single.cache.set(id, record);
                }
            }
            yield single;
        }
    }
    /**
     * Create a Proxy for field access.
     *
     * @private
     * @returns Proxied RecordSet instance
     */
    createProxy() {
        return new Proxy(this, {
            get(target, prop) {
                // Handle symbols and RecordSet own properties/methods
                if (typeof prop === 'symbol' || prop in target) {
                    return Reflect.get(target, prop);
                }
                // Handle numeric array-like access
                if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                    const index = parseInt(prop, 10);
                    if (index >= 0 && index < target._ids.length) {
                        const id = target._ids[index];
                        const single = target.model.browse(id);
                        // Transfer loaded state and cached data
                        if (target.loaded && target.cache.has(id)) {
                            single.loaded = true;
                            const record = target.cache.get(id);
                            if (record) {
                                single.cache.set(id, record);
                            }
                        }
                        return single;
                    }
                    return undefined;
                }
                // Field access - check if data is loaded
                if (!target.loaded) {
                    throw new Error(`Field '${prop}' not loaded. Call .read() or use .searchRead() first.`);
                }
                // Multi-record check for field access
                if (target._ids.length !== 1) {
                    throw new Error(`Cannot access field '${prop}' on multi-record RecordSet. Iterate first.`);
                }
                const id = target._ids[0];
                const data = target.cache.get(id) || {};
                const value = data[prop];
                // Handle Many2one fields - return just ID
                // Odoo Many2one format: [id, "Display Name"]
                if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'number') {
                    return value[0];
                }
                return value;
            },
            set() {
                throw new Error('Direct field assignment not supported. Use .write() method instead.');
            },
        });
    }
}
exports.RecordSet = RecordSet;
//# sourceMappingURL=RecordSet.js.map