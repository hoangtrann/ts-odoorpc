import { Model } from '../models/Model';

/**
 * Environment manages the execution context and model registry.
 *
 * Each environment represents a specific execution context with:
 * - A database connection
 * - A user ID
 * - Context variables (language, timezone, etc.)
 * - A registry of cached model instances
 *
 * Environments are immutable - calling withContext() returns a new Environment instance.
 *
 * @example
 * ```typescript
 * const env = odoo.env;
 * const Partner = env.model<ResPartner>('res.partner');
 *
 * // Create a new environment with different context
 * const frenchEnv = env.withContext({ lang: 'fr_FR' });
 * const FrenchPartner = frenchEnv.model<ResPartner>('res.partner');
 * ```
 */
export class Environment {
  private registry: Map<string, Model<any>> = new Map();

  /**
   * Creates a new Environment instance.
   *
   * @param client - Reference to the OdooClient
   * @param database - Database name
   * @param uid - User ID (from authentication)
   * @param _context - Context dictionary with user preferences and settings
   */
  constructor(
    private client: any, // Will be OdooClient, but we avoid circular dependency
    private database: string,
    private uid: number,
    private _context: Record<string, any>
  ) {}

  /**
   * Get a model instance from the registry (cached).
   *
   * Models are cached per environment to avoid recreating them.
   * Each call with the same model name returns the same Model instance.
   *
   * @param modelName - Odoo model name (e.g., 'res.partner', 'sale.order')
   * @returns Model instance for the specified model
   *
   * @example
   * ```typescript
   * const Partner = env.model<ResPartner>('res.partner');
   * const Order = env.model<SaleOrder>('sale.order');
   * ```
   */
  model<T = any>(modelName: string): Model<T> {
    if (!this.registry.has(modelName)) {
      this.registry.set(modelName, new Model<T>(this, modelName));
    }
    return this.registry.get(modelName) as Model<T>;
  }

  /**
   * Create a new environment with modified context (immutable).
   *
   * The original environment is not modified. This allows for temporary
   * context changes without affecting other parts of the application.
   *
   * @param ctx - Context values to merge with existing context
   * @returns New Environment instance with merged context
   *
   * @example
   * ```typescript
   * // Get products with French translations
   * const frenchEnv = env.withContext({ lang: 'fr_FR' });
   * const Product = frenchEnv.model<Product>('product.product');
   *
   * // Original environment is unchanged
   * const Partner = env.model('res.partner'); // Still uses original context
   * ```
   */
  withContext(ctx: Record<string, any>): Environment {
    return new Environment(this.client, this.database, this.uid, {
      ...this._context,
      ...ctx,
    });
  }

  /**
   * Get the current user as a RecordSet.
   *
   * Provides convenient access to the authenticated user's record.
   *
   * @returns RecordSet pointing to the current user
   *
   * @example
   * ```typescript
   * const user = await env.user.read(['name', 'email']);
   * console.log(user.name, user.email);
   * ```
   */
  get user(): any {
    // Returns RecordSet<ResUsers>, but we avoid circular dependency
    return this.model('res.users').browse(this.uid);
  }

  /**
   * Get the current context dictionary.
   *
   * @returns Readonly copy of the context
   */
  get context(): Record<string, any> {
    return { ...this._context };
  }

  /**
   * Get the current user ID.
   *
   * @returns User ID from authentication
   */
  get userId(): number {
    return this.uid;
  }

  /**
   * Get the database name.
   *
   * @returns Database name
   */
  get databaseName(): string {
    return this.database;
  }

  /**
   * Execute a model method (delegates to client).
   *
   * @internal
   */
  async executeKw(
    model: string,
    method: string,
    args: any[],
    kwargs?: Record<string, any>
  ): Promise<any> {
    return this.client.executeKw(model, method, args, kwargs);
  }

  /**
   * Get reference to the OdooClient.
   *
   * @internal
   */
  getClient(): any {
    return this.client;
  }
}
