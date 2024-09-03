import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantInput } from './create-restaurant.dto';
import { CoreOutput } from '@app/common/dtos/output.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput) {
  @Field(type => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}
