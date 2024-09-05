import { CoreEntity } from '@app/common/entities/core.entity';
import { Dish } from '@app/restaurants/entities/dish.entity';
import { OrderItem } from '@app/restaurants/entities/order-item.entity';
import { Restaurant } from '@app/restaurants/entities/restaurant.entity';
import { User } from '@app/users/entities/user.entity';
import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber, IsString, Length } from 'class-validator';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @ManyToOne(
    type => User,
    user => user.orders,
    { onDelete: 'SET NULL', nullable: true },
  )
  @Field(type => User, { nullable: true })
  customer?: User;

  @ManyToOne(
    type => User,
    user => user.rides,
    { onDelete: 'SET NULL', nullable: true },
  )
  @Field(type => User, { nullable: true })
  driver?: User;

  @ManyToOne(
    type => Restaurant,
    restaurant => restaurant.orders,
    { onDelete: 'SET NULL', nullable: true },
  )
  @Field(type => Restaurant)
  restaurant: Restaurant;

  @ManyToMany(type => OrderItem)
  @JoinTable()
  @Field(type => [OrderItem])
  items: OrderItem[];

  @Field(type => Number, { nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  total?: number;

  @Field(type => OrderStatus)
  @Column({ type: 'enum', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
