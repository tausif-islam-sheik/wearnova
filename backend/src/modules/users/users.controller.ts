import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  Post,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (public profile fields only)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Get('admin/list')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users with contact details (admin only)' })
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
      },
      { admin: true },
    );
  }

  @Audited({
    action: 'user.suspend',
    targetType: 'user',
    summary: ({ req, res }) => `${req.body.suspended ? 'Suspended' : 'Restored access for'} ${String(res?.name ?? req.params.id)}`,
  })
  @Patch(':id/suspend')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend or restore a user (admin only)' })
  async setSuspended(
    @Param('id') id: string,
    @Body() body: { suspended?: boolean },
    @CurrentUser() admin: { id: string },
  ) {
    if (typeof body?.suspended !== 'boolean') {
      throw new BadRequestException('`suspended` must be true or false');
    }
    return this.usersService.setSuspended(id, body.suspended, admin.id);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: "List a user's followers" })
  async getFollowers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getFollowers({
      userId: id,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'List who a user is following' })
  async getFollowing(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getFollowing({
      userId: id,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id/followers/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check whether the current user follows a user' })
  async getFollowStatus(@Param('id') id: string, @CurrentUser() currentUser: { id: string }) {
    return this.usersService.getFollowStatus(id, currentUser.id);
  }

  @Post(':id/follow')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Follow a user' })
  async follow(@Param('id') id: string, @CurrentUser() currentUser: { id: string }) {
    return this.usersService.follow(id, currentUser.id);
  }

  @Delete(':id/follow')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollow(@Param('id') id: string, @CurrentUser() currentUser: { id: string }) {
    return this.usersService.unfollow(id, currentUser.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update user profile' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: { id: string },
  ) {
    return this.usersService.update(id, dto, currentUser.id);
  }
}
