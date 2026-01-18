import { PartialType } from '@nestjs/mapped-types';
import { CreateInsurancePackageDto } from './create-insurance-package.dto';

export class UpdateInsurancePackageDto extends PartialType(CreateInsurancePackageDto) {}
