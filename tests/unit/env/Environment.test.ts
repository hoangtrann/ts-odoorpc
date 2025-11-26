/**
 * Unit tests for Environment
 */

import { Environment } from '../../../src/env/Environment';
import { Model } from '../../../src/models/Model';

describe('Environment', () => {
  let mockClient: any;
  let env: Environment;

  beforeEach(() => {
    mockClient = {
      executeKw: jest.fn(),
    };

    env = new Environment(mockClient, 'test_db', 2, {
      lang: 'en_US',
      tz: 'UTC',
    });
  });

  describe('constructor', () => {
    it('should create an environment with given parameters', () => {
      expect(env).toBeInstanceOf(Environment);
      expect(env.databaseName).toBe('test_db');
      expect(env.userId).toBe(2);
      expect(env.context).toEqual({
        lang: 'en_US',
        tz: 'UTC',
      });
    });

    it('should create environment with empty context', () => {
      const emptyEnv = new Environment(mockClient, 'db', 1, {});

      expect(emptyEnv.context).toEqual({});
    });
  });

  describe('model', () => {
    it('should return a Model instance for the given model name', () => {
      const Partner = env.model('res.partner');

      expect(Partner).toBeInstanceOf(Model);
    });

    it('should cache model instances (registry pattern)', () => {
      const Partner1 = env.model('res.partner');
      const Partner2 = env.model('res.partner');

      expect(Partner1).toBe(Partner2);
    });

    it('should create different instances for different models', () => {
      const Partner = env.model('res.partner');
      const User = env.model('res.users');

      expect(Partner).not.toBe(User);
    });

    it('should support generic type parameter', () => {
      interface ResPartner {
        name: string;
        email: string;
      }

      const Partner = env.model<ResPartner>('res.partner');

      expect(Partner).toBeInstanceOf(Model);
    });

    it('should not share registry between different environments', () => {
      const env1 = new Environment(mockClient, 'db1', 1, {});
      const env2 = new Environment(mockClient, 'db2', 2, {});

      const model1 = env1.model('res.partner');
      const model2 = env2.model('res.partner');

      expect(model1).not.toBe(model2);
    });
  });

  describe('withContext', () => {
    it('should return a new Environment with merged context', () => {
      const newEnv = env.withContext({ lang: 'fr_FR' });

      expect(newEnv).toBeInstanceOf(Environment);
      expect(newEnv).not.toBe(env);
      expect(newEnv.context).toEqual({
        lang: 'fr_FR',
        tz: 'UTC',
      });
    });

    it('should not modify the original environment (immutability)', () => {
      const originalContext = env.context;

      env.withContext({ lang: 'fr_FR', new_key: 'value' });

      expect(env.context).toEqual(originalContext);
      expect(env.context.lang).toBe('en_US');
      expect(env.context.new_key).toBeUndefined();
    });

    it('should allow adding new context keys', () => {
      const newEnv = env.withContext({
        active_test: false,
        custom_key: 'custom_value',
      });

      expect(newEnv.context).toEqual({
        lang: 'en_US',
        tz: 'UTC',
        active_test: false,
        custom_key: 'custom_value',
      });
    });

    it('should override existing context values', () => {
      const newEnv = env.withContext({
        lang: 'es_ES',
        tz: 'Europe/Madrid',
      });

      expect(newEnv.context).toEqual({
        lang: 'es_ES',
        tz: 'Europe/Madrid',
      });
    });

    it('should preserve other environment properties', () => {
      const newEnv = env.withContext({ lang: 'fr_FR' });

      expect(newEnv.databaseName).toBe(env.databaseName);
      expect(newEnv.userId).toBe(env.userId);
      expect(newEnv.getClient()).toBe(env.getClient());
    });

    it('should allow chaining context modifications', () => {
      const finalEnv = env
        .withContext({ lang: 'fr_FR' })
        .withContext({ active_test: false })
        .withContext({ tz: 'Europe/Paris' });

      expect(finalEnv.context).toEqual({
        lang: 'fr_FR',
        tz: 'Europe/Paris',
        active_test: false,
      });
    });

    it('should not share model registry with new environment', () => {
      const model1 = env.model('res.partner');
      const newEnv = env.withContext({ lang: 'fr_FR' });
      const model2 = newEnv.model('res.partner');

      expect(model1).not.toBe(model2);
    });
  });

  describe('user', () => {
    it('should return a recordset for the current user', () => {
      const user = env.user;

      expect(user).toBeDefined();
      expect(user.id).toBe(2);
    });

    it('should use res.users model', () => {
      const modelSpy = jest.spyOn(env, 'model');

      env.user;

      expect(modelSpy).toHaveBeenCalledWith('res.users');
    });
  });

  describe('context', () => {
    it('should return a copy of the context (not a reference)', () => {
      const context1 = env.context;
      const context2 = env.context;

      expect(context1).not.toBe(context2);
      expect(context1).toEqual(context2);
    });

    it('should prevent external modification of internal context', () => {
      const context = env.context;
      context.lang = 'fr_FR';
      context.new_key = 'new_value';

      expect(env.context.lang).toBe('en_US');
      expect(env.context.new_key).toBeUndefined();
    });
  });

  describe('userId', () => {
    it('should return the user ID', () => {
      expect(env.userId).toBe(2);
    });

    it('should handle different user IDs', () => {
      const env1 = new Environment(mockClient, 'db', 1, {});
      const env2 = new Environment(mockClient, 'db', 999, {});

      expect(env1.userId).toBe(1);
      expect(env2.userId).toBe(999);
    });
  });

  describe('databaseName', () => {
    it('should return the database name', () => {
      expect(env.databaseName).toBe('test_db');
    });
  });

  describe('executeKw', () => {
    it('should delegate to client.executeKw', async () => {
      mockClient.executeKw.mockResolvedValue([1, 2, 3]);

      const result = await env.executeKw(
        'res.partner',
        'search',
        [[]],
        { limit: 10 }
      );

      expect(mockClient.executeKw).toHaveBeenCalledWith(
        'res.partner',
        'search',
        [[]],
        { limit: 10 }
      );
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle executeKw without kwargs', async () => {
      mockClient.executeKw.mockResolvedValue(true);

      await env.executeKw('res.partner', 'write', [[1], { name: 'Test' }]);

      expect(mockClient.executeKw).toHaveBeenCalledWith(
        'res.partner',
        'write',
        [[1], { name: 'Test' }],
        undefined
      );
    });

    it('should propagate errors from client', async () => {
      const error = new Error('RPC Error');
      mockClient.executeKw.mockRejectedValue(error);

      await expect(
        env.executeKw('res.partner', 'search', [[]])
      ).rejects.toThrow('RPC Error');
    });
  });

  describe('getClient', () => {
    it('should return the client reference', () => {
      expect(env.getClient()).toBe(mockClient);
    });
  });

  describe('integration scenarios', () => {
    it('should support typical workflow: get model, modify context, get model again', () => {
      const Partner = env.model('res.partner');
      const frenchEnv = env.withContext({ lang: 'fr_FR' });
      const FrenchPartner = frenchEnv.model('res.partner');

      expect(Partner).not.toBe(FrenchPartner);
      expect(env.context.lang).toBe('en_US');
      expect(frenchEnv.context.lang).toBe('fr_FR');
    });

    it('should allow multiple context layers', () => {
      const env1 = env.withContext({ lang: 'fr_FR' });
      const env2 = env1.withContext({ active_test: false });
      const env3 = env2.withContext({ tz: 'Europe/Paris' });

      expect(env.context).toEqual({ lang: 'en_US', tz: 'UTC' });
      expect(env1.context).toEqual({ lang: 'fr_FR', tz: 'UTC' });
      expect(env2.context).toEqual({
        lang: 'fr_FR',
        tz: 'UTC',
        active_test: false,
      });
      expect(env3.context).toEqual({
        lang: 'fr_FR',
        tz: 'Europe/Paris',
        active_test: false,
      });
    });
  });
});
