import { CoreEntity } from '@app/common/entities/core.entity';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field(type => String)
  @Column()
  @IsString()
  @Length(5, 24)
  name: string;

  @Field(type => Number)
  @Column()
  @IsNumber()
  @Length(1, 9999999) // 1 to 9,999,999
  price: number;

  @Field(type => String)
  @Column()
  @IsString()
  photo: string;

  @Field(type => String)
  @Column()
  @IsString()
  @Length(5, 140)
  description: string;

  @Field(type => Restaurant)
  @ManyToOne(
    type => Restaurant,
    restaurant => restaurant.menu,
    { onDelete: 'CASCADE' },
  )
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;
}
