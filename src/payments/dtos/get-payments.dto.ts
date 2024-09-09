import { CoreOutput } from '@app/common/dtos/output.dto';
import { Field, ObjectType } from '@nestjs/graphql';
import { Payment } from '../entities/payment.entity';

@ObjectType()
export class GetPaymentsOutput extends CoreOutput {
  @Field(type => [Payment], { nullable: true })
  payments?: Payment[];
}
