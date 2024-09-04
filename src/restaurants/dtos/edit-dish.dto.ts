import {
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import { Dish } from '../entities/dish.entity';
import { CoreOutput } from '@app/common/dtos/output.dto';

@InputType()
export class EditDishInput extends OmitType(PartialType(Dish), [
  'id',
  'createdAt',
  'updatedAt',
  'restaurant',
  'restaurantId',
]) {
  @Field(type => Int)
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
