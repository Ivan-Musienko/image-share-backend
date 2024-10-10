import { PartialType } from '@nestjs/mapped-types';
import { CreateSharedImageDto } from './create-shared-image.dto';

export class UpdateSharedImageDto extends PartialType(CreateSharedImageDto) {}
