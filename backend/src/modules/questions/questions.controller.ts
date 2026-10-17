import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Questions')
@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('listings/:listingId/questions')
  @ApiOperation({ summary: 'Get questions & replies for a listing' })
  async findByListing(@Param('listingId') listingId: string) {
    return this.questionsService.findByListing(listingId);
  }

  @Post('listings/:listingId/questions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Ask a question on a listing' })
  async createQuestion(
    @Param('listingId') listingId: string,
    @Body() dto: CreateQuestionDto,
    @CurrentUser() currentUser?: { id: string },
  ) {
    if (!currentUser) throw new BadRequestException('Authentication required');
    return this.questionsService.createQuestion(listingId, currentUser.id, dto.text);
  }

  @Post('questions/:questionId/replies')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Reply to a question' })
  async createReply(
    @Param('questionId') questionId: string,
    @Body() dto: CreateReplyDto,
    @CurrentUser() currentUser?: { id: string },
  ) {
    if (!currentUser) throw new BadRequestException('Authentication required');
    return this.questionsService.createReply(questionId, currentUser.id, dto.text);
  }
}
