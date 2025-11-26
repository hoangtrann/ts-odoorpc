/**
 * Unit tests for Model class
 */

import { Model, type IEnvironment } from '../../../src/models/Model';
import { RecordSet } from '../../../src/models/RecordSet';
import { mockFieldDefinitions } from '../../helpers/mocks';

describe('Model', () => {
  let mockEnv: jest.Mocked<IEnvironment>;
  let model: Model<any>;

  beforeEach(() => {
    mockEnv = {
      executeKw: jest.fn(),
      withContext: jest.fn(),
      model: jest.fn(),
      context: { lang: 'en_US', tz: 'UTC' },
    } as any;

    model = new Model(mockEnv, 'res.partner');
  });

  describe('constructor', () => {
    it('should create a model instance with name', () => {
      expect(model.name).toBe('res.partner');
    });

    it('should create a model with options', () => {
      const schema = { name: 'string' };
      const modelWithOptions = new Model(mockEnv, 'res.partner', { schema });
      expect(modelWithOptions.name).toBe('res.partner');
    });
  });

  describe('name getter', () => {
    it('should return the model name', () => {
      expect(model.name).toBe('res.partner');
    });
  });

  describe('search', () => {
    it('should search with empty domain', async () => {
      mockEnv.executeKw.mockResolvedValue([1, 2, 3]);

      const result = await model.search();

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'search', [[]], {});
      expect(result).toBeInstanceOf(RecordSet);
      expect(result.ids).toEqual([1, 2, 3]);
    });

    it('should search with domain', async () => {
      const domain = [['customer', '=', true]];
      mockEnv.executeKw.mockResolvedValue([1, 2]);

      const result = await model.search(domain);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'search', [domain], {});
      expect(result.ids).toEqual([1, 2]);
    });

    it('should search with options (limit, offset, order)', async () => {
      const domain = [['active', '=', true]];
      const options = { limit: 10, offset: 5, order: 'name ASC' };
      mockEnv.executeKw.mockResolvedValue([1, 2, 3]);

      await model.search(domain, options);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'search', [domain], {
        limit: 10,
        offset: 5,
        order: 'name ASC',
      });
    });

    it('should search with partial options', async () => {
      mockEnv.executeKw.mockResolvedValue([1]);

      await model.search([], { limit: 5 });

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'search', [[]], {
        limit: 5,
      });
    });
  });

  describe('searchRead', () => {
    it('should search and read with empty domain and fields', async () => {
      const mockData = [
        { id: 1, name: 'Partner 1' },
        { id: 2, name: 'Partner 2' },
      ];
      mockEnv.executeKw.mockResolvedValue(mockData);

      const result = await model.searchRead();

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'search_read', [[]], {
        fields: undefined,
      });
      expect(result.ids).toEqual([1, 2]);
      expect(result.isLoaded).toBe(true);
    });

    it('should search and read with domain and fields', async () => {
      const domain = [['customer', '=', true]];
      const fields = ['name', 'email'];
      const mockData = [{ id: 1, name: 'Customer', email: 'customer@example.com' }];
      mockEnv.executeKw.mockResolvedValue(mockData);

      const result = await model.searchRead(domain, fields);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'search_read', [domain], {
        fields,
      });
      expect(result.ids).toEqual([1]);
    });

    it('should search and read with options', async () => {
      const domain = [['active', '=', true]];
      const fields = ['name'];
      const options = { limit: 10, offset: 5, order: 'name DESC' };
      const mockData = [{ id: 1, name: 'Partner' }];
      mockEnv.executeKw.mockResolvedValue(mockData);

      await model.searchRead(domain, fields, options);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'search_read', [domain], {
        fields,
        limit: 10,
        offset: 5,
        order: 'name DESC',
      });
    });

    it('should pre-populate cache with valid records', async () => {
      const mockData = [
        { id: 1, name: 'Valid 1' },
        { id: 2, name: 'Valid 2' },
      ];
      mockEnv.executeKw.mockResolvedValue(mockData);

      const result = await model.searchRead([], ['name']);

      expect(result.ids).toEqual([1, 2]);
      expect(result.isLoaded).toBe(true);
      // Verify cache is populated by accessing single record
      const firstRecord = result[0];
      expect(firstRecord.name).toBe('Valid 1');
    });
  });

  describe('read', () => {
    it('should read records with ids', async () => {
      const mockData = [
        { id: 1, name: 'Partner 1' },
        { id: 2, name: 'Partner 2' },
      ];
      mockEnv.executeKw.mockResolvedValue(mockData);

      const result = await model.read([1, 2]);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'read', [[1, 2]], {});
      expect(result).toEqual(mockData);
    });

    it('should read records with specific fields', async () => {
      const mockData = [{ id: 1, name: 'Partner' }];
      mockEnv.executeKw.mockResolvedValue(mockData);

      const result = await model.read([1], ['name', 'email']);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'read', [[1]], {
        fields: ['name', 'email'],
      });
      expect(result).toEqual(mockData);
    });

    it('should return empty array for empty ids', async () => {
      const result = await model.read([]);

      expect(mockEnv.executeKw).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should not validate when no schema provided', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      mockEnv.executeKw.mockResolvedValue(mockData);

      const result = await model.read([1]);

      expect(result).toEqual(mockData);
    });
  });

  describe('create', () => {
    it('should create a record', async () => {
      mockEnv.executeKw.mockResolvedValue(42);

      const result = await model.create({ name: 'New Partner' });

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'create', [
        { name: 'New Partner' },
      ]);
      expect(result).toBeInstanceOf(RecordSet);
      expect(result.id).toBe(42);
    });

    it('should create record with multiple fields', async () => {
      mockEnv.executeKw.mockResolvedValue(10);

      await model.create({
        name: 'Test Partner',
        email: 'test@example.com',
        phone: '+1234567890',
      });

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'create', [
        {
          name: 'Test Partner',
          email: 'test@example.com',
          phone: '+1234567890',
        },
      ]);
    });
  });

  describe('write', () => {
    it('should write to records', async () => {
      mockEnv.executeKw.mockResolvedValue(true);

      const result = await model.write([1, 2, 3], { name: 'Updated' });

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'write', [
        [1, 2, 3],
        { name: 'Updated' },
      ]);
      expect(result).toBe(true);
    });

    it('should return true for empty ids array', async () => {
      const result = await model.write([], { name: 'Test' });

      expect(mockEnv.executeKw).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should write multiple fields', async () => {
      mockEnv.executeKw.mockResolvedValue(true);

      await model.write([5], {
        name: 'New Name',
        email: 'new@example.com',
        active: false,
      });

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'write', [
        [5],
        { name: 'New Name', email: 'new@example.com', active: false },
      ]);
    });
  });

  describe('unlink', () => {
    it('should unlink records', async () => {
      mockEnv.executeKw.mockResolvedValue(true);

      const result = await model.unlink([1, 2, 3]);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'unlink', [[1, 2, 3]]);
      expect(result).toBe(true);
    });

    it('should return true for empty ids array', async () => {
      const result = await model.unlink([]);

      expect(mockEnv.executeKw).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('browse', () => {
    it('should browse single id', () => {
      const result = model.browse(42);

      expect(result).toBeInstanceOf(RecordSet);
      expect(result.ids).toEqual([42]);
    });

    it('should browse multiple ids', () => {
      const result = model.browse([1, 2, 3]);

      expect(result.ids).toEqual([1, 2, 3]);
    });

    it('should browse empty array', () => {
      const result = model.browse([]);

      expect(result.ids).toEqual([]);
    });
  });

  describe('withContext', () => {
    it('should create new model with updated context', () => {
      const newEnv = {
        ...mockEnv,
        context: { ...mockEnv.context, lang: 'fr_FR' },
      };
      mockEnv.withContext.mockReturnValue(newEnv as any);
      mockEnv.model.mockReturnValue(new Model(newEnv as any, 'res.partner'));

      const newModel = model.withContext({ lang: 'fr_FR' });

      expect(mockEnv.withContext).toHaveBeenCalledWith({ lang: 'fr_FR' });
      expect(newModel).toBeInstanceOf(Model);
      expect(newModel.name).toBe('res.partner');
    });

    it('should not mutate original model', () => {
      const originalContext = mockEnv.context;
      mockEnv.withContext.mockReturnValue(mockEnv);
      mockEnv.model.mockReturnValue(model);

      model.withContext({ test: 'value' });

      expect(mockEnv.context).toBe(originalContext);
    });
  });

  describe('withSchema', () => {
    it('should create new model with schema', () => {
      const schema = { name: 'string', email: 'string' };

      const newModel = model.withSchema(schema);

      expect(newModel).toBeInstanceOf(Model);
      expect(newModel.name).toBe('res.partner');
    });

    it('should preserve model name when adding schema', () => {
      const schema = { test: 'value' };

      const newModel = model.withSchema(schema);

      expect(newModel.name).toBe('res.partner');
    });
  });

  describe('call', () => {
    it('should call custom method with no arguments', async () => {
      mockEnv.executeKw.mockResolvedValue({ success: true });

      const result = await model.call('my_custom_method');

      expect(mockEnv.executeKw).toHaveBeenCalledWith(
        'res.partner',
        'my_custom_method',
        [],
        undefined
      );
      expect(result).toEqual({ success: true });
    });

    it('should call custom method with args', async () => {
      mockEnv.executeKw.mockResolvedValue('result');

      await model.call('action_confirm', [[1, 2, 3]]);

      expect(mockEnv.executeKw).toHaveBeenCalledWith(
        'res.partner',
        'action_confirm',
        [[1, 2, 3]],
        undefined
      );
    });

    it('should call custom method with args and kwargs', async () => {
      mockEnv.executeKw.mockResolvedValue(42);

      await model.call('compute_total', [100], { discount: 0.1 });

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'compute_total', [100], {
        discount: 0.1,
      });
    });
  });

  describe('fieldsGet', () => {
    it('should get all fields when no fields specified', async () => {
      mockEnv.executeKw.mockResolvedValue(mockFieldDefinitions.resPartner);

      const result = await model.fieldsGet();

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'fields_get', [], {});
      expect(result).toEqual(mockFieldDefinitions.resPartner);
    });

    it('should get specific fields', async () => {
      const fields = { name: { type: 'char' }, email: { type: 'char' } };
      mockEnv.executeKw.mockResolvedValue(fields);

      const result = await model.fieldsGet(['name', 'email']);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'fields_get', [], {
        attributes: ['name', 'email'],
      });
      expect(result).toEqual(fields);
    });

    it('should not pass attributes for empty array', async () => {
      mockEnv.executeKw.mockResolvedValue({});

      await model.fieldsGet([]);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'fields_get', [], {});
    });
  });

  describe('searchCount', () => {
    it('should count all records with empty domain', async () => {
      mockEnv.executeKw.mockResolvedValue(100);

      const result = await model.searchCount();

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'search_count', [[]]);
      expect(result).toBe(100);
    });

    it('should count records with domain', async () => {
      const domain = [['customer', '=', true]];
      mockEnv.executeKw.mockResolvedValue(42);

      const result = await model.searchCount(domain);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'search_count', [domain]);
      expect(result).toBe(42);
    });

    it('should return zero count', async () => {
      mockEnv.executeKw.mockResolvedValue(0);

      const result = await model.searchCount([['name', '=', 'nonexistent']]);

      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true when records exist', async () => {
      mockEnv.executeKw.mockResolvedValue(5);

      const result = await model.exists([['customer', '=', true]]);

      expect(result).toBe(true);
    });

    it('should return false when no records exist', async () => {
      mockEnv.executeKw.mockResolvedValue(0);

      const result = await model.exists([['name', '=', 'nonexistent']]);

      expect(result).toBe(false);
    });

    it('should check with empty domain', async () => {
      mockEnv.executeKw.mockResolvedValue(1);

      const result = await model.exists();

      expect(result).toBe(true);
    });
  });

  describe('environment getter', () => {
    it('should return the environment instance', () => {
      expect(model.environment).toBe(mockEnv);
    });
  });
});
