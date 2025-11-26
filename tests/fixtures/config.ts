/**
 * Test configuration and fixtures
 */

import type { ConnectionConfig } from '../../src/rpc/types';

/**
 * Default test configuration for connecting to a local Odoo instance
 */
export const TEST_CONFIG: ConnectionConfig = {
  host: process.env.ODOO_HOST || 'localhost',
  port: parseInt(process.env.ODOO_PORT || '8069', 10),
  protocol: (process.env.ODOO_PROTOCOL as 'http' | 'https') || 'http',
  timeout: 30000,
};

/**
 * Test database credentials
 */
export const TEST_CREDENTIALS = {
  database: process.env.ODOO_DB || 'test',
  username: process.env.ODOO_USER || 'admin',
  password: process.env.ODOO_PASSWORD || 'admin',
};

/**
 * Check if integration tests should be run
 * Set SKIP_INTEGRATION=true to skip tests that require a live Odoo server
 */
export const SKIP_INTEGRATION =
  process.env.SKIP_INTEGRATION === 'true' || process.env.CI === 'true';

/**
 * Helper to conditionally skip integration tests
 */
export const describeIntegration = SKIP_INTEGRATION ? describe.skip : describe;

/**
 * Helper to conditionally skip e2e tests
 */
export const describeE2E =
  process.env.SKIP_E2E === 'true' || process.env.CI === 'true' ? describe.skip : describe;
