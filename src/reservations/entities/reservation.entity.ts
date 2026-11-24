
//id(PK , UUID)
//ID_USER (FK User, UUID, NOT NULL)
//ID_SPOT (FK PARKING_SPOTS, UUID, NOT NULL)
//DATE (Date, NOT NULL)
//VEHICLE_PLATE (String, NOT NULL, FORMATO ABC123)
//VEHICLE_MAX_CHARGE (ENUM ['standard', 'fast', 'ultra_fast'], NOT NULL)
//STATUS (ENUM ["pending", "completed", "canceled"], DEFAULT "pending")
//created_at(timestamp,default now)

import { User } from "../../users/user.entity.js";
import { ParkingSpot } from "../../parking-spots/entities/parking-spot.entity.js";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('reservations')
export class Reservation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.reservations)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => ParkingSpot, (parkingSpot) => parkingSpot.reservations)
    @JoinColumn({ name: 'id_spot' })
    parkingSpot: ParkingSpot;

    @Column({ type: 'date', nullable: false })
    date: Date;

    @Column({ type: 'varchar', length: 6, nullable: false })
    vehicle_plate: string;

    @Column({ type: 'enum', enum: ['standard', 'fast', 'ultra_fast'], nullable: false })
    vehicle_max_charge: 'standard' | 'fast' | 'ultra_fast';

    @Column({ type: 'enum', enum: ["pending", "completed", "canceled"], default: "pending" })
    status: "pending" | "completed" | "canceled";

    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}