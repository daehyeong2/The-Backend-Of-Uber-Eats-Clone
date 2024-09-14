import { CoreOutput } from '@app/common/dtos/output.dto';
import { Field, ObjectType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';

@ObjectType()
export class MyRestaurantsOutput extends CoreOutput {
  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
