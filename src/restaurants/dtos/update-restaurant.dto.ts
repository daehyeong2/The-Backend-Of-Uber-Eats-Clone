import { ArgsType, Field, InputType, PartialType } from '@nestjs/graphql';
import { createRestaurantDto } from './create-restaurant.dto';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
class updateRestaurantInputType extends PartialType(createRestaurantDto) {}

@ArgsType()
export class UpdateRestaurantDto {
  @Field(type => Number)
  id: number;

  @Field(type => updateRestaurantInputType)
  @ValidateNested()
  @Type(() => updateRestaurantInputType)
  data: updateRestaurantInputType;
}
