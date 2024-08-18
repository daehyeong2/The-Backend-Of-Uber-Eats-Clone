import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { createRestaurantDto } from './dtos/create-restaurant.dto';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  @Query(returns => [Restaurant])
  myRestaurant(
    @Args('veganOnly', { nullable: true }) veganOnly: boolean,
  ): Restaurant[] {
    console.log(veganOnly);
    return [];
  }
  @Mutation(returns => Boolean)
  createRestaurant(@Args() createRestaurantDto: createRestaurantDto): boolean {
    console.log(createRestaurantDto);
    return true;
  }
}
