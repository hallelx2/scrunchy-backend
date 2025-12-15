import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { NonceRequestDto, VerifyRequestDto, AuthResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('nonce')
  async getNonce(@Body() dto: NonceRequestDto) {
    const { nonce, expiresAt } = await this.authService.generateNonce(dto.walletAddress);
    return { nonce, expiresAt };
  }

  @Post('verify')
  async verify(@Body() dto: VerifyRequestDto): Promise<AuthResponseDto> {
    return this.authService.verifyAndCreateUser(
      dto.walletAddress,
      dto.signature,
      dto.message,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return {
      id: req.user.id,
      walletAddress: req.user.walletAddress,
      username: req.user.username,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl,
      bio: req.user.bio,
      createdAt: req.user.createdAt,
    };
  }
}

