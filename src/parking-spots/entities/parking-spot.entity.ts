import { User } from "../../users/user.entity.js";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { JoinColumn } from "typeorm";
import { Reservation } from "../../reservations/entities/reservation.entity.js";
@Entity('parking_spots')
export class ParkingSpot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', unique: true, nullable: false })
    code: string;

    @Column({ type: 'enum', enum: ['standard', 'fast', 'ultra_fast'], nullable: false })
    charger_type: 'standard' | 'fast' | 'ultra_fast';

    @ManyToOne(() => User, (user) => user.parking_spots)
    @JoinColumn({ name: 'id_supervisor' })
    supervisor: User;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @OneToMany(() => Reservation, (reservation) => reservation.parkingSpot)
    reservations: Reservation[];
}


//ID ( PK, UUID)
//CODE (String, unico, not null)
//charger_type (ENUM ['standard', 'fast', 'ultra_fast'], NOT NULL)
//id_supervisor(fk user,uuid, not null)
//created_at (timestamp, default now)

