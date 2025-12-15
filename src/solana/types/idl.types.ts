// Auto-generated types from IDL files
// These types are generated from the IDL JSON files for type-safe contract interactions

import * as anchor from '@coral-xyz/anchor';

// Import IDL files
// eslint-disable-next-line @typescript-eslint/no-var-requires
const assetRegistryIdl = require('../../idl/asset_registry.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const marketplaceIdl = require('../../idl/marketplace.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const accessControlIdl = require('../../idl/access_control.json');

// Export IDL types
export type AssetRegistryIdl = typeof assetRegistryIdl;
export type MarketplaceIdl = typeof marketplaceIdl;
export type AccessControlIdl = typeof accessControlIdl;

// Export IDL objects for program initialization
export const AssetRegistryIdl = assetRegistryIdl as anchor.Idl;
export const MarketplaceIdl = marketplaceIdl as anchor.Idl;
export const AccessControlIdl = accessControlIdl as anchor.Idl;

// Type-safe IDL exports
export { assetRegistryIdl, marketplaceIdl, accessControlIdl };

