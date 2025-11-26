import { Command } from 'commander';
import { InterfaceGenerator } from '../generators/InterfaceGenerator';

/**
 * Generate command for creating TypeScript interfaces from Odoo models
 */
export const generateCommand = new Command('generate')
  .description('Generate TypeScript interfaces from Odoo models')
  .requiredOption('-h, --host <host>', 'Odoo server host')
  .requiredOption('-d, --database <database>', 'Database name')
  .requiredOption('-u, --username <username>', 'Username')
  .requiredOption('-p, --password <password>', 'Password')
  .requiredOption('-o, --output <directory>', 'Output directory for generated files')
  .option('--port <port>', 'Server port (default: 8069)', '8069')
  .option('--protocol <protocol>', 'Protocol (http or https)', 'http')
  .option('-m, --models <models...>', 'Specific models to generate (space-separated)')
  .action(async (options) => {
    try {
      const generator = new InterfaceGenerator();

      await generator.generate({
        host: options.host,
        port: parseInt(options.port, 10),
        protocol: options.protocol as 'http' | 'https',
        database: options.database,
        username: options.username,
        password: options.password,
        outputDir: options.output,
        models: options.models,
      });

      process.exit(0);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
