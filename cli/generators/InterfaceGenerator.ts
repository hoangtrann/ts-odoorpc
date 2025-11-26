import * as fs from 'fs';
import * as path from 'path';
import { OdooClient } from '../../src/client/OdooClient';
import {
  OdooFieldInfo,
  generateModelInterface,
  generateIndexFile,
  generateFileHeader,
  modelNameToFileName,
} from './templates';

/**
 * Configuration for interface generation
 */
export interface GeneratorConfig {
  host: string;
  port?: number;
  protocol?: 'http' | 'https';
  database: string;
  username: string;
  password: string;
  outputDir: string;
  models?: string[]; // Specific models to generate, or undefined for all
}

/**
 * Generator for TypeScript interfaces from Odoo models
 */
export class InterfaceGenerator {
  private client: OdooClient;

  constructor() {
    this.client = new OdooClient();
  }

  /**
   * Generate TypeScript interfaces for Odoo models
   */
  async generate(config: GeneratorConfig): Promise<void> {
    try {
      console.log('Connecting to Odoo server...');
      this.client.connect({
        host: config.host,
        port: config.port,
        protocol: config.protocol,
      });

      console.log('Authenticating...');
      await this.client.login(config.database, config.username, config.password);

      console.log('Fetching models...');
      const modelNames = await this.getModelNames(config.models);

      console.log(`Found ${modelNames.length} models to generate`);

      // Create output directory if it doesn't exist
      this.ensureDirectoryExists(config.outputDir);

      const generatedFiles: string[] = [];

      // Generate interface for each model
      for (const modelName of modelNames) {
        try {
          console.log(`Generating interface for ${modelName}...`);
          await this.generateModelInterface(modelName, config.outputDir);
          generatedFiles.push(modelName);
        } catch (error) {
          console.error(
            `Failed to generate interface for ${modelName}:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      // Generate barrel export index file
      console.log('Generating index file...');
      this.generateIndexExport(generatedFiles, config.outputDir);

      console.log(`\nSuccessfully generated ${generatedFiles.length} interfaces`);
      console.log(`Output directory: ${path.resolve(config.outputDir)}`);
    } catch (error) {
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get list of model names to generate
   */
  private async getModelNames(models?: string[]): Promise<string[]> {
    if (models && models.length > 0) {
      return models;
    }

    // Get all models from ir.model
    try {
      const modelRecords = await this.client.executeKw('ir.model', 'search_read', [[]], {
        fields: ['model'],
        order: 'model ASC',
      });

      return modelRecords.map((record: any) => record.model);
    } catch (error) {
      throw new Error(
        `Failed to fetch model list: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Generate TypeScript interface for a single model
   */
  private async generateModelInterface(modelName: string, outputDir: string): Promise<void> {
    try {
      // Fetch field definitions
      const fields = await this.client.executeKw(modelName, 'fields_get', [], {
        attributes: ['type', 'string', 'required', 'readonly', 'relation', 'selection', 'help'],
      });

      // Convert to OdooFieldInfo format
      const fieldInfos: Record<string, OdooFieldInfo> = {};
      for (const [fieldName, fieldData] of Object.entries(fields)) {
        fieldInfos[fieldName] = fieldData as OdooFieldInfo;
      }

      // Generate interface code
      const header = generateFileHeader(modelName);
      const interfaceCode = generateModelInterface(modelName, fieldInfos);
      const fullCode = header + interfaceCode + '\n';

      // Write to file
      const fileName = modelNameToFileName(modelName);
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, fullCode, 'utf8');
    } catch (error) {
      throw new Error(
        `Failed to generate interface for ${modelName}: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  /**
   * Generate barrel export index file
   */
  private generateIndexExport(modelNames: string[], outputDir: string): void {
    const indexCode = generateIndexFile(modelNames);
    const indexPath = path.join(outputDir, 'index.ts');
    fs.writeFileSync(indexPath, indexCode, 'utf8');
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
