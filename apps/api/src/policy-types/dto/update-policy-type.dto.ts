import { PartialType } from '@nestjs/mapped-types';
import { CreatePolicyTypeDto } from './create-policy-type.dto';

export class UpdatePolicyTypeDto extends PartialType(CreatePolicyTypeDto) {}
