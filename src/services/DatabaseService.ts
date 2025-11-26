import { JsonRpcConnector } from '../rpc/JsonRpcConnector';
import { OdooRpcError } from '../errors/OdooError';

/**
 * Information about a database
 */
export interface DatabaseInfo {
  /** Database name */
  name: string;
}

/**
 * Service for Odoo database operations.
 * Provides methods for listing, creating, dropping, duplicating, and managing databases.
 *
 * @example
 * ```typescript
 * const odoo = new OdooClient();
 * await odoo.connect({ host: 'localhost', port: 8069 });
 *
 * // List all databases
 * const databases = await odoo.db.list();
 *
 * // Create a new database
 * await odoo.db.create('newdb', 'admin_password', 'en_US');
 * ```
 */
export class DatabaseService {
  constructor(private connector: JsonRpcConnector) {}

  /**
   * List all databases on the Odoo server.
   *
   * @returns Promise resolving to an array of database names
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * const databases = await odoo.db.list();
   * console.log('Available databases:', databases);
   * ```
   */
  async list(): Promise<string[]> {
    try {
      const result = await this.connector.call<string[]>(
        '/web/database/list',
        {}
      );
      return result;
    } catch (error) {
      throw this.wrapError(error, 'Failed to list databases');
    }
  }

  /**
   * Create a new database.
   *
   * @param dbName - Name of the database to create
   * @param adminPassword - Master password for database operations
   * @param lang - Language code (e.g., 'en_US', 'fr_FR')
   * @param demo - Whether to load demo data (default: false)
   * @param country - Country code (optional)
   * @param userPassword - Password for the admin user (default: 'admin')
   * @returns Promise resolving when database is created
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * await odoo.db.create('mydb', 'master_password', 'en_US', false);
   * ```
   */
  async create(
    dbName: string,
    adminPassword: string,
    lang: string,
    _demo: boolean = false,
    country?: string,
    userPassword: string = 'admin'
  ): Promise<void> {
    try {
      await this.connector.call('/web/database/create', {
        master_pwd: adminPassword,
        name: dbName,
        lang,
        password: userPassword,
        login: 'admin',
        country_code: country,
        phone: '',
      });
    } catch (error) {
      throw this.wrapError(error, `Failed to create database '${dbName}'`);
    }
  }

  /**
   * Drop (delete) a database.
   *
   * @param dbName - Name of the database to drop
   * @param adminPassword - Master password for database operations
   * @returns Promise resolving to true if successful
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * await odoo.db.drop('olddb', 'master_password');
   * ```
   */
  async drop(dbName: string, adminPassword: string): Promise<boolean> {
    try {
      const result = await this.connector.call<boolean>(
        '/web/database/drop',
        {
          master_pwd: adminPassword,
          name: dbName,
        }
      );
      return result;
    } catch (error) {
      throw this.wrapError(error, `Failed to drop database '${dbName}'`);
    }
  }

  /**
   * Duplicate an existing database.
   *
   * @param dbName - Name of the database to duplicate
   * @param newDbName - Name for the new database
   * @param adminPassword - Master password for database operations
   * @returns Promise resolving when database is duplicated
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * await odoo.db.duplicate('proddb', 'testdb', 'master_password');
   * ```
   */
  async duplicate(
    dbName: string,
    newDbName: string,
    adminPassword: string
  ): Promise<void> {
    try {
      await this.connector.call('/web/database/duplicate', {
        master_pwd: adminPassword,
        name: dbName,
        new_name: newDbName,
      });
    } catch (error) {
      throw this.wrapError(
        error,
        `Failed to duplicate database '${dbName}' to '${newDbName}'`
      );
    }
  }

  /**
   * Create a database backup (dump).
   *
   * @param dbName - Name of the database to backup
   * @param adminPassword - Master password for database operations
   * @param format - Backup format: 'zip' (default) or 'dump'
   * @returns Promise resolving to the backup data as base64 string
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * const backup = await odoo.db.dump('mydb', 'master_password', 'zip');
   * // Save backup to file
   * fs.writeFileSync('backup.zip', Buffer.from(backup, 'base64'));
   * ```
   */
  async dump(
    dbName: string,
    adminPassword: string,
    format: 'zip' | 'dump' = 'zip'
  ): Promise<string> {
    try {
      const result = await this.connector.call<string>(
        '/web/database/backup',
        {
          master_pwd: adminPassword,
          name: dbName,
          backup_format: format,
        }
      );
      return result;
    } catch (error) {
      throw this.wrapError(error, `Failed to dump database '${dbName}'`);
    }
  }

  /**
   * Restore a database from backup.
   *
   * @param dbName - Name for the restored database
   * @param adminPassword - Master password for database operations
   * @param backupData - Backup data as base64 string
   * @param copy - Whether this is a copy (affects database UUID)
   * @returns Promise resolving when database is restored
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * const backupData = fs.readFileSync('backup.zip').toString('base64');
   * await odoo.db.restore('restored_db', 'master_password', backupData, false);
   * ```
   */
  async restore(
    dbName: string,
    adminPassword: string,
    backupData: string,
    copy: boolean = false
  ): Promise<void> {
    try {
      await this.connector.call('/web/database/restore', {
        master_pwd: adminPassword,
        name: dbName,
        data: backupData,
        copy,
      });
    } catch (error) {
      throw this.wrapError(error, `Failed to restore database '${dbName}'`);
    }
  }

  /**
   * Change the master password.
   *
   * @param oldPassword - Current master password
   * @param newPassword - New master password
   * @returns Promise resolving when password is changed
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * await odoo.db.changePassword('old_master_pwd', 'new_master_pwd');
   * ```
   */
  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await this.connector.call('/web/database/change_password', {
        master_pwd: oldPassword,
        master_pwd_new: newPassword,
      });
    } catch (error) {
      throw this.wrapError(error, 'Failed to change master password');
    }
  }

  /**
   * Get the server version information.
   *
   * @returns Promise resolving to version string
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * const version = await odoo.db.serverVersion();
   * console.log('Odoo version:', version);
   * ```
   */
  async serverVersion(): Promise<string> {
    try {
      const result = await this.connector.call<string>(
        '/web/database/get_server_version',
        {}
      );
      return result;
    } catch (error) {
      throw this.wrapError(error, 'Failed to get server version');
    }
  }

  /**
   * Wrap errors with additional context
   */
  private wrapError(error: unknown, context: string): OdooRpcError {
    if (error instanceof OdooRpcError) {
      return new OdooRpcError(
        `${context}: ${error.message}`,
        error.code,
        error.data
      );
    }

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return new OdooRpcError(`${context}: ${message}`);
  }
}
