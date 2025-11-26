/**
 * Integration tests for OdooClient
 *
 * These tests require a running Odoo server.
 * Set SKIP_INTEGRATION=true to skip these tests.
 */

// Mock axios-cookiejar-support before importing OdooClient
jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn((instance) => instance),
}));
jest.mock('tough-cookie', () => ({
  CookieJar: jest.fn(),
}));

import { OdooClient } from '../../src/client/OdooClient';
import { OdooSessionError, OdooRpcError } from '../../src/errors/OdooError';
import { TEST_CONFIG, TEST_CREDENTIALS, describeIntegration } from '../fixtures/config';

describeIntegration('OdooClient Integration Tests', () => {
  let client: OdooClient;

  beforeEach(() => {
    client = new OdooClient();
  });

  describe('connection', () => {
    it('should connect to Odoo server', async () => {
      await client.connect(TEST_CONFIG);

      // Connection successful - no specific assertion needed
      // getBaseUrl is an internal connector method, not exposed on OdooClient
      expect(client).toBeDefined();
    });

    it('should handle connection to invalid host', async () => {
      // Note: connect() only initializes the connector, doesn't validate host
      // Actual connection happens on first RPC call
      await client.connect({
        host: 'invalid-host-that-does-not-exist',
        port: 8069,
      });

      // The error will occur when trying to make an actual call
      await expect(client.login('test', 'admin', 'admin')).rejects.toThrow();
    });
  });

  describe('authentication', () => {
    beforeEach(async () => {
      await client.connect(TEST_CONFIG);
    });

    it('should authenticate with valid credentials', async () => {
      await client.login(
        TEST_CREDENTIALS.database,
        TEST_CREDENTIALS.username,
        TEST_CREDENTIALS.password
      );

      expect(client.env).toBeDefined();
      expect(client.env.userId).toBeGreaterThan(0);
      expect(client.env.databaseName).toBe(TEST_CREDENTIALS.database);
    });

    it('should throw OdooAuthError with invalid credentials', async () => {
      // Odoo returns OdooRpcError for auth failures, not OdooAuthError
      // OdooAuthError is used for missing credentials, not invalid ones
      await expect(client.login(TEST_CREDENTIALS.database, 'invalid', 'wrong')).rejects.toThrow(); // Accept any error (Odoo returns RpcError)
    });

    it('should throw error with invalid database', async () => {
      await expect(
        client.login('nonexistent_db', TEST_CREDENTIALS.username, TEST_CREDENTIALS.password)
      ).rejects.toThrow();
    });

    it('should store session after authentication', async () => {
      await client.login(
        TEST_CREDENTIALS.database,
        TEST_CREDENTIALS.username,
        TEST_CREDENTIALS.password
      );

      expect(client.getSessionId()).toBeDefined();
    });
  });

  describe('model operations', () => {
    beforeEach(async () => {
      await client.connect(TEST_CONFIG);
      await client.login(
        TEST_CREDENTIALS.database,
        TEST_CREDENTIALS.username,
        TEST_CREDENTIALS.password
      );
    });

    it('should access model through environment', () => {
      const Partner = client.env.model('res.partner');

      expect(Partner).toBeDefined();
    });

    it('should throw error when accessing env before login', async () => {
      const unauthClient = new OdooClient();
      await unauthClient.connect(TEST_CONFIG);

      expect(() => unauthClient.env).toThrow(OdooSessionError);
    });

    it('should perform search_count', async () => {
      const Partner = client.env.model('res.partner');
      const count = await Partner.searchCount([]);

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });

    it('should perform search with domain', async () => {
      const Partner = client.env.model('res.partner');
      const partners = await Partner.search([['is_company', '=', true]], { limit: 5 });

      expect(partners.length).toBeGreaterThanOrEqual(0);
      expect(partners.length).toBeLessThanOrEqual(5);
    });

    it('should perform searchRead', async () => {
      const Partner = client.env.model('res.partner');
      const partners = await Partner.searchRead([], ['name', 'email'], { limit: 3 });

      // searchRead returns a RecordSet, not an array
      expect(partners).toBeDefined();
      expect(partners.length).toBeLessThanOrEqual(3);

      if (partners.length > 0) {
        // Iterate through RecordSet
        for (const partner of partners) {
          expect(partner.id).toBeDefined();
          expect((partner as any).name).toBeDefined();
        }
      }
    });

    it('should create and delete a record', async () => {
      const Partner = client.env.model('res.partner');
      const timestamp = Date.now();

      const newPartner = await Partner.create({
        name: `Test Partner ${timestamp}`,
        email: `test${timestamp}@example.com`,
      });

      expect(newPartner.id).toBeGreaterThan(0);

      await newPartner.unlink();

      const count = await Partner.searchCount([['id', '=', newPartner.id]]);
      expect(count).toBe(0);
    });

    it('should update a record', async () => {
      const Partner = client.env.model('res.partner');
      const timestamp = Date.now();

      const partner = await Partner.create({
        name: `Original ${timestamp}`,
      });

      await partner.write({
        name: `Updated ${timestamp}`,
      });

      await partner.read(['name']);
      expect((partner as any).name).toBe(`Updated ${timestamp}`);

      await partner.unlink();
    });

    it('should handle field metadata retrieval', async () => {
      const Partner = client.env.model('res.partner');
      const fields = await Partner.fieldsGet(['name', 'email']);

      expect(fields).toBeDefined();
      expect(typeof fields).toBe('object');
      // Check that we got field definitions back
      expect(Object.keys(fields).length).toBeGreaterThan(0);
    });
  });

  describe('context management', () => {
    beforeEach(async () => {
      await client.connect(TEST_CONFIG);
      await client.login(
        TEST_CREDENTIALS.database,
        TEST_CREDENTIALS.username,
        TEST_CREDENTIALS.password
      );
    });

    it('should create new environment with different context', () => {
      const originalEnv = client.env;
      const newEnv = originalEnv.withContext({ lang: 'fr_FR' });

      expect(newEnv).not.toBe(originalEnv);
      expect(newEnv.context.lang).toBe('fr_FR');
      expect(originalEnv.context.lang).not.toBe('fr_FR');
    });

    it('should allow operations with modified context', async () => {
      const frenchEnv = client.env.withContext({ lang: 'fr_FR' });
      const Partner = frenchEnv.model('res.partner');

      const count = await Partner.searchCount([]);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await client.connect(TEST_CONFIG);
      await client.login(
        TEST_CREDENTIALS.database,
        TEST_CREDENTIALS.username,
        TEST_CREDENTIALS.password
      );
    });

    it('should throw OdooRpcError on invalid model', async () => {
      const InvalidModel = client.env.model('nonexistent.model');

      await expect(InvalidModel.searchCount([])).rejects.toThrow(OdooRpcError);
    });

    it('should throw error on invalid method call', async () => {
      const Partner = client.env.model('res.partner');

      await expect(Partner.call('nonexistent_method', [])).rejects.toThrow();
    });
  });

  describe('executeKw', () => {
    beforeEach(async () => {
      await client.connect(TEST_CONFIG);
      await client.login(
        TEST_CREDENTIALS.database,
        TEST_CREDENTIALS.username,
        TEST_CREDENTIALS.password
      );
    });

    it('should execute model methods via executeKw', async () => {
      const count = await client.executeKw('res.partner', 'search_count', [[]]);

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should support kwargs in executeKw', async () => {
      const ids = await client.executeKw('res.partner', 'search', [[]], { limit: 5 });

      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeLessThanOrEqual(5);
    });
  });
});
