#!/usr/bin/env node

/**
 * CLI entry point for ts-odoorpc
 * Provides commands for type generation and other utilities
 */

import { Command } from 'commander';
import { generateCommand } from './commands/generate';

const program = new Command();

program
  .name('odoo-rpc')
  .description('TypeScript Odoo RPC CLI - Generate types and manage Odoo connections')
  .version('0.1.0');

// Register commands
program.addCommand(generateCommand);

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
