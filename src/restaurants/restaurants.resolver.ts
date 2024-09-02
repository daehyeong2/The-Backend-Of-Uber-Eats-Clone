import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantInput } from './dtos/create-restaurant.dto';
import { CreateAccountOutput } from '@app/users/dtos/create-account.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@app/auth/auth.guard';
import { AuthUser } from '@app/auth/auth-user.decorator';
import { User } from '@app/users/entities/user.entity';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @UseGuards(AuthGuard)
  @Mutation(returns => CreateAccountOutput)
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateAccountOutput> {
    return this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }
}
