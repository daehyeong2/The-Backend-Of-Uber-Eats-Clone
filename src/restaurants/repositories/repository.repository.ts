import { EntityRepository, Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';

@EntityRepository(Restaurant)
export class RestaurantRepository extends Repository<Restaurant> {
  pageSize = 5;

  async findByPagination(options, page: number) {
    const [restaurants, totalResults] = await this.findAndCount({
      ...options,
      take: this.pageSize,
      skip: (page - 1) * this.pageSize,
    });
    if (!restaurants) {
      return null;
    }
    return {
      restaurants,
      totalResults,
      totalPages: Math.ceil(totalResults / this.pageSize),
    };
  }
}
