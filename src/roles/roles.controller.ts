import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
} from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthErrorsFilter } from '../common/auth-errors.filter.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { RolesPolicy } from './roles.policy.js';
import { RolesService } from './roles.service.js';

/** Un id que no es uuid no puede ser de ningún rol: 404, no 400. */
const RoleIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new NotFoundException('Rol no encontrado'),
});

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseFilters(AuthErrorsFilter)
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Post()
  @Can(RolesPolicy, 'create')
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Get()
  @Can(RolesPolicy, 'list')
  findAll() {
    return this.roles.findAll();
  }

  @Delete(':id')
  @Can(RolesPolicy, 'remove')
  remove(@Param('id', RoleIdPipe) id: string) {
    return this.roles.remove(id);
  }
}
