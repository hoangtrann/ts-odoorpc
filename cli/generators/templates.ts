/**
 * Templates for generating TypeScript interfaces from Odoo models
 */

/**
 * Odoo field type information from fields_get
 */
export interface OdooFieldInfo {
  type: string;
  string: string;
  required?: boolean;
  readonly?: boolean;
  relation?: string;
  selection?: Array<[string, string]>;
  help?: string;
}

/**
 * Type mapping configuration
 */
export interface TypeMapping {
  tsType: string;
  requiresImport?: boolean;
  importSource?: string;
}

/**
 * Map Odoo field types to TypeScript types
 */
export function mapOdooTypeToTypescript(field: OdooFieldInfo): string {
  const { type, required } = field;
  let tsType: string;

  switch (type) {
    // String types
    case 'char':
    case 'text':
    case 'html':
      tsType = 'string';
      break;

    // Numeric types
    case 'integer':
      tsType = 'number';
      break;

    case 'float':
    case 'monetary':
      tsType = 'number';
      break;

    // Boolean
    case 'boolean':
      tsType = 'boolean';
      break;

    // Date/DateTime
    case 'date':
    case 'datetime':
      tsType = 'string'; // ISO date strings
      break;

    // Relational fields
    case 'many2one':
      tsType = 'number'; // Store just the ID
      break;

    case 'one2many':
    case 'many2many':
      tsType = 'number[]'; // Array of IDs
      break;

    // Selection field - create union type
    case 'selection':
      if (field.selection && field.selection.length > 0) {
        const values = field.selection
          .map(([value]) => `'${value}'`)
          .join(' | ');
        tsType = values;
      } else {
        tsType = 'string';
      }
      break;

    // Binary
    case 'binary':
      tsType = 'string'; // Base64 encoded
      break;

    // JSON
    case 'json':
      tsType = 'Record<string, any>';
      break;

    // Reference
    case 'reference':
      tsType = 'string'; // Format: "model.name,id"
      break;

    // Default fallback
    default:
      tsType = 'any';
  }

  // Most Odoo fields can be false when not set
  // Only id is guaranteed to be a number
  if (!required && type !== 'boolean') {
    return `${tsType} | false`;
  }

  return tsType;
}

/**
 * Generate JSDoc comment for a field
 */
export function generateFieldJsDoc(
  fieldName: string,
  field: OdooFieldInfo
): string {
  const lines: string[] = ['/**'];

  // Add field label
  lines.push(` * ${field.string || fieldName}`);

  // Add field type info
  lines.push(` * @type {${field.type}}`);

  // Add help text if available
  if (field.help) {
    lines.push(` * `);
    const helpLines = field.help.split('\n');
    helpLines.forEach((line) => {
      lines.push(` * ${line.trim()}`);
    });
  }

  // Add relation info for relational fields
  if (field.relation) {
    lines.push(` * @relation {${field.relation}}`);
  }

  // Add readonly/required flags
  const flags: string[] = [];
  if (field.readonly) flags.push('readonly');
  if (field.required) flags.push('required');
  if (flags.length > 0) {
    lines.push(` * @flags ${flags.join(', ')}`);
  }

  lines.push(' */');
  return lines.join('\n');
}

/**
 * Generate TypeScript interface for an Odoo model
 */
export function generateModelInterface(
  modelName: string,
  fields: Record<string, OdooFieldInfo>
): string {
  const interfaceName = modelNameToInterfaceName(modelName);
  const lines: string[] = [];

  // Add header comment
  lines.push('/**');
  lines.push(` * TypeScript interface for Odoo model: ${modelName}`);
  lines.push(' * Generated automatically - do not modify manually');
  lines.push(' */');

  // Start interface
  lines.push(`export interface ${interfaceName} {`);

  // Sort fields: id first, then alphabetically
  const sortedFields = Object.entries(fields).sort(([a], [b]) => {
    if (a === 'id') return -1;
    if (b === 'id') return 1;
    return a.localeCompare(b);
  });

  // Generate field definitions
  for (const [fieldName, fieldInfo] of sortedFields) {
    // Add JSDoc comment
    const jsdoc = generateFieldJsDoc(fieldName, fieldInfo);
    lines.push('  ' + jsdoc.split('\n').join('\n  '));

    // Add field definition
    const tsType = mapOdooTypeToTypescript(fieldInfo);
    const optional = !fieldInfo.required && fieldName !== 'id' ? '?' : '';
    lines.push(`  ${fieldName}${optional}: ${tsType};`);
    lines.push('');
  }

  // Close interface
  lines.push('}');

  return lines.join('\n');
}

/**
 * Convert Odoo model name to TypeScript interface name
 * Example: "res.partner" -> "ResPartner"
 */
export function modelNameToInterfaceName(modelName: string): string {
  return modelName
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Convert Odoo model name to file name
 * Example: "res.partner" -> "res.partner.ts"
 */
export function modelNameToFileName(modelName: string): string {
  return `${modelName}.ts`;
}

/**
 * Generate barrel export index file
 */
export function generateIndexFile(modelNames: string[]): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * Auto-generated barrel export for Odoo model interfaces');
  lines.push(' * Generated automatically - do not modify manually');
  lines.push(' */');
  lines.push('');

  // Sort model names alphabetically
  const sorted = [...modelNames].sort();

  // Generate exports
  for (const modelName of sorted) {
    const interfaceName = modelNameToInterfaceName(modelName);
    const fileName = modelName; // Don't include .ts extension in imports
    lines.push(`export type { ${interfaceName} } from './${fileName}';`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Generate file header with metadata
 */
export function generateFileHeader(modelName: string): string {
  const timestamp = new Date().toISOString();
  return `/**
 * Auto-generated TypeScript interface for Odoo model: ${modelName}
 * Generated: ${timestamp}
 *
 * DO NOT MODIFY THIS FILE MANUALLY
 * Regenerate using: npx odoo-rpc generate
 */

`;
}
