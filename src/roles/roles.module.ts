import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity.js';
import { RolesController } from './roles.controller.js';
import { RolesPolicy } from './roles.policy.js';
import { RolesService } from './roles.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  controllers: [RolesController],
  // Una policy es un provider más: AuthorizationModule la encuentra sola.
  providers: [RolesService, RolesPolicy],
  exports: [RolesService],
})
export class RolesModule {}
