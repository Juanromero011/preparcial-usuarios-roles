import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  UseFilters,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthErrorsFilter } from '../common/auth-errors.filter.js';
import { AssignRolesDto } from './dto/assign-roles.dto.js';
import type { User } from './user.entity.js';
import { UsersPolicy } from './users.policy.js';
import { UsersService } from './users.service.js';

/** Un id que no es uuid no puede ser de ningún usuario: 404, no 400. */
const UserIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new NotFoundException('Usuario no encontrado'),
});

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseFilters(AuthErrorsFilter)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Va antes de cualquier ruta /users/:id para que "me" no se lea como un id.
  // @Can.Anyone(): basta estar autenticado (sin token, el paquete responde 401).
  @Get('me')
  @Can.Anyone()
  me(@CurrentUser() user: User) {
    return this.users.getProfile(user.id);
  }

  @Get()
  @Can(UsersPolicy, 'list')
  findAll() {
    return this.users.findAll();
  }

  @Patch(':id/roles')
  @Can(UsersPolicy, 'assignRoles')
  assignRoles(@Param('id', UserIdPipe) id: string, @Body() dto: AssignRolesDto) {
    return this.users.assignRoles(id, dto.roles);
  }

  @Delete(':id')
  @Can(UsersPolicy, 'remove')
  remove(@Param('id', UserIdPipe) id: string, @CurrentUser() user: User) {
    return this.users.remove(id, user.id);
  }
}
