import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MaxLength(12)
  @MinLength(2)
  FirstName: string;

  @IsOptional()
  @MinLength(2)
  @MaxLength(12)
  @IsString()
  LastName?: string;

  @MinLength(8)
  @MaxLength(20)
  @IsString()
  Password: string;

  @MaxLength(30)
  @IsString()
  Email: string;

  Avatar: string;
}
