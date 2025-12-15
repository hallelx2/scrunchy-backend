import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MarketplacePackagesService } from './marketplace-packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../games/guards/api-key.guard';

@Controller('api/marketplace/packages')
export class MarketplacePackagesController {
  constructor(private packagesService: MarketplacePackagesService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.packagesService.findAll(query);
  }

  @Get(':packageId')
  async findOne(@Param('packageId') packageId: string) {
    return this.packagesService.findOne(packageId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPackage(@Request() req, @Body() body: any) {
    return this.packagesService.createPackage(req.user.id, body);
  }

  @Post(':packageId/install')
  @UseGuards(ApiKeyGuard)
  async installPackage(
    @Request() req,
    @Param('packageId') packageId: string,
    @Body() body: { installationToken: string },
  ) {
    return this.packagesService.installPackage(req.gameId, packageId, body.installationToken);
  }

  @Get('installed')
  @UseGuards(ApiKeyGuard)
  async getInstalledPackages(@Request() req) {
    return this.packagesService.getInstalledPackages(req.gameId);
  }
}

