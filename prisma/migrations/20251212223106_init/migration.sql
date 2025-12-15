-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('WEAPON', 'ARMOR', 'SKILL', 'POWERUP', 'CONSUMABLE', 'CHARACTER', 'VEHICLE', 'OTHER');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "apiKey" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "configVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "revenueShareBps" INTEGER NOT NULL DEFAULT 500,
    "supportedTypes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "totalAssets" INTEGER NOT NULL DEFAULT 0,
    "totalRentals" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" BIGINT NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameApiKey" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 300,
    "burstLimit" INTEGER NOT NULL DEFAULT 500,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "GameApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameConfigHistory" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "changes" TEXT[],
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameConfigHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameWebhook" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "failedDeliveries" INTEGER NOT NULL DEFAULT 0,
    "lastDeliveryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "mintAddress" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "metadataUri" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "baseAttributes" JSONB NOT NULL DEFAULT '{}',
    "gameMappings" JSONB NOT NULL DEFAULT '{}',
    "isRentable" BOOLEAN NOT NULL DEFAULT true,
    "isTransferable" BOOLEAN NOT NULL DEFAULT true,
    "pricePerHour" BIGINT,
    "pricePerDay" BIGINT,
    "maxRentalDuration" INTEGER,
    "minRentalDuration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "currentlyRented" BOOLEAN NOT NULL DEFAULT false,
    "totalRentals" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" BIGINT NOT NULL DEFAULT 0,
    "totalUsageTime" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "pricePerHour" BIGINT NOT NULL,
    "pricePerDay" BIGINT NOT NULL,
    "maxRentalDuration" INTEGER NOT NULL,
    "minRentalDuration" INTEGER NOT NULL,
    "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalRentals" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" BIGINT NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "gameId" TEXT,
    "rentalPrice" BIGINT NOT NULL,
    "duration" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "RentalStatus" NOT NULL DEFAULT 'ACTIVE',
    "autoRenewed" INTEGER NOT NULL DEFAULT 0,
    "ownerPayout" BIGINT,
    "platformFee" BIGINT,
    "gameShare" BIGINT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "verifiedRent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "assetId" TEXT,
    "gameId" TEXT,
    "metadata" JSONB,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePackage" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "creatorId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tagline" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "type" TEXT NOT NULL,
    "contentsUrl" TEXT NOT NULL,
    "contentsSize" BIGINT,
    "pricing" JSONB NOT NULL,
    "licenseType" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "screenshotUrls" TEXT[],
    "demoVideoUrl" TEXT,
    "compatibility" JSONB NOT NULL,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "activeInstalls" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL,
    "changelog" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "documentationUrl" TEXT,
    "supportUrl" TEXT,
    "sourceCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplacePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageVersion" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changelog" TEXT[],
    "isBreaking" BOOLEAN NOT NULL DEFAULT false,
    "migrationGuide" TEXT,
    "minSdkVersion" TEXT,
    "maxSdkVersion" TEXT,
    "downloadUrl" TEXT NOT NULL,
    "checksumMd5" TEXT,
    "checksumSha256" TEXT,

    CONSTRAINT "PackageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageInstallation" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "assetsUsed" INTEGER NOT NULL DEFAULT 0,
    "apiCalls" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PackageInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagePurchase" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "buyerGameId" TEXT NOT NULL,
    "purchaseType" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "transactionId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionEndsAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PackagePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageReview" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssetToGame" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Game_gameId_key" ON "Game"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_apiKey_key" ON "Game"("apiKey");

-- CreateIndex
CREATE INDEX "Game_gameId_idx" ON "Game"("gameId");

-- CreateIndex
CREATE INDEX "Game_apiKey_idx" ON "Game"("apiKey");

-- CreateIndex
CREATE INDEX "Game_developerId_idx" ON "Game"("developerId");

-- CreateIndex
CREATE UNIQUE INDEX "GameApiKey_keyHash_key" ON "GameApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "GameApiKey_gameId_idx" ON "GameApiKey"("gameId");

-- CreateIndex
CREATE INDEX "GameApiKey_keyHash_idx" ON "GameApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "GameConfigHistory_gameId_idx" ON "GameConfigHistory"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameConfigHistory_gameId_version_key" ON "GameConfigHistory"("gameId", "version");

-- CreateIndex
CREATE INDEX "GameWebhook_gameId_idx" ON "GameWebhook"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetId_key" ON "Asset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_mintAddress_key" ON "Asset"("mintAddress");

-- CreateIndex
CREATE INDEX "Asset_ownerId_idx" ON "Asset"("ownerId");

-- CreateIndex
CREATE INDEX "Asset_assetType_rarity_idx" ON "Asset"("assetType", "rarity");

-- CreateIndex
CREATE INDEX "Asset_isRentable_isListed_idx" ON "Asset"("isRentable", "isListed");

-- CreateIndex
CREATE INDEX "Asset_mintAddress_idx" ON "Asset"("mintAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_listingId_key" ON "Listing"("listingId");

-- CreateIndex
CREATE INDEX "Listing_assetId_idx" ON "Listing"("assetId");

-- CreateIndex
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");

-- CreateIndex
CREATE INDEX "Listing_isAvailable_isActive_idx" ON "Listing"("isAvailable", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Rental_rentalId_key" ON "Rental"("rentalId");

-- CreateIndex
CREATE INDEX "Rental_assetId_idx" ON "Rental"("assetId");

-- CreateIndex
CREATE INDEX "Rental_renterId_idx" ON "Rental"("renterId");

-- CreateIndex
CREATE INDEX "Rental_gameId_idx" ON "Rental"("gameId");

-- CreateIndex
CREATE INDEX "Rental_status_idx" ON "Rental"("status");

-- CreateIndex
CREATE INDEX "Rental_endTime_idx" ON "Rental"("endTime");

-- CreateIndex
CREATE INDEX "Review_assetId_idx" ON "Review"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_assetId_reviewerId_key" ON "Review"("assetId", "reviewerId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_assetId_idx" ON "AnalyticsEvent"("assetId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePackage_packageId_key" ON "MarketplacePackage"("packageId");

-- CreateIndex
CREATE INDEX "MarketplacePackage_type_idx" ON "MarketplacePackage"("type");

-- CreateIndex
CREATE INDEX "MarketplacePackage_category_idx" ON "MarketplacePackage"("category");

-- CreateIndex
CREATE INDEX "MarketplacePackage_creatorId_idx" ON "MarketplacePackage"("creatorId");

-- CreateIndex
CREATE INDEX "MarketplacePackage_featured_idx" ON "MarketplacePackage"("featured");

-- CreateIndex
CREATE INDEX "MarketplacePackage_rating_idx" ON "MarketplacePackage"("rating");

-- CreateIndex
CREATE INDEX "MarketplacePackage_downloads_idx" ON "MarketplacePackage"("downloads");

-- CreateIndex
CREATE INDEX "PackageVersion_packageId_idx" ON "PackageVersion"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageVersion_packageId_version_key" ON "PackageVersion"("packageId", "version");

-- CreateIndex
CREATE INDEX "PackageInstallation_gameId_idx" ON "PackageInstallation"("gameId");

-- CreateIndex
CREATE INDEX "PackageInstallation_packageId_idx" ON "PackageInstallation"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageInstallation_gameId_packageId_key" ON "PackageInstallation"("gameId", "packageId");

-- CreateIndex
CREATE INDEX "PackagePurchase_packageId_idx" ON "PackagePurchase"("packageId");

-- CreateIndex
CREATE INDEX "PackagePurchase_buyerGameId_idx" ON "PackagePurchase"("buyerGameId");

-- CreateIndex
CREATE INDEX "PackageReview_packageId_idx" ON "PackageReview"("packageId");

-- CreateIndex
CREATE INDEX "PackageReview_rating_idx" ON "PackageReview"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "PackageReview_packageId_userId_key" ON "PackageReview"("packageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_AssetToGame_AB_unique" ON "_AssetToGame"("A", "B");

-- CreateIndex
CREATE INDEX "_AssetToGame_B_index" ON "_AssetToGame"("B");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameApiKey" ADD CONSTRAINT "GameApiKey_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameConfigHistory" ADD CONSTRAINT "GameConfigHistory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWebhook" ADD CONSTRAINT "GameWebhook_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageVersion" ADD CONSTRAINT "PackageVersion_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MarketplacePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageInstallation" ADD CONSTRAINT "PackageInstallation_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageInstallation" ADD CONSTRAINT "PackageInstallation_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MarketplacePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagePurchase" ADD CONSTRAINT "PackagePurchase_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MarketplacePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageReview" ADD CONSTRAINT "PackageReview_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MarketplacePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToGame" ADD CONSTRAINT "_AssetToGame_A_fkey" FOREIGN KEY ("A") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToGame" ADD CONSTRAINT "_AssetToGame_B_fkey" FOREIGN KEY ("B") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
