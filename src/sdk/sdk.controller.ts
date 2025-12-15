import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SdkService } from './sdk.service';
import { ApiKeyGuard } from '../games/guards/api-key.guard';

@Controller('api/sdk')
export class SdkController {
  constructor(private sdkService: SdkService) {}

  @Post('check-access')
  @UseGuards(ApiKeyGuard)
  async checkAccess(@Request() req, @Body() body: { walletAddress: string; assetId: string }) {
    return this.sdkService.checkAccess(req.gameId, body.walletAddress, body.assetId);
  }

  @Get('players/:walletAddress/assets')
  @UseGuards(ApiKeyGuard)
  async getPlayerAssets(@Request() req, @Param('walletAddress') walletAddress: string) {
    return this.sdkService.getPlayerAssets(req.gameId, walletAddress);
  }

  @Get('assets/:assetId')
  @UseGuards(ApiKeyGuard)
  async getAsset(@Request() req, @Param('assetId') assetId: string) {
    return this.sdkService.getAsset(req.gameId, assetId);
  }

  @Post('assets/batch')
  @UseGuards(ApiKeyGuard)
  async batchGetAssets(@Request() req, @Body() body: { assetIds: string[] }) {
    return this.sdkService.batchGetAssets(req.gameId, body.assetIds);
  }
}
