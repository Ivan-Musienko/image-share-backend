import { SharedImage } from 'src/shared-images/entities/shared-image.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({
    nullable: false,
  })
  FirstName: string;

  @Column({
    nullable: true,
  })
  LastName: string;
  @Column({
    nullable: false,
  })
  Email: string;

  @Column({
    nullable: true,
    select: false,
  })
  Password: string;

  @Column({
    nullable: false,
  })
  Avatar: string;

  @OneToMany(() => SharedImage, (sharedImage) => sharedImage.Author)
  SharedImages: SharedImage[];

  @Column({
    nullable: false,
  })
  Provider: string;
}
