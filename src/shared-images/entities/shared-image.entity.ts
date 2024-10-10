import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class SharedImage {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column()
  Uuid: string;

  @Column()
  FileName: string;

  @Column()
  Url: string;

  @ManyToOne(() => User, (user) => user.SharedImages)
  @JoinColumn()
  Author: User;
}
