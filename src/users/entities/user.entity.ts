import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, Length } from 'class-validator';
import { CoreEntity } from '@app/common/entities/core.entity';
import { Restaurant } from '@app/restaurants/entities/restaurant.entity';
import { Order } from '@app/orders/entities/order.entity';
import { Payment } from '@app/payments/entities/payment.entity';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Field(type => String)
  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Field(type => String)
  @Column({ select: false })
  password: string;

  @Field(type => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(type => Boolean)
  @IsBoolean()
  verified: boolean;

  @Field(type => [Restaurant])
  @OneToMany(
    type => Restaurant,
    restaurant => restaurant.owner,
    { onDelete: 'SET NULL' },
  )
  restaurants: Restaurant[];

  @Field(type => [Order])
  @OneToMany(
    type => Order,
    order => order.customer,
  )
  orders: Order[];

  @Field(type => [Payment])
  @OneToMany(
    type => Payment,
    payment => payment.user,
  )
  payments: Payment[];

  @Field(type => [Order])
  @OneToMany(
    type => Order,
    order => order.driver,
  )
  rides: Order[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (e) {
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      const ok = await bcrypt.compare(aPassword, this.password);
      return ok;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }
}
