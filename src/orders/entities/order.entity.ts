import { CoreEntity } from '@app/common/entities/core.entity';
import { Restaurant } from '@app/restaurants/entities/restaurant.entity';
import { User } from '@app/users/entities/user.entity';
import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  Cooked = 'Cooked',
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
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  @Field(type => User, { nullable: true })
  customer?: User;

  @RelationId((order: Order) => order.customer)
  customerId?: number;

  @ManyToOne(
    type => User,
    user => user.rides,
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  @Field(type => User, { nullable: true })
  driver?: User;

  @RelationId((order: Order) => order.driver)
  driverId?: number;

  @ManyToOne(
    type => Restaurant,
    restaurant => restaurant.orders,
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  @Field(type => Restaurant, { nullable: true })
  restaurant?: Restaurant;

  @ManyToMany(type => OrderItem, { eager: true })
  @JoinTable()
  @Field(type => [OrderItem])
  items: OrderItem[];

  @Field(type => Number, { nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  total?: number;

  @Field(type => OrderStatus, { defaultValue: OrderStatus.Pending })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
