# 📚 Scrunchy Backend - Complete API Documentation

## ✅ Database Status
**Database Migration**: ✅ **COMPLETE**
- Migrations applied: 1 migration found
- Database schema: Up to date
- Connection: Neon PostgreSQL (Connected)

## 🌐 Base URL
```
http://localhost:3000/api
```

## 📋 Table of Contents
1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Assets](#3-assets)
4. [Marketplace](#4-marketplace)
5. [Games](#5-games)
6. [SDK Endpoints](#6-sdk-endpoints)
7. [Access Control](#7-access-control)
8. [Developer Marketplace](#8-developer-marketplace)
9. [Health Check](#9-health-check)

---

## 1. Authentication

### 1.1 Get Nonce
**Endpoint**: `POST /api/auth/nonce`

**Description**: Get a nonce for wallet signature authentication.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "walletAddress": "string" // Solana wallet address
}
```

**Response**:
```json
{
  "nonce": "string",        // Nonce to sign
  "expiresAt": "ISO8601"    // Expiration timestamp
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "YourWalletAddress"}'
```

---

### 1.2 Verify Signature
**Endpoint**: `POST /api/auth/verify`

**Description**: Verify wallet signature and get JWT token. Creates user if doesn't exist.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "walletAddress": "string",  // Solana wallet address
  "signature": "string",      // Signed message (base58)
  "message": "string"         // Message that was signed (includes nonce)
}
```

**Response**:
```json
{
  "token": "string",          // JWT token
  "user": {
    "id": "string",
    "walletAddress": "string",
    "username": "string | null",
    "createdAt": "ISO8601"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YourWalletAddress",
    "signature": "SignedMessage",
    "message": "Sign this message: nonce"
  }'
```

---

### 1.3 Get Current User
**Endpoint**: `GET /api/auth/me`

**Description**: Get current authenticated user information.

**Authentication**: ✅ Required (JWT Bearer Token)

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "id": "string",
  "walletAddress": "string",
  "username": "string | null",
  "email": "string | null",
  "avatarUrl": "string | null",
  "bio": "string | null",
  "createdAt": "ISO8601"
}
```

**Example**:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 2. Users

### 2.1 Get User Profile
**Endpoint**: `GET /api/users/me`

**Description**: Get authenticated user's profile with stats.

**Authentication**: ✅ Required (JWT Bearer Token)

**Response**:
```json
{
  "id": "string",
  "walletAddress": "string",
  "username": "string | null",
  "email": "string | null",
  "avatarUrl": "string | null",
  "bio": "string | null",
  "stats": {
    "totalAssets": "number",
    "totalListings": "number",
    "totalRentals": "number"
  },
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

---

### 2.2 Update User Profile
**Endpoint**: `PUT /api/users/me`

**Description**: Update authenticated user's profile.

**Authentication**: ✅ Required (JWT Bearer Token)

**Request Body**:
```json
{
  "username": "string (optional)",
  "email": "string (optional)",
  "bio": "string (optional)",
  "avatarUrl": "string (optional)"
}
```

**Response**: Updated user profile

**Example**:
```bash
curl -X PUT http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username": "newusername", "bio": "My bio"}'
```

---

## 3. Assets

### 3.1 List Assets
**Endpoint**: `GET /api/assets`

**Description**: Get paginated list of assets with filtering and sorting.

**Authentication**: None (Public)

**Query Parameters**:
- `type` (optional): AssetType enum (WEAPON, ARMOR, SKILL, etc.)
- `rarity` (optional): Rarity enum (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, MYTHIC)
- `rentable` (optional): boolean - Filter by rentable status
- `search` (optional): string - Search by name/description
- `sortBy` (optional): 'price' | 'rarity' | 'created' | 'popular'
- `order` (optional): 'asc' | 'desc'
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 20, max: 100)

**Response**:
```json
{
  "assets": [
    {
      "id": "string",
      "assetId": "string",
      "mintAddress": "string",
      "name": "string",
      "description": "string | null",
      "imageUrl": "string",
      "assetType": "AssetType",
      "rarity": "Rarity",
      "baseAttributes": {},
      "isRentable": "boolean",
      "isListed": "boolean",
      "currentlyRented": "boolean",
      "owner": {
        "id": "string",
        "username": "string | null",
        "walletAddress": "string"
      },
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

**Example**:
```bash
curl "http://localhost:3000/api/assets?type=WEAPON&rarity=LEGENDARY&page=1&limit=10"
```

---

### 3.2 Get Asset by ID
**Endpoint**: `GET /api/assets/:id`

**Description**: Get detailed information about a specific asset.

**Authentication**: None (Public)

**Path Parameters**:
- `id`: string - Asset ID

**Response**: Asset object with full details

**Example**:
```bash
curl http://localhost:3000/api/assets/asset-id-here
```

---

### 3.3 Create Asset
**Endpoint**: `POST /api/assets`

**Description**: Create a new asset. Uploads metadata to IPFS via Pinata and creates on-chain transaction.

**Authentication**: ✅ Required (JWT Bearer Token)

**Request Body**:
```json
{
  "name": "string",                    // Required
  "description": "string (optional)",
  "imageUrl": "string",                // Required
  "assetType": "AssetType",            // Required: WEAPON, ARMOR, SKILL, etc.
  "rarity": "Rarity",                  // Required: COMMON, UNCOMMON, RARE, etc.
  "baseAttributes": {                  // Optional
    "power": 85,
    "speed": 60
  },
  "gameMappings": {},                 // Optional
  "rentalConfig": {                    // Optional
    "pricePerHour": "string",
    "pricePerDay": "string",
    "maxRentalDuration": "number",
    "minRentalDuration": "number"
  }
}
```

**Response**:
```json
{
  "asset": {
    "id": "string",
    "assetId": "string",
    "mintAddress": "string",
    "metadataUri": "ipfs://...",
    // ... full asset object
  },
  "transaction": "base64_string"      // Transaction to sign and send
}
```

**Note**: The transaction must be signed client-side and sent to Solana network.

**Example**:
```bash
curl -X POST http://localhost:3000/api/assets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fire Sword",
    "imageUrl": "https://example.com/sword.png",
    "assetType": "WEAPON",
    "rarity": "LEGENDARY",
    "baseAttributes": {"power": 85, "speed": 60}
  }'
```

---

### 3.4 Sync Asset from Chain
**Endpoint**: `POST /api/assets/sync/:mintAddress`

**Description**: Sync asset data from Solana blockchain to database.

**Authentication**: ✅ Required (JWT Bearer Token)

**Path Parameters**:
- `mintAddress`: string - Solana mint address

**Response**: Synced asset object

**Example**:
```bash
curl -X POST http://localhost:3000/api/assets/sync/MintAddressHere \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4. Marketplace

### 4.1 List Listings
**Endpoint**: `GET /api/marketplace/listings`

**Description**: Get paginated list of active marketplace listings.

**Authentication**: None (Public)

**Query Parameters**:
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 20)
- `priceMin` (optional): string - Minimum price in lamports
- `priceMax` (optional): string - Maximum price in lamports

**Response**:
```json
{
  "listings": [
    {
      "id": "string",
      "listingId": "string",           // On-chain listing PDA
      "assetId": "string",
      "pricePerHour": "string",        // In lamports
      "pricePerDay": "string",         // In lamports
      "maxRentalDuration": "number",
      "minRentalDuration": "number",
      "autoRenewal": "boolean",
      "isAvailable": "boolean",
      "totalRentals": "number",
      "totalRevenue": "string",
      "asset": {
        // Full asset object
      },
      "listedAt": "ISO8601"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

**Example**:
```bash
curl "http://localhost:3000/api/marketplace/listings?page=1&limit=20"
```

---

### 4.2 Get Single Listing
**Endpoint**: `GET /api/marketplace/listings/:id`

**Description**: Get detailed information about a specific listing.

**Authentication**: None (Public)

**Path Parameters**:
- `id`: string - Listing ID

**Response**: Listing object with full details

---

### 4.3 Create Listing
**Endpoint**: `POST /api/marketplace/listings`

**Description**: Create a marketplace listing for an asset. Creates on-chain transaction.

**Authentication**: ✅ Required (JWT Bearer Token)

**Request Body**:
```json
{
  "assetId": "string",                 // Required
  "pricePerHour": "string",           // Required - In lamports
  "pricePerDay": "string",            // Required - In lamports
  "maxRentalDuration": "number",      // Required - In seconds
  "minRentalDuration": "number",      // Required - In seconds
  "autoRenewal": "boolean (optional)"
}
```

**Response**:
```json
{
  "listing": {
    // Full listing object
  },
  "transaction": "base64_string"      // Transaction to sign and send
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/marketplace/listings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "asset-id",
    "pricePerHour": "1000000",
    "pricePerDay": "20000000",
    "maxRentalDuration": 86400,
    "minRentalDuration": 3600
  }'
```

---

### 4.4 Update Listing
**Endpoint**: `PUT /api/marketplace/listings/:id`

**Description**: Update a marketplace listing. Creates on-chain transaction.

**Authentication**: ✅ Required (JWT Bearer Token) - Must own the listing

**Path Parameters**:
- `id`: string - Listing ID

**Request Body**:
```json
{
  "pricePerHour": "string (optional)",
  "pricePerDay": "string (optional)",
  "maxRentalDuration": "number (optional)",
  "isAvailable": "boolean (optional)"
}
```

**Response**: Updated listing and transaction

---

### 4.5 Rent Asset
**Endpoint**: `POST /api/marketplace/rentals`

**Description**: Rent an asset from marketplace. Creates on-chain rental transaction.

**Authentication**: ✅ Required (JWT Bearer Token)

**Request Body**:
```json
{
  "listingId": "string",               // Required
  "duration": "number",               // Required - In seconds
  "gameId": "string (optional)"        // Game ID if renting for specific game
}
```

**Response**:
```json
{
  "rental": {
    "id": "string",
    "rentalId": "string",              // On-chain rental PDA
    "assetId": "string",
    "listingId": "string",
    "renterId": "string",
    "gameId": "string | null",
    "rentalPrice": "string",           // In lamports
    "duration": "number",
    "startTime": "ISO8601",
    "endTime": "ISO8601",
    "status": "ACTIVE",
    "createdAt": "ISO8601"
  },
  "transaction": "base64_string"       // Transaction to sign and send
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/marketplace/rentals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "listing-id",
    "duration": 3600,
    "gameId": "game-id"
  }'
```

---

### 4.6 Complete Rental
**Endpoint**: `POST /api/marketplace/rentals/:id/complete`

**Description**: Complete a rental and distribute payments. Creates on-chain transaction.

**Authentication**: ✅ Required (JWT Bearer Token) - Must be owner, renter, or rental expired

**Path Parameters**:
- `id`: string - Rental ID

**Response**: Completed rental and transaction

**Example**:
```bash
curl -X POST http://localhost:3000/api/marketplace/rentals/rental-id/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4.7 Get My Rentals
**Endpoint**: `GET /api/marketplace/rentals/me`

**Description**: Get all rentals for authenticated user.

**Authentication**: ✅ Required (JWT Bearer Token)

**Query Parameters**:
- `status` (optional): 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
- `active` (optional): 'true' - Get only active rentals

**Response**:
```json
[
  {
    "id": "string",
    "rentalId": "string",
    "asset": {
      // Full asset object
    },
    "listing": {
      // Full listing object
    },
    "rentalPrice": "string",
    "duration": "number",
    "startTime": "ISO8601",
    "endTime": "ISO8601",
    "status": "ACTIVE",
    "timeRemaining": "number"          // Seconds remaining
  }
]
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/marketplace/rentals/me?active=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5. Games

### 5.1 List Games
**Endpoint**: `GET /api/games`

**Description**: Get list of all active games.

**Authentication**: None (Public)

**Response**:
```json
[
  {
    "id": "string",
    "gameId": "string",
    "name": "string",
    "description": "string",
    "websiteUrl": "string | null",
    "logoUrl": "string | null",
    "developer": {
      "id": "string",
      "username": "string | null",
      "walletAddress": "string"
    },
    "isActive": "boolean",
    "createdAt": "ISO8601"
  }
]
```

---

### 5.2 Get Game
**Endpoint**: `GET /api/games/:id`

**Description**: Get detailed information about a specific game.

**Authentication**: None (Public)

**Path Parameters**:
- `id`: string - Game ID

**Response**: Full game object

---

### 5.3 Register Game
**Endpoint**: `POST /api/games`

**Description**: Register a new game. Creates API key automatically.

**Authentication**: ✅ Required (JWT Bearer Token)

**Request Body**:
```json
{
  "name": "string",                    // Required
  "description": "string",             // Required
  "websiteUrl": "string (optional)",
  "logoUrl": "string (optional)",
  "supportedTypes": ["string"]         // Required - Array of asset types
}
```

**Response**:
```json
{
  "game": {
    // Full game object
  },
  "apiKey": "string"                   // ⚠️ Show only once!
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Game",
    "description": "An awesome game",
    "supportedTypes": ["WEAPON", "ARMOR"]
  }'
```

---

### 5.4 Create API Key
**Endpoint**: `POST /api/games/:id/api-keys`

**Description**: Create a new API key for a game.

**Authentication**: ✅ Required (JWT Bearer Token) - Must own the game

**Path Parameters**:
- `id`: string - Game ID

**Request Body**:
```json
{
  "name": "string",                     // Required
  "environment": "test | production (optional)",
  "permissions": ["string"] (optional),
  "rateLimitPerMinute": "number (optional, default: 300)"
}
```

**Response**:
```json
{
  "apiKey": "string",                   // ⚠️ Show only once!
  "keyPrefix": "string"                 // For identification
}
```

---

### 5.5 List API Keys
**Endpoint**: `GET /api/games/:id/api-keys`

**Description**: List all API keys for a game (masked).

**Authentication**: ✅ Required (JWT Bearer Token) - Must own the game

**Response**:
```json
{
  "keys": [
    {
      "id": "string",
      "prefix": "string",               // First 10 chars
      "environment": "test | production",
      "permissions": ["string"],
      "rateLimitPerMinute": "number",
      "lastUsedAt": "ISO8601 | null",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

### 5.6 Revoke API Key
**Endpoint**: `POST /api/games/:id/api-keys/:keyId/revoke`

**Description**: Revoke an API key.

**Authentication**: ✅ Required (JWT Bearer Token) - Must own the game

**Path Parameters**:
- `id`: string - Game ID
- `keyId`: string - API Key ID

**Response**:
```json
{
  "success": true
}
```

---

### 5.7 Get Game Configuration
**Endpoint**: `GET /api/games/:id/config`

**Description**: Get game configuration (visuals, attributes, behaviors, filters).

**Authentication**: ✅ Required (API Key via X-API-Key header)

**Headers**:
```
X-API-Key: <API_KEY>
```

**Response**:
```json
{
  "version": "string",
  "visuals": {
    "assetIcons": {
      "WEAPON": {
        "LEGENDARY": {
          "iconUrl": "string",
          "modelUrl": "string",
          "animations": {},
          "particles": {},
          "sounds": {}
        }
      }
    }
  },
  "attributes": {
    "mappings": {
      "power": {
        "targetStat": "attack",
        "transform": {
          "type": "linear",
          "multiplier": 1.5
        },
        "min": 0,
        "max": 100
      }
    }
  },
  "behaviors": {
    "actions": {
      "actionId": {
        "name": "string",
        "description": "string",
        "availability": {
          "assetTypes": ["WEAPON"],
          "rarities": ["LEGENDARY"]
        },
        "constraints": {
          "cooldown": "number"
        }
      }
    }
  },
  "filters": {},
  "updatedAt": "ISO8601"
}
```

---

### 5.8 Update Game Configuration
**Endpoint**: `PUT /api/games/:id/config`

**Description**: Update game configuration. Creates new version automatically.

**Authentication**: ✅ Required (JWT Bearer Token) - Must own the game

**Request Body**:
```json
{
  "visuals": {} (optional),
  "attributes": {} (optional),
  "behaviors": {} (optional),
  "filters": {} (optional)
}
```

**Response**:
```json
{
  "version": "string",                  // New version
  "updated": ["visuals", "attributes"], // What was updated
  "updatedAt": "ISO8601"
}
```

---

### 5.9 Get Configuration History
**Endpoint**: `GET /api/games/:id/config/history`

**Description**: Get version history of game configuration.

**Authentication**: ✅ Required (JWT Bearer Token) - Must own the game

**Response**:
```json
{
  "versions": [
    {
      "version": "string",
      "updatedAt": "ISO8601",
      "updatedBy": "string",
      "changes": ["string"]
    }
  ]
}
```

---

### 5.10 Rollback Configuration
**Endpoint**: `POST /api/games/:id/config/rollback`

**Description**: Rollback to a previous configuration version.

**Authentication**: ✅ Required (JWT Bearer Token) - Must own the game

**Request Body**:
```json
{
  "version": "string"                   // Version to rollback to
}
```

**Response**: Restored configuration

---

## 6. SDK Endpoints

All SDK endpoints require API Key authentication.

### 6.1 Check Access
**Endpoint**: `POST /api/sdk/check-access`

**Description**: Fast access check for a wallet to an asset (cached).

**Authentication**: ✅ Required (API Key via X-API-Key header)

**Request Body**:
```json
{
  "walletAddress": "string",
  "assetId": "string"
}
```

**Response**:
```json
{
  "hasAccess": "boolean",
  "accessType": "owner | renter | none",
  "expiresAt": "ISO8601 | null"        // If renter, when rental expires
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/sdk/check-access \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "wallet-address",
    "assetId": "asset-id"
  }'
```

---

### 6.2 Get Player Assets
**Endpoint**: `GET /api/sdk/players/:walletAddress/assets`

**Description**: Get all assets (owned + rented) for a player with game-specific transformations.

**Authentication**: ✅ Required (API Key via X-API-Key header)

**Path Parameters**:
- `walletAddress`: string - Player wallet address

**Response**:
```json
{
  "assets": [
    {
      "id": "string",
      "assetId": "string",
      "mint": "string",
      "name": "string",
      "owner": {},
      "universalAttributes": {},        // Original attributes
      "gameStats": {},                  // Transformed for this game
      "visuals": {
        "iconUrl": "string",
        "modelUrl": "string",
        "animations": {},
        "particles": {},
        "sounds": {}
      },
      "availableActions": [
        {
          "actionId": "string",
          "name": "string",
          "description": "string",
          "cooldown": "number",
          "isAvailable": true
        }
      ],
      "accessType": "owner | renter",
      "expiresAt": "ISO8601 | null"
    }
  ],
  "total": "number"
}
```

---

### 6.3 Get Asset (Transformed)
**Endpoint**: `GET /api/sdk/assets/:assetId`

**Description**: Get single asset with game-specific transformations applied.

**Authentication**: ✅ Required (API Key via X-API-Key header)

**Path Parameters**:
- `assetId`: string - Asset ID

**Response**: Transformed asset object (same format as player assets)

---

### 6.4 Batch Get Assets
**Endpoint**: `POST /api/sdk/assets/batch`

**Description**: Get multiple assets with transformations in one request.

**Authentication**: ✅ Required (API Key via X-API-Key header)

**Request Body**:
```json
{
  "assetIds": ["string", "string"]     // Array of asset IDs
}
```

**Response**:
```json
{
  "assets": [
    // Array of transformed asset objects
  ]
}
```

---

## 7. Access Control

### 7.1 Verify Access
**Endpoint**: `GET /api/access-control/verify/:mintAddress/:walletAddress`

**Description**: Verify if a wallet has access to an asset (checks on-chain + database).

**Authentication**: None (Public)

**Path Parameters**:
- `mintAddress`: string - Asset mint address
- `walletAddress`: string - Wallet address to check

**Response**:
```json
{
  "hasAccess": "boolean",
  "accessType": "owner | renter | none",
  "expiresAt": "ISO8601 | null",
  "rentalId": "string | null"
}
```

**Example**:
```bash
curl http://localhost:3000/api/access-control/verify/MintAddress/WalletAddress
```

---

### 7.2 Batch Verify Access
**Endpoint**: `POST /api/access-control/verify/batch`

**Description**: Verify access for multiple assets at once.

**Authentication**: ✅ Required (API Key via X-API-Key header)

**Request Body**:
```json
{
  "mintAddresses": ["string", "string"],
  "walletAddress": "string"
}
```

**Response**:
```json
{
  "results": [
    {
      "mintAddress": "string",
      "hasAccess": "boolean",
      "accessType": "owner | renter | none",
      "expiresAt": "ISO8601 | null"
    }
  ]
}
```

---

### 7.3 Invalidate Access Cache
**Endpoint**: `POST /api/access-control/invalidate/:mintAddress`

**Description**: Invalidate cached access records (useful after rental changes).

**Authentication**: ✅ Required (JWT Bearer Token)

**Path Parameters**:
- `mintAddress`: string - Asset mint address

**Request Body**:
```json
{
  "walletAddress": "string (optional)"  // If provided, invalidate specific wallet
}
```

**Response**:
```json
{
  "success": true
}
```

---

## 8. Developer Marketplace

### 8.1 List Packages
**Endpoint**: `GET /api/marketplace/packages`

**Description**: Get list of marketplace packages (configs, visuals, integrations).

**Authentication**: None (Public)

**Query Parameters**:
- `page` (optional): number
- `limit` (optional): number
- `type` (optional): PackageType
- `category` (optional): PackageCategory
- `minRating` (optional): number

**Response**: Paginated list of packages

---

### 8.2 Get Package
**Endpoint**: `GET /api/marketplace/packages/:packageId`

**Description**: Get detailed information about a package.

**Authentication**: None (Public)

**Response**: Full package object with reviews

---

### 8.3 Create Package
**Endpoint**: `POST /api/marketplace/packages`

**Description**: Create a new marketplace package.

**Authentication**: ✅ Required (JWT Bearer Token)

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "tagline": "string",
  "category": "PackageCategory",
  "tags": ["string"],
  "type": "PackageType",
  "contentsUrl": "string",
  "pricing": {
    "model": "free | one-time | subscription",
    "price": "string (optional)"
  },
  "licenseType": "LicenseType",
  "thumbnailUrl": "string",
  "screenshotUrls": ["string"],
  "compatibility": {},
  "version": "string"
}
```

**Response**: Created package object

---

### 8.4 Install Package
**Endpoint**: `POST /api/marketplace/packages/:packageId/install`

**Description**: Install a package to a game.

**Authentication**: ✅ Required (API Key via X-API-Key header)

**Request Body**:
```json
{
  "installationToken": "string"
}
```

**Response**:
```json
{
  "status": "installed",
  "installation": {
    // Installation record
  }
}
```

---

### 8.5 Get Installed Packages
**Endpoint**: `GET /api/marketplace/packages/installed`

**Description**: Get all packages installed for a game.

**Authentication**: ✅ Required (API Key via X-API-Key header)

**Response**:
```json
{
  "packages": [
    {
      "packageId": "string",
      "version": "string",
      "installedAt": "ISO8601",
      "lastUsedAt": "ISO8601 | null",
      "updateAvailable": "string | null"  // New version if available
    }
  ]
}
```

---

## 9. Health Check

### 9.1 Health Check
**Endpoint**: `GET /health`

**Description**: Check health status of all services.

**Authentication**: None (Public)

**Response**:
```json
{
  "status": "ok | degraded",
  "timestamp": "ISO8601",
  "services": {
    "database": {
      "status": "ok | error",
      "error": "string (if error)"
    },
    "redis": {
      "status": "ok | error",
      "error": "string (if error)"
    },
    "solana": {
      "status": "ok | error",
      "blockHeight": "number (if ok)",
      "error": "string (if error)"
    }
  }
}
```

**Example**:
```bash
curl http://localhost:3000/health
```

---

## 🔐 Authentication Methods

### JWT Bearer Token
For user-authenticated endpoints:
```
Authorization: Bearer <JWT_TOKEN>
```

Get token from: `POST /api/auth/verify`

### API Key
For SDK and game endpoints:
```
X-API-Key: <API_KEY>
```

Get API key from: `POST /api/games/:id/api-keys`

---

## 📊 Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## 🚀 Rate Limiting

- **API Key**: Configurable per key (default: 300 requests/minute)
- **User**: 100 requests/minute
- Headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `Retry-After` (if exceeded)

---

## 📝 Notes

1. **On-Chain Transactions**: Endpoints that create/update on-chain data return a `transaction` field (base64 encoded). This must be:
   - Decoded
   - Signed client-side with user's wallet
   - Sent to Solana network

2. **IPFS Storage**: Asset metadata is automatically uploaded to IPFS via Pinata when creating assets.

3. **Caching**: Most read endpoints are cached for performance. Write operations invalidate relevant caches.

4. **Pagination**: List endpoints support pagination with `page` and `limit` parameters.

5. **Swagger Documentation**: Interactive API docs available at: `http://localhost:3000/api/docs`

---

## ✅ Verification Status

- ✅ **Database**: Migrated and up to date
- ✅ **All Endpoints**: Implemented and ready
- ✅ **Authentication**: Working
- ✅ **Contract Integration**: Ready
- ✅ **IPFS Storage**: Configured
- ✅ **Caching**: Active

**All endpoints are working and ready for frontend integration!** 🎉

