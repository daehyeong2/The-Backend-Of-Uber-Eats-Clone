import { CoreOutput } from '@app/common/dtos/output.dto';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { DishOption } from '@app/restaurants/entities/dish.entity';

@InputType()
class CreateOrderItemInput {
  @Field(type => Int)
  dishId: number;

  @Field(type => DishOption, { nullable: true })
  options?: DishOption;
}

@InputType()
export class CreateOrderInput {
  @Field(type => Int)
  restaurantId: number;

  @Field(type => [CreateOrderItemInput])
  items: CreateOrderItemInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
