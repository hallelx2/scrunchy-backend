import { IsString, IsNotEmpty } from 'class-validator';

export class NonceRequestDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

export class VerifyRequestDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class AuthResponseDto {
  token: string;
  user: {
    id: string;
    walletAddress: string;
    username?: string;
    createdAt: Date;
  };
}

