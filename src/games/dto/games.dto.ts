import { IsString, IsOptional, IsArray, IsObject, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class CreateGameDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsArray()
  supportedTypes: string[];
}

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  environment?: 'test' | 'production';

  @IsOptional()
  @IsArray()
  permissions?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  rateLimitPerMinute?: number;
}

export class UpdateGameConfigDto {
  @IsOptional()
  @IsObject()
  visuals?: any;

  @IsOptional()
  @IsObject()
  attributes?: any;

  @IsOptional()
  @IsObject()
  behaviors?: any;

  @IsOptional()
  @IsObject()
  filters?: any;
}

