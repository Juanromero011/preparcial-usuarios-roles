import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from '../roles/roles.module.js';
import { User } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersPolicy } from './users.policy.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RolesModule],
  controllers: [UsersController],
  providers: [UsersService, UsersPolicy],
  exports: [UsersService],
})
export class UsersModule {}
