import { Module } from '@nestjs/common';
import { ParkingSpotsService } from './parking-spots.service.js';
import { ParkingSpotsController } from './parking-spots.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ParkingSpot } from './entities/parking-spot.entity.js';
@Module({
  imports: [TypeOrmModule.forFeature([ParkingSpot])],
  controllers: [ParkingSpotsController],
  providers: [ParkingSpotsService, reservations],

})
export class ParkingSpotsModule { }
