import { CoreOutput } from '@app/common/dtos/output.dto';
import { Dish } from '@app/restaurants/entities/dish.entity';
import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from '../entities/order.entity';

@InputType()
export class CreateOrderInput extends PickType(Order, ['dishes']) {
  @Field(type => Int)
  restaurantId: number;
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
