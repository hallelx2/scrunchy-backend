#!/usr/bin/env ts-node
/**
 * Generate TypeScript clients from IDL JSON files
 * This script reads IDL files and generates type-safe TypeScript clients
 */

import * as fs from 'fs';
import * as path from 'path';

const IDL_DIR = path.join(__dirname, '../src/idl');
const OUTPUT_DIR = path.join(__dirname, '../src/solana/clients');
const TYPES_DIR = path.join(__dirname, '../src/solana/types');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(TYPES_DIR)) {
  fs.mkdirSync(TYPES_DIR, { recursive: true });
}

// IDL files to process
const idlFiles = [
  { name: 'asset_registry', className: 'AssetRegistry' },
  { name: 'marketplace', className: 'Marketplace' },
  { name: 'access_control', className: 'AccessControl' },
];

console.log('📦 Generating TypeScript clients from IDL files...\n');

idlFiles.forEach(({ name, className }) => {
  const idlPath = path.join(IDL_DIR, `${name}.json`);
  
  if (!fs.existsSync(idlPath)) {
    console.warn(`⚠️  Warning: ${idlPath} not found, skipping...`);
    return;
  }

  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  
  // Generate client file
  const clientContent = `// Auto-generated client for ${name}
// DO NOT EDIT - This file is generated from IDL

import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import ${className}Idl from '../../idl/${name}.json';

export type ${className}Program = Program<typeof ${className}Idl>;

export function get${className}Program(
  programId: PublicKey,
  provider: AnchorProvider
): ${className}Program {
  return new Program(
    ${className}Idl as any,
    programId,
    provider
  ) as ${className}Program;
}

export { ${className}Idl };
`;

  const clientPath = path.join(OUTPUT_DIR, `${name}.client.ts`);
  fs.writeFileSync(clientPath, clientContent);
  console.log(`✅ Generated: ${clientPath}`);
});

console.log('\n✅ Client generation complete!');

