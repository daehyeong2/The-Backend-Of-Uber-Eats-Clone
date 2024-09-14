import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { ILike, Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { User } from '@app/users/entities/user.entity';
import { Category } from './entities/category.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import {
  RestaurantsInput,
  RestaurantsOutput,
} from '@app/restaurants/dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { MyRestaurantsOutput } from './dtos/my-restaurants.dto';

@Injectable()
export class RestaurantService {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly categories: CategoryRepository,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
  ) {}

  pageSize = 5;

  async checkRestaurant(
    ownerId: number,
    restaurantId: number,
  ): Promise<{ ok: boolean; error?: string; restaurant?: Restaurant }> {
    const restaurant = await this.restaurants.findOne(restaurantId);
    if (!restaurant) {
      return { ok: false, error: '가게를 찾을 수 없습니다.' };
    }
    if (ownerId !== restaurant.ownerId) {
      return {
        ok: false,
        error: '해당 가게에 대한 권한이 없습니다.',
      };
    }
    return { ok: true, restaurant };
  }

  async checkDish(
    ownerId: number,
    dishId: number,
  ): Promise<{
    ok: boolean;
    error?: string;
    restaurant?: Restaurant;
    dish?: Dish;
  }> {
    const dish = await this.dishes.findOne(dishId, {
      relations: ['restaurant'],
    });
    if (!dish) {
      return { ok: false, error: '메뉴를 찾을 수 없습니다.' };
    }
    if (ownerId !== dish.restaurant.ownerId) {
      return {
        ok: false,
        error: '해당 가게에 대한 권한이 없습니다.',
      };
    }
    return { ok: true, restaurant: dish.restaurant, dish };
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '가게 생성에 실패했습니다.',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const { restaurant, ...result } = await this.checkRestaurant(
        owner.id,
        editRestaurantInput.restaurantId,
      );
      if (result.error) {
        return result;
      }
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }
      await this.restaurants.save({
        id: editRestaurantInput.restaurantId,
        ...editRestaurantInput,
        ...(category && { category }),
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '가게를 수정할 수 없습니다.',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const { restaurant, ...result } = await this.checkRestaurant(
        owner.id,
        restaurantId,
      );
      if (result.error) {
        return result;
      }
      await this.restaurants.delete(restaurantId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '가게를 삭제할 수 없습니다.',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch {
      return { ok: false, error: '모든 카테고리를 가져오는데 실패했습니다.' };
    }
  }

  async countRestaurantByCategory(category: Category): Promise<number> {
    return this.restaurants.count({ category });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });
      if (!category) {
        return {
          ok: false,
          error: '카테고리를 찾을 수 없습니다.',
        };
      }
      const {
        restaurants,
        totalPages,
        totalResults,
      } = await this.restaurants.findByPagination(
        { where: { category } },
        page,
      );
      return {
        ok: true,
        category,
        totalPages,
        totalResults,
        restaurants,
      };
    } catch {
      return {
        ok: false,
        error: '카테고리를 찾는데 실패했습니다.',
      };
    }
  }

  async allRestaurants(
    restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    try {
      const result = await this.restaurants.findByPagination(
        null,
        restaurantsInput.page,
      );
      if (!result) {
        return {
          ok: false,
          error: '가게를 찾을 수 없습니다.',
        };
      }
      return {
        ok: true,
        totalPages: result.totalPages,
        totalResults: result.totalResults,
        results: result.restaurants,
      };
    } catch {
      return {
        ok: false,
        error: '가게를 불러오는데 실패했습니다.',
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu'],
        order: {
          isPromoted: 'DESC',
        },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: '가게를 찾을 수 없습니다.',
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch {
      return {
        ok: false,
        error: '가게를 찾는데 실패했습니다.',
      };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const searchTerm = query.replaceAll('%', '').replaceAll('_', '');
      const result = await this.restaurants.findByPagination(
        { where: { name: ILike(`%${searchTerm}%`) } },
        page,
      );
      if (!result) {
        return {
          ok: false,
          error: '가게를 찾을 수 없습니다.',
        };
      }
      return {
        ok: true,
        ...result,
      };
    } catch {
      return {
        ok: false,
        error: '가게를 검색하는데 실패했습니다.',
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const { restaurant, ...result } = await this.checkRestaurant(
        owner.id,
        createDishInput.restaurantId,
      );
      if (result.error) {
        return result;
      }
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '메뉴를 추가할 수 없습니다.',
      };
    }
  }

  async deleteDish(
    owner: User,
    deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const { restaurant, ...result } = await this.checkDish(
        owner.id,
        deleteDishInput.dishId,
      );
      if (result.error) {
        return result;
      }
      await this.dishes.delete(deleteDishInput.dishId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '메뉴를 삭제할 수 없습니다.',
      };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const { restaurant, ...result } = await this.checkDish(
        owner.id,
        editDishInput.dishId,
      );
      if (result.error) {
        return result;
      }
      await this.dishes.save({ id: editDishInput.dishId, ...editDishInput });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '메뉴를 수정할 수 없습니다.',
      };
    }
  }

  async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
    try {
      const restaurants = await this.restaurants.find({ owner });
      return {
        ok: true,
        restaurants,
      };
    } catch {
      return {
        ok: false,
        error: '가게를 불러오는데 실패했습니다.',
      };
    }
  }
}
