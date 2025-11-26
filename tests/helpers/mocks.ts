/**
 * Mock factories for testing
 */

import { JsonRpcConnector } from '../../src/rpc/JsonRpcConnector';
import { Environment } from '../../src/env/Environment';

/**
 * Creates a mock JsonRpcConnector for testing
 */
export function createMockConnector(): jest.Mocked<JsonRpcConnector> {
  return {
    call: jest.fn(),
    getSessionId: jest.fn(),
    setSessionId: jest.fn(),
    clearSession: jest.fn(),
    getBaseUrl: jest.fn().mockReturnValue('http://localhost:8069'),
  } as any;
}

/**
 * Creates a mock Environment for testing
 */
export function createMockEnvironment(overrides?: Partial<Environment>): Environment {
  const mockConnector = createMockConnector();

  const mockEnv = {
    client: mockConnector as any,
    databaseName: 'test',
    userId: 2,
    context: { lang: 'en_US', tz: 'UTC' },
    model: jest.fn(),
    withContext: jest.fn(),
    ...overrides,
  } as any;

  return mockEnv;
}

/**
 * Mock responses from Odoo server
 */
export const mockOdooResponses = {
  authenticate: {
    jsonrpc: '2.0',
    id: 1,
    result: {
      uid: 2,
      user_context: {
        lang: 'en_US',
        tz: 'UTC',
        uid: 2,
      },
      session_id: 'test-session-123',
      db: 'test',
      username: 'admin',
    },
  },

  searchRead: (records: any[]) => ({
    jsonrpc: '2.0',
    id: 1,
    result: records,
  }),

  search: (ids: number[]) => ({
    jsonrpc: '2.0',
    id: 1,
    result: ids,
  }),

  searchCount: (count: number) => ({
    jsonrpc: '2.0',
    id: 1,
    result: count,
  }),

  read: (records: any[]) => ({
    jsonrpc: '2.0',
    id: 1,
    result: records,
  }),

  create: (id: number) => ({
    jsonrpc: '2.0',
    id: 1,
    result: id,
  }),

  write: () => ({
    jsonrpc: '2.0',
    id: 1,
    result: true,
  }),

  unlink: () => ({
    jsonrpc: '2.0',
    id: 1,
    result: true,
  }),

  fieldsGet: (fields: Record<string, any>) => ({
    jsonrpc: '2.0',
    id: 1,
    result: fields,
  }),

  error: (message: string, code = 200, data?: any) => ({
    jsonrpc: '2.0',
    id: 1,
    error: {
      code,
      message,
      data: data || {
        message,
        name: 'OdooError',
      },
    },
  }),
};

/**
 * Sample field definitions for testing
 */
export const mockFieldDefinitions = {
  resPartner: {
    id: {
      type: 'integer',
      string: 'ID',
      required: false,
      readonly: true,
    },
    name: {
      type: 'char',
      string: 'Name',
      required: true,
      readonly: false,
      size: 128,
    },
    email: {
      type: 'char',
      string: 'Email',
      required: false,
      readonly: false,
    },
    phone: {
      type: 'char',
      string: 'Phone',
      required: false,
      readonly: false,
    },
    is_company: {
      type: 'boolean',
      string: 'Is a Company',
      required: false,
      readonly: false,
    },
    parent_id: {
      type: 'many2one',
      string: 'Related Company',
      required: false,
      readonly: false,
      relation: 'res.partner',
    },
    child_ids: {
      type: 'one2many',
      string: 'Contacts',
      required: false,
      readonly: false,
      relation: 'res.partner',
      relation_field: 'parent_id',
    },
    category_id: {
      type: 'many2many',
      string: 'Tags',
      required: false,
      readonly: false,
      relation: 'res.partner.category',
    },
    create_date: {
      type: 'datetime',
      string: 'Created on',
      required: false,
      readonly: true,
    },
    write_date: {
      type: 'datetime',
      string: 'Last Updated on',
      required: false,
      readonly: true,
    },
  },
};

/**
 * Sample record data for testing
 */
export const mockRecords = {
  partners: [
    {
      id: 1,
      name: 'Azure Interior',
      email: 'azure@example.com',
      phone: '+1-555-0100',
      is_company: true,
    },
    {
      id: 2,
      name: 'Brandon Freeman',
      email: 'brandon@example.com',
      phone: '+1-555-0101',
      is_company: false,
      parent_id: [1, 'Azure Interior'],
    },
    {
      id: 3,
      name: 'Deco Addict',
      email: 'deco@example.com',
      phone: '+1-555-0102',
      is_company: true,
    },
  ],
};
