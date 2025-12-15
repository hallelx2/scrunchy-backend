import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { GetAssetsQueryDto, CreateAssetDto } from './dto/assets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/assets')
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Get()
  async findAll(@Query() query: GetAssetsQueryDto) {
    return this.assetsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() dto: CreateAssetDto) {
    return this.assetsService.createAsset(req.user.id, dto);
  }

  @Post('sync/:mintAddress')
  @UseGuards(JwtAuthGuard)
  async syncFromChain(@Param('mintAddress') mintAddress: string) {
    return this.assetsService.syncFromChain(mintAddress);
  }
}

