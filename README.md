# ts-odoorpc

A modern, type-safe TypeScript library for Odoo RPC.

## Installation

```bash
npm install ts-odoorpc
```

## Quick Start

```typescript
import { OdooClient } from 'ts-odoorpc';

// Connect and login
const odoo = new OdooClient();
await odoo.connect({ host: 'localhost', port: 8069 });
await odoo.login('mydb', 'admin', 'password');

// Get a model
const Partner = odoo.env.model('res.partner');

// Search and read records
const partners = await Partner.searchRead(
  [['customer', '=', true]],
  ['name', 'email', 'phone'],
  { limit: 10 }
);

// Access fields
for (const partner of partners) {
  console.log(partner.name, partner.email);
}
```

## Basic Operations

### Create

```typescript
const Partner = odoo.env.model('res.partner');
const newPartner = await Partner.create({
  name: 'John Doe',
  email: 'john@example.com',
});
```

### Read

```typescript
// Search for IDs
const ids = await Partner.search([['customer', '=', true]], { limit: 5 });

// Read specific fields
const partners = Partner.browse(ids);
await partners.read(['name', 'email']);
console.log(partners[0].name);
```

### Update

```typescript
const partner = Partner.browse(42);
await partner.write({ phone: '+1234567890' });
```

### Delete

```typescript
await partner.unlink();
```

## Search & Filters

```typescript
// Simple filter
const customers = await Partner.search([['customer', '=', true]]);

// Multiple conditions (AND)
const activeCustomers = await Partner.search([
  ['customer', '=', true],
  ['active', '=', true],
]);

// OR conditions
const partners = await Partner.search([
  '|',
  ['name', 'ilike', 'John'],
  ['email', 'ilike', 'john'],
]);

// With options
const recent = await Partner.search(
  [['create_date', '>', '2024-01-01']],
  { limit: 10, offset: 0, order: 'create_date DESC' }
);
```

## Generate TypeScript Types

Generate type definitions from your Odoo models:

```bash
npx odoo-rpc generate -h localhost -d mydb -u admin -p password -o ./types
```

Use generated types:

```typescript
import { ResPartner } from './types';

const Partner = odoo.env.model<ResPartner>('res.partner');
const partners = await Partner.searchRead([], ['name', 'email']);

// Full TypeScript autocomplete
console.log(partners[0].name); // TypeScript knows this is string | false
```

## Context Management

```typescript
// Create environment with custom context
const frenchEnv = odoo.env.withContext({ lang: 'fr_FR' });
const Product = frenchEnv.model('product.product');

// All operations use French language
const products = await Product.searchRead([], ['name']);
```

## License

MIT
