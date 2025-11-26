/**
 * Unit tests for RecordSet class
 */

import { RecordSet } from '../../../src/models/RecordSet';
import { Model, type IEnvironment } from '../../../src/models/Model';

describe('RecordSet', () => {
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
    it('should create a recordset with single id', () => {
      const rs = new RecordSet(model, [42]);

      expect(rs.ids).toEqual([42]);
      expect(rs.length).toBe(1);
      expect(rs.isLoaded).toBe(false);
    });

    it('should create a recordset with multiple ids', () => {
      const rs = new RecordSet(model, [1, 2, 3]);

      expect(rs.ids).toEqual([1, 2, 3]);
      expect(rs.length).toBe(3);
    });

    it('should create empty recordset', () => {
      const rs = new RecordSet(model, []);

      expect(rs.ids).toEqual([]);
      expect(rs.length).toBe(0);
    });
  });

  describe('id getter', () => {
    it('should return id for single record', () => {
      const rs = new RecordSet(model, [42]);

      expect(rs.id).toBe(42);
    });

    it('should return false for empty recordset', () => {
      const rs = new RecordSet(model, []);

      expect(rs.id).toBe(false);
    });

    it('should throw error for multi-record recordset', () => {
      const rs = new RecordSet(model, [1, 2, 3]);

      expect(() => rs.id).toThrow('Cannot access id on multi-record RecordSet');
    });
  });

  describe('ids getter', () => {
    it('should return copy of ids array', () => {
      const rs = new RecordSet(model, [1, 2, 3]);

      const ids = rs.ids;

      expect(ids).toEqual([1, 2, 3]);
      // Ensure it's a copy
      ids.push(4);
      expect(rs.ids).toEqual([1, 2, 3]);
    });
  });

  describe('length getter', () => {
    it('should return number of records', () => {
      const rs = new RecordSet(model, [1, 2, 3, 4, 5]);

      expect(rs.length).toBe(5);
    });

    it('should return 0 for empty recordset', () => {
      const rs = new RecordSet(model, []);

      expect(rs.length).toBe(0);
    });
  });

  describe('isLoaded getter', () => {
    it('should return false initially', () => {
      const rs = new RecordSet(model, [1]);

      expect(rs.isLoaded).toBe(false);
    });

    it('should return true after read', async () => {
      mockEnv.executeKw.mockResolvedValue([{ id: 1, name: 'Test' }]);
      const rs = new RecordSet(model, [1]);

      await rs.read();

      expect(rs.isLoaded).toBe(true);
    });
  });

  describe('read', () => {
    it('should load data for single record', async () => {
      const mockData = [{ id: 1, name: 'Partner 1', email: 'test@example.com' }];
      mockEnv.executeKw.mockResolvedValue(mockData);
      const rs = new RecordSet(model, [1]);

      await rs.read(['name', 'email']);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'read', [[1]], {
        fields: ['name', 'email'],
      });
      expect(rs.isLoaded).toBe(true);
    });

    it('should load data for multiple records', async () => {
      const mockData = [
        { id: 1, name: 'Partner 1' },
        { id: 2, name: 'Partner 2' },
        { id: 3, name: 'Partner 3' },
      ];
      mockEnv.executeKw.mockResolvedValue(mockData);
      const rs = new RecordSet(model, [1, 2, 3]);

      await rs.read(['name']);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'read', [[1, 2, 3]], {
        fields: ['name'],
      });
      expect(rs.isLoaded).toBe(true);
    });

    it('should handle empty recordset', async () => {
      const rs = new RecordSet(model, []);

      await rs.read();

      expect(mockEnv.executeKw).not.toHaveBeenCalled();
      expect(rs.isLoaded).toBe(true);
    });

    it('should cache loaded data', async () => {
      const mockData = [{ id: 1, name: 'Test', email: 'test@example.com' }];
      mockEnv.executeKw.mockResolvedValue(mockData);
      const rs = new RecordSet(model, [1]);

      await rs.read(['name', 'email']);

      // Access via proxy
      expect(rs.name).toBe('Test');
      expect(rs.email).toBe('test@example.com');
    });

    it('should handle records without id field', async () => {
      const mockData = [{ id: 1, name: 'Valid' }, { name: 'No ID' }, null];
      mockEnv.executeKw.mockResolvedValue(mockData);
      const rs = new RecordSet(model, [1]);

      await rs.read();

      expect(rs.isLoaded).toBe(true);
    });

    it('should return the recordset for chaining', async () => {
      mockEnv.executeKw.mockResolvedValue([{ id: 1, name: 'Test' }]);
      const rs = new RecordSet(model, [1]);

      const result = await rs.read();

      expect(result).toBe(rs);
    });
  });

  describe('write', () => {
    it('should write values to single record', async () => {
      mockEnv.executeKw.mockResolvedValue(true);
      const rs = new RecordSet(model, [1]);

      const result = await rs.write({ name: 'Updated' });

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'write', [
        [1],
        { name: 'Updated' },
      ]);
      expect(result).toBe(true);
    });

    it('should write values to multiple records', async () => {
      mockEnv.executeKw.mockResolvedValue(true);
      const rs = new RecordSet(model, [1, 2, 3]);

      await rs.write({ active: false });

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'write', [
        [1, 2, 3],
        { active: false },
      ]);
    });

    it('should return true for empty recordset', async () => {
      const rs = new RecordSet(model, []);

      const result = await rs.write({ name: 'Test' });

      expect(mockEnv.executeKw).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should invalidate cache after write', async () => {
      mockEnv.executeKw.mockResolvedValue([{ id: 1, name: 'Original' }]);
      const rs = new RecordSet(model, [1]);

      await rs.read(['name']);
      expect(rs.isLoaded).toBe(true);

      mockEnv.executeKw.mockResolvedValue(true);
      await rs.write({ name: 'Updated' });

      expect(rs.isLoaded).toBe(false);
    });

    it('should not invalidate cache if write fails', async () => {
      mockEnv.executeKw.mockResolvedValue([{ id: 1, name: 'Test' }]);
      const rs = new RecordSet(model, [1]);

      await rs.read();
      expect(rs.isLoaded).toBe(true);

      mockEnv.executeKw.mockResolvedValue(false);
      await rs.write({ name: 'Failed' });

      expect(rs.isLoaded).toBe(true);
    });
  });

  describe('unlink', () => {
    it('should delete single record', async () => {
      mockEnv.executeKw.mockResolvedValue(true);
      const rs = new RecordSet(model, [1]);

      const result = await rs.unlink();

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'unlink', [[1]]);
      expect(result).toBe(true);
    });

    it('should delete multiple records', async () => {
      mockEnv.executeKw.mockResolvedValue(true);
      const rs = new RecordSet(model, [1, 2, 3]);

      await rs.unlink();

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'unlink', [[1, 2, 3]]);
    });

    it('should return true for empty recordset', async () => {
      const rs = new RecordSet(model, []);

      const result = await rs.unlink();

      expect(mockEnv.executeKw).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should clear cache and ids after unlink', async () => {
      mockEnv.executeKw.mockResolvedValue([{ id: 1, name: 'Test' }]);
      const rs = new RecordSet(model, [1]);

      await rs.read();
      expect(rs.isLoaded).toBe(true);
      expect(rs.ids).toEqual([1]);

      mockEnv.executeKw.mockResolvedValue(true);
      await rs.unlink();

      expect(rs.isLoaded).toBe(false);
      expect(rs.ids).toEqual([]);
      expect(rs.length).toBe(0);
    });

    it('should not clear state if unlink fails', async () => {
      const rs = new RecordSet(model, [1]);

      mockEnv.executeKw.mockResolvedValue(false);
      await rs.unlink();

      expect(rs.ids).toEqual([1]);
    });
  });

  describe('withContext', () => {
    it('should create new recordset with updated context', () => {
      const rs = new RecordSet(model, [1, 2, 3]);
      const newEnv = { ...mockEnv, context: { ...mockEnv.context, lang: 'fr_FR' } };
      const newModel = new Model(newEnv as any, 'res.partner');

      mockEnv.withContext.mockReturnValue(newEnv as any);
      mockEnv.model.mockReturnValue(newModel);

      const newRs = rs.withContext({ lang: 'fr_FR' });

      expect(newRs).toBeInstanceOf(RecordSet);
      expect(newRs.ids).toEqual([1, 2, 3]);
    });

    it('should copy loaded state to new recordset', async () => {
      mockEnv.executeKw.mockResolvedValue([{ id: 1, name: 'Test' }]);
      const rs = new RecordSet(model, [1]);

      await rs.read(['name']);

      const newEnv = { ...mockEnv };
      const newModel = new Model(newEnv as any, 'res.partner');
      mockEnv.withContext.mockReturnValue(newEnv as any);
      mockEnv.model.mockReturnValue(newModel);

      const newRs = rs.withContext({ test: 'value' });

      expect(newRs.isLoaded).toBe(true);
    });

    it('should not copy loaded state if not loaded', () => {
      const rs = new RecordSet(model, [1]);

      const newEnv = { ...mockEnv };
      const newModel = new Model(newEnv as any, 'res.partner');
      mockEnv.withContext.mockReturnValue(newEnv as any);
      mockEnv.model.mockReturnValue(newModel);

      const newRs = rs.withContext({ test: 'value' });

      expect(newRs.isLoaded).toBe(false);
    });
  });

  describe('fieldsGet', () => {
    it('should get field metadata', async () => {
      const fieldDefs = { name: { type: 'char' }, email: { type: 'char' } };
      mockEnv.executeKw.mockResolvedValue(fieldDefs);
      const rs = new RecordSet(model, [1]);

      const result = await rs.fieldsGet(['name', 'email']);

      expect(mockEnv.executeKw).toHaveBeenCalledWith('res.partner', 'fields_get', [], {
        attributes: ['name', 'email'],
      });
      expect(result).toEqual(fieldDefs);
    });

    it('should get all fields when no fields specified', async () => {
      const allFields = { name: {}, email: {}, phone: {} };
      mockEnv.executeKw.mockResolvedValue(allFields);
      const rs = new RecordSet(model, [1]);

      const result = await rs.fieldsGet();

      expect(result).toEqual(allFields);
    });
  });

  describe('iteration', () => {
    it('should iterate over single record', () => {
      const rs = new RecordSet(model, [42]);
      const records: RecordSet<any>[] = [];

      for (const record of rs) {
        records.push(record);
      }

      expect(records).toHaveLength(1);
      expect(records[0]!.id).toBe(42);
    });

    it('should iterate over multiple records', () => {
      const rs = new RecordSet(model, [1, 2, 3]);
      const ids: (number | false)[] = [];

      for (const record of rs) {
        ids.push(record.id);
      }

      expect(ids).toEqual([1, 2, 3]);
    });

    it('should transfer loaded state during iteration', async () => {
      mockEnv.executeKw.mockResolvedValue([
        { id: 1, name: 'Partner 1' },
        { id: 2, name: 'Partner 2' },
      ]);
      const rs = new RecordSet(model, [1, 2]);

      await rs.read(['name']);

      for (const record of rs) {
        expect(record.isLoaded).toBe(true);
      }
    });

    it('should not iterate over empty recordset', () => {
      const rs = new RecordSet(model, []);
      let count = 0;

      for (const _record of rs) {
        count++;
      }

      expect(count).toBe(0);
    });
  });

  describe('Proxy - field access', () => {
    it('should throw error when accessing field on unloaded recordset', () => {
      const rs = new RecordSet(model, [1]);

      expect(() => rs.name).toThrow("Field 'name' not loaded");
    });

    it('should throw error when accessing field on multi-record recordset', async () => {
      mockEnv.executeKw.mockResolvedValue([
        { id: 1, name: 'Partner 1' },
        { id: 2, name: 'Partner 2' },
      ]);
      const rs = new RecordSet(model, [1, 2]);

      await rs.read(['name']);

      expect(() => rs.name).toThrow("Cannot access field 'name' on multi-record RecordSet");
    });

    it('should access field on loaded single record', async () => {
      mockEnv.executeKw.mockResolvedValue([
        { id: 1, name: 'Test Partner', email: 'test@example.com' },
      ]);
      const rs = new RecordSet(model, [1]);

      await rs.read(['name', 'email']);

      expect(rs.name).toBe('Test Partner');
      expect(rs.email).toBe('test@example.com');
    });

    it('should handle Many2one fields', async () => {
      mockEnv.executeKw.mockResolvedValue([
        { id: 1, name: 'Test', parent_id: [42, 'Parent Company'] },
      ]);
      const rs = new RecordSet(model, [1]);

      await rs.read(['name', 'parent_id']);

      // Many2one should return just the ID
      expect(rs.parent_id).toBe(42);
    });

    it('should return undefined for missing fields', async () => {
      mockEnv.executeKw.mockResolvedValue([{ id: 1, name: 'Test' }]);
      const rs = new RecordSet(model, [1]);

      await rs.read(['name']);

      expect(rs.nonexistent_field).toBeUndefined();
    });

    it('should handle array-like index access', async () => {
      mockEnv.executeKw.mockResolvedValue([
        { id: 1, name: 'Partner 1' },
        { id: 2, name: 'Partner 2' },
        { id: 3, name: 'Partner 3' },
      ]);
      const rs = new RecordSet(model, [1, 2, 3]);

      await rs.read(['name']);

      expect(rs[0].id).toBe(1);
      expect(rs[1].id).toBe(2);
      expect(rs[2].id).toBe(3);
      expect(rs[3]).toBeUndefined();
    });

    it('should access RecordSet methods', () => {
      const rs = new RecordSet(model, [1]);

      expect(typeof rs.read).toBe('function');
      expect(typeof rs.write).toBe('function');
      expect(typeof rs.unlink).toBe('function');
    });

    it('should prevent Promise coercion', () => {
      const rs = new RecordSet(model, [1]);

      expect(rs.then).toBeUndefined();
      expect(rs.catch).toBeUndefined();
      expect(rs.finally).toBeUndefined();
    });

    it('should throw error on direct field assignment', async () => {
      mockEnv.executeKw.mockResolvedValue([{ id: 1, name: 'Test' }]);
      const rs = new RecordSet(model, [1]);

      await rs.read(['name']);

      expect(() => {
        (rs as any).name = 'New Value';
      }).toThrow('Direct field assignment not supported');
    });

    it('should handle symbol properties', () => {
      const rs = new RecordSet(model, [1, 2, 3]);
      const iterator = rs[Symbol.iterator];

      expect(typeof iterator).toBe('function');
    });
  });
});
