import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { AssetType, Rarity } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  imageUrl: string;

  @IsEnum(AssetType)
  assetType: AssetType;

  @IsEnum(Rarity)
  rarity: Rarity;

  @IsOptional()
  baseAttributes?: Record<string, any>;

  @IsOptional()
  gameMappings?: Record<string, any>;

  @IsOptional()
  rentalConfig?: {
    pricePerHour?: string;
    pricePerDay?: string;
    maxRentalDuration?: number;
    minRentalDuration?: number;
  };
}

export class GetAssetsQueryDto {
  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;

  @IsOptional()
  @IsEnum(Rarity)
  rarity?: Rarity;

  @IsOptional()
  rentable?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'rarity' | 'created' | 'popular';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

