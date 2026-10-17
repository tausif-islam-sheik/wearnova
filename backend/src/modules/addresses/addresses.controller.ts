import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { AddressDto } from './dto/address.dto';

type AuthedRequest = { user: { id: string } };

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  @ApiOperation({ summary: "List the signed-in user's saved addresses" })
  list(@Req() req: AuthedRequest) {
    return this.addresses.list(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save an address' })
  create(@Req() req: AuthedRequest, @Body() dto: AddressDto) {
    return this.addresses.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a saved address' })
  update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: AddressDto) {
    return this.addresses.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved address' })
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.addresses.remove(req.user.id, id);
  }
}
