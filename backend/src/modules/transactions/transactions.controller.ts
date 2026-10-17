import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List transactions (sellers see their own payouts, admins see all)',
  })
  async findAll(
    @Req() req: { user: { id: string; role: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      userId: req.user.id,
      isAdmin: req.user.role === 'admin',
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a single transaction (admins see any, sellers only their own)',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: { user: { id: string; role: string } },
  ) {
    return this.transactionsService.findOne(id, req.user.id, req.user.role === 'admin');
  }
}
