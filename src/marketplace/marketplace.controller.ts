import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto, RentAssetDto, UpdateListingDto } from './dto/marketplace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/marketplace')
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Get('listings')
  async getListings(@Query() query: any) {
    return this.marketplaceService.getListings(query);
  }

  @Get('listings/:id')
  async getListing(@Param('id') id: string) {
    // TODO: Implement get single listing
    return { message: 'Get single listing - to be implemented' };
  }

  @Post('listings')
  @UseGuards(JwtAuthGuard)
  async createListing(@Request() req, @Body() dto: CreateListingDto) {
    return this.marketplaceService.createListing(req.user.id, dto);
  }

  @Put('listings/:id')
  @UseGuards(JwtAuthGuard)
  async updateListing(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.marketplaceService.updateListing(req.user.id, id, dto);
  }

  @Post('rentals')
  @UseGuards(JwtAuthGuard)
  async rentAsset(@Request() req, @Body() dto: RentAssetDto) {
    return this.marketplaceService.rentAsset(req.user.id, dto);
  }

  @Post('rentals/:id/complete')
  @UseGuards(JwtAuthGuard)
  async completeRental(@Request() req, @Param('id') id: string) {
    return this.marketplaceService.completeRental(req.user.id, id);
  }

  @Get('rentals/me')
  @UseGuards(JwtAuthGuard)
  async getMyRentals(@Request() req, @Query() query: any) {
    return this.marketplaceService.getRentals(req.user.id, query);
  }
}
