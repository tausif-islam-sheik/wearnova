import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get reviews for a seller' })
  async findBySeller(@Query('sellerId') sellerId?: string) {
    if (!sellerId) throw new BadRequestException('sellerId query param is required');
    return this.reviewsService.findBySeller(sellerId);
  }

  @Get('admin/list')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all reviews including hidden ones (admin only)' })
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('visibility') visibility?: string,
    @Query('rating') rating?: string,
    @Query('search') search?: string,
  ) {
    return this.reviewsService.findAllForAdmin({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      visibility,
      rating: rating ? Number(rating) : undefined,
      search,
    });
  }

  @Audited({
    action: 'review.hide',
    targetType: 'review',
    summary: ({ req }) => `${req.body.hidden ? 'Hid' : 'Restored'} review ${(req.params.id ?? '').slice(-8)}`,
  })
  @Patch(':id/hidden')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide or restore a review (admin only)' })
  async setHidden(@Param('id') id: string, @Body() body: { hidden?: boolean }) {
    if (typeof body?.hidden !== 'boolean') {
      throw new BadRequestException('`hidden` must be true or false');
    }
    return this.reviewsService.setHidden(id, body.hidden);
  }

  @Get('eligibility')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check if current user can review a seller' })
  async checkEligibility(
    @Query('sellerId') sellerId?: string,
    @CurrentUser() currentUser?: { id: string },
  ) {
    if (!sellerId) throw new BadRequestException('sellerId query param is required');
    if (!currentUser) throw new BadRequestException('Authentication required');
    return this.reviewsService.checkEligibility(currentUser.id, sellerId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a review' })
  async create(@Body() dto: CreateReviewDto, @CurrentUser() currentUser?: { id: string }) {
    if (!currentUser) throw new BadRequestException('Authentication required');
    return this.reviewsService.create(currentUser.id, dto);
  }
}
