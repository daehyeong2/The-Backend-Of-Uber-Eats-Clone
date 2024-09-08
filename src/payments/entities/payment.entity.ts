import { CoreEntity } from '@app/common/entities/core.entity';
import { Restaurant } from '@app/restaurants/entities/restaurant.entity';
import { User } from '@app/users/entities/user.entity';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field(type => String)
  @Column()
  transactionId: number;

  @ManyToOne(
    type => User,
    user => user.payments,
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  @Field(type => User, { nullable: true })
  user?: User;

  @RelationId((payment: Payment) => payment.user)
  userId?: number;

  @Field(type => Restaurant)
  @ManyToOne(type => Restaurant)
  restaurant: Restaurant;

  @Field(type => Int)
  @RelationId((payment: Payment) => payment.restaurant)
  restaurantId: number;
}
