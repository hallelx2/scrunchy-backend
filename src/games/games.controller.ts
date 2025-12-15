import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto, CreateApiKeyDto, UpdateGameConfigDto } from './dto/games.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';

@Controller('api/games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get()
  async findAll() {
    return this.gamesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.gamesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async registerGame(@Request() req, @Body() dto: CreateGameDto) {
    return this.gamesService.registerGame(req.user.id, dto);
  }

  @Post(':id/api-keys')
  @UseGuards(JwtAuthGuard)
  async createApiKey(@Param('id') id: string, @Request() req, @Body() dto: CreateApiKeyDto) {
    return this.gamesService.createApiKey(id, req.user.id, dto);
  }

  @Get(':id/api-keys')
  @UseGuards(JwtAuthGuard)
  async listApiKeys(@Param('id') id: string, @Request() req) {
    return this.gamesService.listApiKeys(id, req.user.id);
  }

  @Post(':id/api-keys/:keyId/revoke')
  @UseGuards(JwtAuthGuard)
  async revokeApiKey(@Param('id') id: string, @Param('keyId') keyId: string, @Request() req) {
    return this.gamesService.revokeApiKey(id, req.user.id, keyId);
  }

  @Get(':id/config')
  @UseGuards(ApiKeyGuard)
  async getConfig(@Param('id') id: string) {
    return this.gamesService.getGameConfig(id);
  }

  @Put(':id/config')
  @UseGuards(JwtAuthGuard)
  async updateConfig(@Param('id') id: string, @Request() req, @Body() dto: UpdateGameConfigDto) {
    return this.gamesService.updateGameConfig(id, req.user.id, dto);
  }

  @Get(':id/config/history')
  @UseGuards(JwtAuthGuard)
  async getConfigHistory(@Param('id') id: string, @Request() req) {
    return this.gamesService.getConfigHistory(id, req.user.id);
  }

  @Post(':id/config/rollback')
  @UseGuards(JwtAuthGuard)
  async rollbackConfig(@Param('id') id: string, @Request() req, @Body() body: { version: string }) {
    return this.gamesService.rollbackConfig(id, req.user.id, body.version);
  }
}
