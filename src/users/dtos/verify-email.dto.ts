import { ArgsType, ObjectType, PickType } from '@nestjs/graphql';
import { Verification } from '../entities/verification.entity';
import { CoreOutput } from '@app/common/dtos/output.dto';

@ObjectType()
export class VerifyEmailOutput extends CoreOutput {}

@ArgsType()
export class VerifyEmailInput extends PickType(
  Verification,
  ['code'],
  ArgsType,
) {}
