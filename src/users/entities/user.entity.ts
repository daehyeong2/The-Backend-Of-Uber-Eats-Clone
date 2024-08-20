import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { Column, Entity } from 'typeorm';
import { IsEmail, IsString } from 'class-validator';

type UserRole = 'client' | 'owner' | 'delivery';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Field(type => String)
  @Column()
  @IsEmail()
  email: string;

  @Field(type => String)
  @Column()
  @IsString()
  password: string;

  @Field(type => String)
  @Column()
  @IsString()
  role: UserRole;
}
