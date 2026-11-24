import { Body, Controller, Get, Post, UseFilters } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthErrorsFilter } from '../common/auth-errors.filter.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { RolesPolicy } from './roles.policy.js';
import { RolesService } from './roles.service.js';

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
}
