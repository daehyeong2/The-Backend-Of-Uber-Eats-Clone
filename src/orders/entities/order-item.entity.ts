import { CoreEntity } from '@app/common/entities/core.entity';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Dish, DishChoice } from '../../restaurants/entities/dish.entity';

@InputType('OrderItemOptionInputType')
@ObjectType()
export class OrderItemOption {
  @Field(type => String)
  name: string;

  @Field(type => DishChoice, { nullable: true })
  choice?: DishChoice;

  @Field(type => Number, { nullable: true, defaultValue: 0 })
  extra?: number;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
  @ManyToOne(type => Dish, { nullable: true, onDelete: 'CASCADE' })
  dish: Dish;

  @Field(type => [OrderItemOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: OrderItemOption[];
}
