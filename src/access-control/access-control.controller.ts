import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../games/guards/api-key.guard';

@Controller('api/access-control')
export class AccessControlController {
  constructor(private accessControlService: AccessControlService) {}

  @Get('verify/:mintAddress/:walletAddress')
  async verifyAccess(
    @Param('mintAddress') mintAddress: string,
    @Param('walletAddress') walletAddress: string,
  ) {
    return this.accessControlService.verifyAccess(mintAddress, walletAddress);
  }

  @Post('verify/batch')
  @UseGuards(ApiKeyGuard)
  async batchVerifyAccess(
    @Body() body: { mintAddresses: string[]; walletAddress: string },
  ) {
    return this.accessControlService.batchVerifyAccess(
      body.mintAddresses,
      body.walletAddress,
    );
  }

  @Post('invalidate/:mintAddress')
  @UseGuards(JwtAuthGuard)
  async invalidateCache(
    @Param('mintAddress') mintAddress: string,
    @Body() body: { walletAddress?: string },
  ) {
    await this.accessControlService.invalidateAccessCache(
      mintAddress,
      body.walletAddress,
    );
    return { success: true };
  }
}

