"use strict";
/**
 * Model class - represents an Odoo model type
 *
 * Provides class-level CRUD operations, context management, and dynamic method calls.
 * Models are created through the Environment and cached in a registry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const RecordSet_1 = require("./RecordSet");
/**
 * Model class representing an Odoo model type.
 * Provides CRUD operations and dynamic method invocation.
 *
 * @template T - The type of records in this model
 *
 * @example
 * ```typescript
 * const Partner = odoo.env.model<ResPartner>('res.partner');
 *
 * // Search for records
 * const partners = await Partner.search([['customer', '=', true]]);
 *
 * // Create a record
 * const newPartner = await Partner.create({ name: 'John Doe' });
 * ```
 */
class Model {
    /**
     * Creates a new Model instance.
     *
     * Note: Models should typically be created via Environment.model() rather than directly.
     *
     * @param env - The Environment instance
     * @param modelName - The Odoo model name (e.g., 'res.partner')
     * @param options - Optional configuration (for future validation support)
     */
    constructor(env, modelName, options) {
        this.env = env;
        this.modelName = modelName;
        this.options = options;
    }
    /**
     * Get the model name.
     *
     * @returns The Odoo model name
     */
    get name() {
        return this.modelName;
    }
    /**
     * Search for records matching the domain criteria.
     *
     * @param domain - Domain filter criteria
     * @param options - Search options (limit, offset, order)
     * @returns Promise resolving to a RecordSet containing matching record IDs
     * @throws {Error} If the search operation fails
     *
     * @example
     * ```typescript
     * const partners = await Partner.search(
     *   [['customer', '=', true], ['active', '=', true]],
     *   { limit: 10, order: 'name ASC' }
     * );
     * ```
     */
    async search(domain = [], options) {
        const kwargs = {};
        if (options?.limit !== undefined) {
            kwargs.limit = options.limit;
        }
        if (options?.offset !== undefined) {
            kwargs.offset = options.offset;
        }
        if (options?.order !== undefined) {
            kwargs.order = options.order;
        }
        const ids = await this.env.executeKw(this.modelName, 'search', [domain], kwargs);
        return this.browse(ids);
    }
    /**
     * Search for records and read their field values in a single operation.
     * More efficient than calling search() then read() separately.
     *
     * @param domain - Domain filter criteria
     * @param fields - Array of field names to read
     * @param options - Search options (limit, offset, order)
     * @returns Promise resolving to a RecordSet with pre-loaded field data
     * @throws {Error} If the search_read operation fails
     *
     * @example
     * ```typescript
     * const partners = await Partner.searchRead(
     *   [['customer', '=', true]],
     *   ['name', 'email', 'phone'],
     *   { limit: 10 }
     * );
     *
     * // Fields are already loaded - no await needed
     * for (const partner of partners) {
     *   console.log(partner.name, partner.email);
     * }
     * ```
     */
    async searchRead(domain = [], fields = [], options) {
        const kwargs = {
            fields: fields.length > 0 ? fields : undefined,
        };
        if (options?.limit !== undefined) {
            kwargs.limit = options.limit;
        }
        if (options?.offset !== undefined) {
            kwargs.offset = options.offset;
        }
        if (options?.order !== undefined) {
            kwargs.order = options.order;
        }
        const data = await this.env.executeKw(this.modelName, 'search_read', [domain], kwargs);
        // Extract IDs and create recordset
        const ids = data.map((record) => record.id);
        const recordset = this.browse(ids);
        // Pre-populate cache with loaded data
        for (const record of data) {
            if (record && typeof record === 'object' && 'id' in record) {
                recordset.cache.set(record.id, record);
            }
        }
        recordset.loaded = true;
        return recordset;
    }
    /**
     * Read field values for specific record IDs.
     *
     * @param ids - Array of record IDs to read
     * @param fields - Optional array of field names (reads all fields if omitted)
     * @returns Promise resolving to array of record data
     * @throws {Error} If the read operation fails
     *
     * @example
     * ```typescript
     * const data = await Partner.read([1, 2, 3], ['name', 'email']);
     * console.log(data); // [{ id: 1, name: 'John', email: '...' }, ...]
     * ```
     */
    async read(ids, fields) {
        if (ids.length === 0) {
            return [];
        }
        const kwargs = {};
        if (fields && fields.length > 0) {
            kwargs.fields = fields;
        }
        const data = await this.env.executeKw(this.modelName, 'read', [ids], kwargs);
        // Optional validation (future use)
        if (this.options?.schema && this.options?.validate) {
            // TODO: Implement schema validation when superstruct support is added
        }
        return data;
    }
    /**
     * Create a new record with the given field values.
     *
     * @param values - Object containing field names and values
     * @returns Promise resolving to a RecordSet containing the new record
     * @throws {Error} If the create operation fails
     *
     * @example
     * ```typescript
     * const partner = await Partner.create({
     *   name: 'John Doe',
     *   email: 'john@example.com',
     *   phone: '+1234567890'
     * });
     *
     * await partner.read(['name']);
     * console.log(partner.name); // 'John Doe'
     * ```
     */
    async create(values) {
        const id = await this.env.executeKw(this.modelName, 'create', [values]);
        return this.browse(id);
    }
    /**
     * Update field values for specific records.
     *
     * @param ids - Array of record IDs to update
     * @param values - Object containing field names and new values
     * @returns Promise resolving to true if update was successful
     * @throws {Error} If the write operation fails
     *
     * @example
     * ```typescript
     * await Partner.write([1, 2, 3], { active: false });
     * ```
     */
    async write(ids, values) {
        if (ids.length === 0) {
            return true;
        }
        return this.env.executeKw(this.modelName, 'write', [ids, values]);
    }
    /**
     * Delete specific records.
     *
     * @param ids - Array of record IDs to delete
     * @returns Promise resolving to true if deletion was successful
     * @throws {Error} If the unlink operation fails
     *
     * @example
     * ```typescript
     * await Partner.unlink([1, 2, 3]);
     * ```
     */
    async unlink(ids) {
        if (ids.length === 0) {
            return true;
        }
        return this.env.executeKw(this.modelName, 'unlink', [ids]);
    }
    /**
     * Create a RecordSet from record ID(s).
     *
     * @param ids - Single ID or array of IDs
     * @returns RecordSet instance (data not loaded yet)
     *
     * @example
     * ```typescript
     * const partner = Partner.browse(1);
     * await partner.read(['name', 'email']);
     * console.log(partner.name);
     *
     * // Multiple records
     * const partners = Partner.browse([1, 2, 3]);
     * await partners.read(['name']);
     * for (const p of partners) {
     *   console.log(p.name);
     * }
     * ```
     */
    browse(ids) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        return new RecordSet_1.RecordSet(this, idArray);
    }
    /**
     * Create a new Model instance with modified context.
     * The context is immutable - this returns a new Model instance.
     *
     * @param ctx - Context dictionary to merge with current context
     * @returns New Model instance with updated context
     *
     * @example
     * ```typescript
     * const Product = odoo.env.model<ProductProduct>('product.product');
     * const ProductFR = Product.withContext({ lang: 'fr_FR' });
     *
     * const products = await ProductFR.searchRead([['sale_ok', '=', true]], ['name']);
     * // Product names will be in French
     * ```
     */
    withContext(ctx) {
        const newEnv = this.env.withContext(ctx);
        return newEnv.model(this.modelName);
    }
    /**
     * Attach a validation schema to this model (future use).
     *
     * @param schema - Superstruct or other validation schema
     * @returns New Model instance with schema attached
     *
     * @example
     * ```typescript
     * // Future API
     * const Partner = odoo.env
     *   .model('res.partner')
     *   .withSchema(ResPartnerSchema);
     * ```
     */
    withSchema(schema) {
        return new Model(this.env, this.modelName, {
            ...this.options,
            schema,
        });
    }
    /**
     * Call a custom method on the model.
     * Useful for calling custom Odoo methods that aren't part of the standard CRUD operations.
     *
     * @param method - The method name to call
     * @param args - Positional arguments (optional)
     * @param kwargs - Keyword arguments (optional)
     * @returns Promise resolving to the method's return value
     * @throws {Error} If the method call fails
     *
     * @example
     * ```typescript
     * // Call a custom method
     * const result = await Partner.call('my_custom_method', [arg1, arg2], { kwarg1: 'value' });
     *
     * // Call action_confirm on sale orders
     * await SaleOrder.call('action_confirm', [[1, 2, 3]]);
     * ```
     */
    async call(method, args = [], kwargs) {
        return this.env.executeKw(this.modelName, method, args, kwargs);
    }
    /**
     * Get field metadata for this model.
     *
     * @param fields - Optional array of field names (gets all fields if omitted)
     * @returns Promise resolving to field definitions
     * @throws {Error} If the fields_get operation fails
     *
     * @example
     * ```typescript
     * const fields = await Partner.fieldsGet(['name', 'email', 'phone']);
     * console.log(fields.name.type); // 'char'
     * console.log(fields.name.string); // 'Name'
     * console.log(fields.email.required); // false
     * ```
     */
    async fieldsGet(fields) {
        const kwargs = {};
        if (fields && fields.length > 0) {
            kwargs.attributes = fields;
        }
        return this.env.executeKw(this.modelName, 'fields_get', [], kwargs);
    }
    /**
     * Get the number of records matching the domain.
     *
     * @param domain - Domain filter criteria
     * @returns Promise resolving to the count of matching records
     * @throws {Error} If the search_count operation fails
     *
     * @example
     * ```typescript
     * const count = await Partner.searchCount([['customer', '=', true]]);
     * console.log(`Found ${count} customers`);
     * ```
     */
    async searchCount(domain = []) {
        return this.env.executeKw(this.modelName, 'search_count', [domain]);
    }
    /**
     * Check if any records exist matching the domain.
     *
     * @param domain - Domain filter criteria
     * @returns Promise resolving to true if at least one record exists
     *
     * @example
     * ```typescript
     * const hasCustomers = await Partner.exists([['customer', '=', true]]);
     * ```
     */
    async exists(domain = []) {
        const count = await this.searchCount(domain);
        return count > 0;
    }
    /**
     * Get the Environment instance.
     *
     * @returns The Environment instance
     */
    get environment() {
        return this.env;
    }
}
exports.Model = Model;
//# sourceMappingURL=Model.js.map