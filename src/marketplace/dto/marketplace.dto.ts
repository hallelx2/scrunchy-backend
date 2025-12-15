import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  pricePerHour: string; // In lamports

  @IsString()
  @IsNotEmpty()
  pricePerDay: string; // In lamports

  @IsNumber()
  @Min(1)
  maxRentalDuration: number; // seconds

  @IsNumber()
  @Min(1)
  minRentalDuration: number; // seconds

  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;
}

export class RentAssetDto {
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @IsNumber()
  @Min(1)
  duration: number; // seconds

  @IsOptional()
  @IsString()
  gameId?: string;
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  pricePerHour?: string;

  @IsOptional()
  @IsString()
  pricePerDay?: string;

  @IsOptional()
  @IsNumber()
  maxRentalDuration?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

