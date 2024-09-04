import { Module } from '@nestjs/common';
import { CategoryResolver, RestaurantResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantService } from './restaurant.service';
import { CategoryRepository } from './repositories/category.repository';
import { RestaurantRepository } from './repositories/repository.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantRepository, CategoryRepository]),
  ],
  providers: [RestaurantResolver, RestaurantService, CategoryResolver],
})
export class RestaurantsModule {}
